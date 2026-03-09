/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createSlasClient, getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createScapiSchemasClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import type {SlasComponents} from '@salesforce/b2c-tooling-sdk/clients';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {getGuestToken} from '@salesforce/b2c-tooling-sdk/slas';
import {randomBytes} from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import type {SchemaEntry} from './api-browser-tree-provider.js';

type SlasClientEntry = SlasComponents['schemas']['Client'];

type ApiType = 'Admin' | 'Shopper';

function deriveTenantId(hostname: unknown): string {
  const firstPart = hostname && typeof hostname === 'string' ? (hostname.split('.')[0] ?? '') : '';
  return firstPart ? firstPart.replace(/-/g, '_') : '';
}

/**
 * Set the default value for organizationId parameters throughout the spec
 * so users don't have to fill it in manually for "Try it out".
 */
function prefillOrganizationId(spec: Record<string, unknown>, organizationId: string): void {
  const setDefault = (params: unknown) => {
    if (!Array.isArray(params)) return;
    for (const param of params) {
      if (param?.name === 'organizationId') {
        if (param.schema && typeof param.schema === 'object') {
          (param.schema as Record<string, unknown>).default = organizationId;
        } else {
          param.schema = {type: 'string', default: organizationId};
        }
      }
    }
  };

  // Components-level parameters
  const components = spec.components as Record<string, unknown> | undefined;
  if (components?.parameters && typeof components.parameters === 'object') {
    for (const param of Object.values(components.parameters as Record<string, Record<string, unknown>>)) {
      if (param.name === 'organizationId') {
        if (param.schema && typeof param.schema === 'object') {
          (param.schema as Record<string, unknown>).default = organizationId;
        } else {
          param.schema = {type: 'string', default: organizationId};
        }
      }
    }
  }

  // Path-level and operation-level parameters
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return;
  const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head'];
  for (const pathItem of Object.values(paths)) {
    setDefault(pathItem.parameters);
    for (const method of methods) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (op?.parameters) setDefault(op.parameters);
    }
  }
}

function detectApiType(spec: Record<string, unknown>, schema: SchemaEntry): ApiType {
  const info = spec.info as Record<string, unknown> | undefined;
  if (info) {
    const xApiType = info['x-api-type'] ?? info['x-apiType'];
    if (typeof xApiType === 'string') {
      if (xApiType.toLowerCase().includes('shopper')) return 'Shopper';
      if (xApiType.toLowerCase().includes('admin')) return 'Admin';
    }
  }
  return schema.apiFamily.startsWith('shopper') ? 'Shopper' : 'Admin';
}

/**
 * Recursively resolve external $ref URLs in the spec so Swagger UI
 * (running in the webview) doesn't have to fetch them itself — which
 * would fail due to CORS / missing auth headers.
 *
 * Internal refs (`#/...`) are left untouched.
 */
async function resolveExternalRefs(
  spec: Record<string, unknown>,
  authHeader: string | undefined,
  log: vscode.OutputChannel,
): Promise<void> {
  const visited = new Set<string>();

  async function walk(obj: unknown): Promise<void> {
    if (obj === null || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      await Promise.all(obj.map(walk));
      return;
    }
    const record = obj as Record<string, unknown>;

    // Resolve external $ref
    if (typeof record.$ref === 'string' && !record.$ref.startsWith('#')) {
      const refUrl = record.$ref;
      if (visited.has(refUrl)) {
        // Circular — drop the $ref to avoid infinite loop
        delete record.$ref;
        return;
      }
      visited.add(refUrl);

      try {
        const headers: Record<string, string> = {};
        if (authHeader) headers['Authorization'] = authHeader;
        const res = await fetch(refUrl, {headers});
        if (res.ok) {
          const resolved = (await res.json()) as Record<string, unknown>;
          // Inline the resolved content, removing the $ref
          delete record.$ref;
          Object.assign(record, resolved);
          // Recursively resolve any nested $refs in the fetched content
          await walk(record);
        } else {
          log.appendLine(`[API Browser] $ref fetch failed (${res.status}): ${refUrl}`);
          delete record.$ref;
        }
      } catch {
        log.appendLine(`[API Browser] $ref fetch error: ${refUrl}`);
        delete record.$ref;
      }
      return;
    }

    // Walk child properties
    await Promise.all(Object.values(record).map(walk));
  }

  await walk(spec);
}

export class SwaggerWebviewManager implements vscode.Disposable {
  private readonly panels = new Map<string, vscode.WebviewPanel>();
  private readonly specCache = new Map<string, Record<string, unknown>>();
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configProvider: B2CExtensionConfig,
    private readonly log: vscode.OutputChannel,
  ) {}

  async openSwaggerPanel(schema: SchemaEntry): Promise<void> {
    const key = `${schema.apiFamily}/${schema.apiName}/${schema.apiVersion}`;

    const existing = this.panels.get(key);
    if (existing) {
      existing.reveal();
      return;
    }

    const config = this.configProvider.getConfig();
    if (!config) {
      vscode.window.showErrorMessage('API Browser: No B2C Commerce configuration found.');
      return;
    }

    const shortCode = config.values.shortCode;
    if (!shortCode) {
      vscode.window.showErrorMessage('API Browser: Short code not found. Set short-code in dw.json.');
      return;
    }

    // Fetch the full OpenAPI spec
    const spec = await this.fetchSpec(schema, config, shortCode);
    if (!spec) return;

    const apiType = detectApiType(spec, schema);

    // Resolve external $refs server-side so the webview doesn't have to fetch them
    if (config.hasOAuthConfig()) {
      const oauthStrategy = config.createOAuth();
      const authHeader = await oauthStrategy.getAuthorizationHeader?.();
      await resolveExternalRefs(spec, authHeader, this.log);
    }

    // Derive organizationId and pre-fill it in the spec
    const tenantId = deriveTenantId(config.values.hostname);
    const organizationId = tenantId ? toOrganizationId(tenantId) : '';

    // Override servers to point to the correct base URL
    const baseUrl = `https://${shortCode}.api.commercecloud.salesforce.com/${schema.apiFamily}/${schema.apiName}/${schema.apiVersion}`;
    spec.servers = [{url: baseUrl}];

    if (organizationId) {
      prefillOrganizationId(spec, organizationId);
    }

    const swaggerUiDir = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'swagger-ui');
    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-swagger',
      `${schema.apiName} ${schema.apiVersion}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [swaggerUiDir],
      },
    );

    this.panels.set(key, panel);

    panel.onDidDispose(() => {
      this.panels.delete(key);
    });

    panel.webview.html = this.getWebviewHtml(panel.webview, spec, apiType);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(async (msg: {type: string}) => {
      if (msg.type === 'refreshToken') {
        await this.sendToken(panel, apiType);
      }
    });

    // Acquire initial token
    await this.sendToken(panel, apiType);
  }

  private async fetchSpec(
    schema: SchemaEntry,
    config: ResolvedB2CConfig,
    shortCode: string,
  ): Promise<Record<string, unknown> | null> {
    const key = `${schema.apiFamily}/${schema.apiName}/${schema.apiVersion}`;
    const cached = this.specCache.get(key);
    if (cached) return cached;

    if (!config.hasOAuthConfig()) {
      vscode.window.showErrorMessage(
        'API Browser: OAuth credentials required. Set clientId and clientSecret in dw.json.',
      );
      return null;
    }

    try {
      const spec = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Loading ${schema.apiName} spec...`},
        async () => {
          const tenantId = deriveTenantId(config.values.hostname);
          if (!tenantId) throw new Error('Could not derive tenant ID from hostname.');

          const oauthStrategy = config.createOAuth();
          const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
          const orgId = toOrganizationId(tenantId);
          const {data, error, response} = await schemasClient.GET(
            '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
            {
              params: {
                path: {
                  organizationId: orgId,
                  apiFamily: schema.apiFamily,
                  apiName: schema.apiName,
                  apiVersion: schema.apiVersion,
                },
              },
            },
          );
          if (error) {
            throw new Error(getApiErrorMessage(error, response));
          }
          return data as Record<string, unknown>;
        },
      );

      if (spec) {
        this.specCache.set(key, spec);
      }
      return spec ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[API Browser] Failed to fetch spec for ${key}: ${message}`);
      vscode.window.showErrorMessage(`API Browser: ${message}`);
      return null;
    }
  }

  private getWebviewHtml(webview: vscode.Webview, spec: Record<string, unknown>, apiType: ApiType): string {
    const swaggerUiDir = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'swagger-ui');
    const bundleUri = webview.asWebviewUri(vscode.Uri.joinPath(swaggerUiDir, 'swagger-ui-bundle.js'));
    const presetUri = webview.asWebviewUri(vscode.Uri.joinPath(swaggerUiDir, 'swagger-ui-standalone-preset.js'));
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(swaggerUiDir, 'swagger-ui.css'));

    const nonce = randomBytes(16).toString('hex');
    const templatePath = path.join(this.context.extensionPath, 'src', 'api-browser', 'swagger-webview.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    html = html.replace(/__NONCE__/g, nonce);
    html = html.replace(/__CSP_SOURCE__/g, webview.cspSource);
    html = html.replace('__SWAGGER_BUNDLE_URI__', bundleUri.toString());
    html = html.replace('__SWAGGER_PRESET_URI__', presetUri.toString());
    html = html.replace('__SWAGGER_CSS_URI__', cssUri.toString());
    html = html.replace('__API_TYPE__', apiType);
    html = html.replace('__SPEC_JSON__', JSON.stringify(spec));

    return html;
  }

  private async sendToken(panel: vscode.WebviewPanel, apiType: ApiType): Promise<void> {
    try {
      const token = await this.getToken(apiType);
      if (token) {
        panel.webview.postMessage({type: 'updateToken', token});
      } else {
        const hint =
          apiType === 'Shopper'
            ? 'No public SLAS client found. Configure slasClientId and siteId in dw.json, or create a public SLAS client.'
            : 'Configure clientId and clientSecret in dw.json.';
        this.log.appendLine(`[API Browser] No ${apiType} token available — ${hint}`);
        panel.webview.postMessage({type: 'tokenError', error: hint});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[API Browser] Token error (${apiType}): ${message}`);
      panel.webview.postMessage({type: 'tokenError', error: message});
    }
  }

  private async getToken(apiType: ApiType): Promise<string | null> {
    const config = this.configProvider.getConfig();
    if (!config) return null;

    if (apiType === 'Admin') {
      if (!config.hasOAuthConfig()) return null;
      const oauthStrategy = config.createOAuth();
      const header = await oauthStrategy.getAuthorizationHeader?.();
      if (!header) return null;
      // Header is "Bearer <token>" — extract the token
      return header.startsWith('Bearer ') ? header.slice(7) : header;
    }

    // Shopper — use SLAS guest token
    const shortCode = config.values.shortCode;
    if (!shortCode) return null;

    let slasClientId = config.values.slasClientId as string | undefined;
    let siteId = config.values.siteId as string | undefined;
    let slasClientSecret = config.values.slasClientSecret as string | undefined;
    let redirectUri = 'http://localhost:3000/callback';

    // Auto-discover a public SLAS client when slasClientId is not configured
    if (!slasClientId && config.hasOAuthConfig()) {
      const discovered = await this.discoverPublicSlasClient(config, shortCode);
      if (discovered) {
        slasClientId = discovered.clientId;
        if (!siteId && discovered.siteId) siteId = discovered.siteId;
        if (discovered.redirectUri) redirectUri = discovered.redirectUri;
        // Public clients have no secret
        slasClientSecret = undefined;
      }
    }

    if (!slasClientId || !siteId) return null;

    const tenantId = deriveTenantId(config.values.hostname);
    if (!tenantId) return null;

    const tokenResponse = await getGuestToken({
      shortCode,
      organizationId: toOrganizationId(tenantId),
      slasClientId,
      slasClientSecret,
      siteId,
      redirectUri,
    });

    return tokenResponse.access_token;
  }

  /**
   * Auto-discover the first public SLAS client for the tenant.
   * Mirrors the CLI's `slas token` auto-discovery behaviour.
   */
  private async discoverPublicSlasClient(
    config: ResolvedB2CConfig,
    shortCode: string,
  ): Promise<{clientId: string; siteId?: string; redirectUri?: string} | null> {
    const tenantId = deriveTenantId(config.values.hostname);
    if (!tenantId) return null;

    try {
      this.log.appendLine(`[API Browser] Auto-discovering SLAS client for tenant ${tenantId}...`);
      const oauthStrategy = config.createOAuth();
      const slasClient = createSlasClient({shortCode}, oauthStrategy);

      const {data, error} = await slasClient.GET('/tenants/{tenantId}/clients', {
        params: {path: {tenantId}},
      });

      if (error) {
        this.log.appendLine('[API Browser] SLAS client discovery failed (API error)');
        return null;
      }

      const clients = ((data as {data?: SlasClientEntry[]})?.data ?? []) as SlasClientEntry[];
      const publicClient = clients.find((c) => !c.isPrivateClient);
      if (!publicClient) {
        this.log.appendLine('[API Browser] No public SLAS client found');
        return null;
      }

      this.log.appendLine(
        `[API Browser] Discovered public SLAS client: ${publicClient.clientId} (${publicClient.name})`,
      );

      const result: {clientId: string; siteId?: string; redirectUri?: string} = {
        clientId: publicClient.clientId ?? '',
      };

      if (Array.isArray(publicClient.channels) && publicClient.channels.length > 0) {
        result.siteId = publicClient.channels[0];
      }

      const rawRedirect = Array.isArray(publicClient.redirectUri)
        ? publicClient.redirectUri.join('|')
        : (publicClient.redirectUri ?? '');
      if (rawRedirect) {
        const uris = rawRedirect
          .split(/[|,]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (uris.length > 0) result.redirectUri = uris[0];
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.appendLine(`[API Browser] SLAS client discovery error: ${message}`);
      return null;
    }
  }

  dispose(): void {
    for (const panel of this.panels.values()) {
      panel.dispose();
    }
    this.panels.clear();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
