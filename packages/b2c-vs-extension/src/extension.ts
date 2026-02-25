/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createSlasClient, getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createScapiSchemasClient, toOrganizationId} from '@salesforce/b2c-tooling-sdk/clients';
import {DwJsonSource} from '@salesforce/b2c-tooling-sdk/config';
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';
import {getPathKeys, type OpenApiSchemaInput} from '@salesforce/b2c-tooling-sdk/schemas';
import {randomUUID} from 'node:crypto';

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {B2CExtensionConfig} from './config-provider.js';
import {registerContentTree} from './content-tree/index.js';
import {registerLogs} from './logs/index.js';
import {initializePlugins} from './plugins.js';
import {registerSandboxTree} from './sandbox-tree/index.js';
import {registerWebDavTree} from './webdav-tree/index.js';

function getWebviewContent(context: vscode.ExtensionContext): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'webview.html');
  return fs.readFileSync(htmlPath, 'utf-8');
}

function getScapiExplorerWebviewContent(
  context: vscode.ExtensionContext,
  prefill?: {tenantId: string; channelId: string; shortCode?: string},
): string {
  const htmlPath = path.join(context.extensionPath, 'src', 'scapi-explorer.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const prefillJson = prefill ? JSON.stringify(prefill) : 'null';
  html = html.replace('__SCAPI_PREFILL__', prefillJson);
  return html;
}

/** PascalCase for use in template content (class names, types, etc.). e.g. "first page" → "FirstPage" */
function pageNameToPageId(pageName: string): string {
  return pageName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/** camelCase for filename. e.g. "first page" → "firstPage" */
function pageNameToFileNameId(pageName: string): string {
  const pascal = pageNameToPageId(pageName || 'Page');
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

type RegionForm = {id: string; name: string; description: string; maxComponents: number};

type WebviewMessage =
  | {type: 'openExternal'}
  | {
      type: 'submitForm';
      pageType: {name?: string; description?: string; supportedAspectTypes?: string[]};
      regions: RegionForm[];
    };

function renderTemplate(
  template: string,
  pageName: string,
  pageDescription: string,
  supportedAspectTypes: string[],
  regions: RegionForm[],
): string {
  const pageId = pageNameToPageId(pageName || 'Page');
  const quoted = (s: string) => `'${String(s).replace(/'/g, "\\'")}'`;
  const aspectsStr = `[${supportedAspectTypes.map((a) => quoted(a)).join(', ')}]`;
  const regionsBlock = regions
    .map(
      (r) =>
        `{
        id: ${quoted(r.id)},
        name: ${quoted(r.name)},
        description: ${quoted(r.description)},
        maxComponents: ${r.maxComponents},
    }`,
    )
    .join(',\n    ');
  const firstRegionId = regions[0]?.id ?? '';

  return template
    .replace(/\$\{pageName\}/g, quoted(pageName || ''))
    .replace(/\$\{pageDescription\}/g, quoted(pageDescription || ''))
    .replace(/\$\{supportedAspectTypes\}/g, aspectsStr)
    .replace('__REGIONS__', regionsBlock)
    .replace(/\$\{pageId\}/g, pageId)
    .replace(/\$\{pageName\}Data/g, `${pageId}Data`)
    .replace(/\$\{regions\[0\]\.id\}/g, firstRegionId);
}

function applyLogLevel(log: vscode.OutputChannel): void {
  const config = vscode.workspace.getConfiguration('b2c-dx');
  const level = config.get<string>('logLevel', 'info');
  try {
    configureLogger({
      level: level as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent',
      destination: {
        write(chunk: string | Buffer): boolean {
          const line = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
          log.appendLine(line.trimEnd());
          return true;
        },
      },
      json: false,
      colorize: false,
      redact: true,
    });
  } catch (err) {
    const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    log.appendLine(`Warning: Failed to configure SDK logger; SDK logs will not appear in this panel.\n${detail}`);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const log = vscode.window.createOutputChannel('B2C DX');

  applyLogLevel(log);

  try {
    return await activateInner(context, log);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log.appendLine(`Activation failed: ${message}`);
    if (stack) log.appendLine(stack);
    console.error('B2C DX extension activation failed:', err);
    vscode.window.showErrorMessage(`B2C DX: Extension failed to activate. See Output > B2C DX. Error: ${message}`);
    const showActivationError = () => {
      log.show();
      vscode.window.showErrorMessage(`B2C DX activation error: ${message}`);
    };
    context.subscriptions.push(
      vscode.commands.registerCommand('b2c-dx.openUI', showActivationError),
      vscode.commands.registerCommand('b2c-dx.promptAgent', showActivationError),
      vscode.commands.registerCommand('b2c-dx.listWebDav', showActivationError),
      vscode.commands.registerCommand('b2c-dx.scapiExplorer', showActivationError),
    );
  }
}

async function activateInner(context: vscode.ExtensionContext, log: vscode.OutputChannel) {
  // Initialize b2c-cli plugins before registering commands/views.
  // This ensures plugin config sources and middleware are available
  // before the first resolveConfig() call. Failures are non-fatal.
  await initializePlugins();

  const configProvider = new B2CExtensionConfig(log);
  context.subscriptions.push(configProvider);

  const disposable = vscode.commands.registerCommand('b2c-dx.openUI', () => {
    vscode.window.showInformationMessage('B2C DX: Opening Page Designer Assistant.');

    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-page-designer-ui',
      'My Extension UI',
      vscode.ViewColumn.One,
      {enableScripts: true},
    );

    panel.webview.html = getWebviewContent(context);

    panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      if (msg.type === 'openExternal') {
        await vscode.env.openExternal(vscode.Uri.parse('https://example.com'));
      }
      if (msg.type === 'submitForm') {
        try {
          const {pageType, regions} = msg;
          const pageName = pageType?.name ?? '';
          const templatePath = path.join(context.extensionPath, 'src', 'template', '_app.pageId.tsx');
          const template = fs.readFileSync(templatePath, 'utf-8');
          const content = renderTemplate(
            template,
            pageName,
            pageType?.description ?? '',
            pageType?.supportedAspectTypes ?? [],
            regions ?? [],
          );

          const fileNameId = pageNameToFileNameId(pageName);
          const fileName = `_app.${fileNameId}.tsx`;

          let targetUri: vscode.Uri;
          if (vscode.workspace.workspaceFolders?.length) {
            const rootUri = vscode.workspace.workspaceFolders[0].uri;
            const routesUri = vscode.Uri.joinPath(rootUri, 'routes');
            const routesPath = routesUri.fsPath;
            const hasRoutesFolder = fs.existsSync(routesPath) && fs.statSync(routesPath).isDirectory();
            targetUri = hasRoutesFolder
              ? vscode.Uri.joinPath(routesUri, fileName)
              : vscode.Uri.joinPath(rootUri, fileName);
          } else {
            const picked = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.joinPath(context.globalStorageUri, fileName),
              saveLabel: 'Create file',
            });
            if (!picked) {
              return;
            }
            targetUri = picked;
          }

          vscode.window.showInformationMessage(`Writing file to: ${targetUri.fsPath}`);

          await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content, 'utf-8'));
          await vscode.window.showInformationMessage(`Saved to: ${targetUri.fsPath}`, 'Open');
          const doc = await vscode.workspace.openTextDocument(targetUri);
          await vscode.window.showTextDocument(doc, {
            viewColumn: panel.viewColumn ?? vscode.ViewColumn.One,
            preview: false,
            preserveFocus: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Failed to save: ${message}`);
        }
      }
    });
  });

  const promptAgentDisposable = vscode.commands.registerCommand('b2c-dx.promptAgent', async () => {
    const prompt = await vscode.window.showInputBox({
      title: 'Prompt Agent',
      placeHolder: 'Enter your prompt for the agent...',
    });
    if (prompt === undefined || prompt === '') {
      return;
    }
    try {
      await vscode.env.clipboard.writeText(prompt);
      await vscode.commands.executeCommand('composer.newAgentChat');
      await new Promise((resolve) => setTimeout(resolve, 300));
      await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(
        `Could not open Cursor chat: ${message}. Run this extension in Cursor to send prompts to the agent.`,
      );
    }
  });

  const listWebDavDisposable = vscode.commands.registerCommand('b2c-dx.listWebDav', () => {
    vscode.commands.executeCommand('b2cWebdavExplorer.focus');
  });

  const scapiExplorerDisposable = vscode.commands.registerCommand('b2c-dx.scapiExplorer', () => {
    const panel = vscode.window.createWebviewPanel(
      'b2c-dx-scapi-explorer',
      'SCAPI API Explorer',
      vscode.ViewColumn.One,
      {enableScripts: true},
    );
    let prefill: {tenantId: string; channelId: string; shortCode?: string} | undefined;
    const prefillConfig = configProvider.getConfig();
    if (prefillConfig) {
      const hostname = prefillConfig.values.hostname;
      const shortCode = prefillConfig.values.shortCode;
      const firstPart = hostname && typeof hostname === 'string' ? (hostname.split('.')[0] ?? '') : '';
      const tenantId = firstPart ? firstPart.replace(/-/g, '_') : '';
      if (tenantId || shortCode) {
        prefill = {
          tenantId: tenantId || '',
          channelId: 'RefArch',
          shortCode: typeof shortCode === 'string' ? shortCode : undefined,
        };
      }
    }
    panel.webview.html = getScapiExplorerWebviewContent(context, prefill);
    panel.webview.onDidReceiveMessage(
      async (msg: {
        type: string;
        tenantId?: string;
        channelId?: string;
        clientId?: string;
        clientSecret?: string;
        token?: string;
        apiFamily?: string;
        apiName?: string;
        apiPath?: string;
        query?: string;
        curlText?: string;
      }) => {
        const getConfig = () => {
          const config = configProvider.getConfig();
          if (!config) throw new Error('No B2C Commerce configuration found. Configure dw.json or SFCC_* env vars.');
          return config;
        };

        if (msg.type === 'scapiFetchSchemas') {
          const tenantId = (msg.tenantId ?? '').trim();
          if (!tenantId) {
            panel.webview.postMessage({
              type: 'scapiSchemasListResult',
              success: false,
              error: 'Tenant Id is required to load schemas.',
            });
            return;
          }
          try {
            const config = getConfig();
            const shortCode = config.values.shortCode;
            if (!shortCode) {
              panel.webview.postMessage({
                type: 'scapiSchemasListResult',
                success: false,
                error: 'Short code not found. Set short-code in dw.json or SFCC_SHORTCODE.',
              });
              return;
            }
            if (!config.hasOAuthConfig()) {
              panel.webview.postMessage({
                type: 'scapiSchemasListResult',
                success: false,
                error: 'OAuth credentials required. Set clientId and clientSecret in dw.json.',
              });
              return;
            }
            const oauthStrategy = config.createOAuth();
            const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
            const orgId = toOrganizationId(tenantId);
            const {data, error, response} = await schemasClient.GET('/organizations/{organizationId}/schemas', {
              params: {path: {organizationId: orgId}},
            });
            if (error) {
              panel.webview.postMessage({
                type: 'scapiSchemasListResult',
                success: false,
                error: getApiErrorMessage(error, response),
              });
              return;
            }
            const schemas = data?.data ?? [];
            const apiFamilies = Array.from(
              new Set(schemas.map((s: {apiFamily?: string}) => s.apiFamily).filter(Boolean)),
            ) as string[];
            apiFamilies.sort();
            panel.webview.postMessage({
              type: 'scapiSchemasListResult',
              success: true,
              schemas,
              apiFamilies,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiSchemasListResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiFetchSchemaPaths') {
          const tenantId = (msg.tenantId ?? '').trim();
          const apiFamily = (msg.apiFamily ?? '').trim();
          const apiName = (msg.apiName ?? '').trim();
          log.appendLine(`[SCAPI] Fetch schema paths: tenantId=${tenantId} apiFamily=${apiFamily} apiName=${apiName}`);
          if (!tenantId || !apiFamily || !apiName) {
            log.appendLine('[SCAPI] Fetch paths failed: Tenant Id, API Family, and API Name are required.');
            panel.webview.postMessage({
              type: 'scapiSchemaPathsResult',
              success: false,
              error: 'Tenant Id, API Family, and API Name are required.',
            });
            return;
          }
          try {
            const config = getConfig();
            const shortCode = config.values.shortCode;
            if (!shortCode) {
              log.appendLine('[SCAPI] Fetch paths failed: Short code not found.');
              panel.webview.postMessage({
                type: 'scapiSchemaPathsResult',
                success: false,
                error: 'Short code not found.',
              });
              return;
            }
            if (!config.hasOAuthConfig()) {
              log.appendLine('[SCAPI] Fetch paths failed: OAuth credentials required.');
              panel.webview.postMessage({
                type: 'scapiSchemaPathsResult',
                success: false,
                error: 'OAuth credentials required.',
              });
              return;
            }
            const oauthStrategy = config.createOAuth();
            const schemasClient = createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
            const orgId = toOrganizationId(tenantId);
            const apiVersion = 'v1';
            log.appendLine(`[SCAPI] GET schema: orgId=${orgId} ${apiFamily}/${apiName}/${apiVersion}`);
            const {data, error, response} = await schemasClient.GET(
              '/organizations/{organizationId}/schemas/{apiFamily}/{apiName}/{apiVersion}',
              {params: {path: {organizationId: orgId, apiFamily, apiName, apiVersion}}},
            );
            if (error) {
              const errMsg = getApiErrorMessage(error, response);
              log.appendLine(`[SCAPI] Fetch paths error: ${errMsg}`);
              log.appendLine(`[SCAPI] Error detail: ${JSON.stringify({error, status: response?.status})}`);
              panel.webview.postMessage({
                type: 'scapiSchemaPathsResult',
                success: false,
                error: errMsg,
              });
              return;
            }
            const pathKeys = data && typeof data === 'object' ? getPathKeys(data as OpenApiSchemaInput) : [];
            log.appendLine(
              `[SCAPI] Schema response: hasData=${Boolean(data)} pathKeysCount=${pathKeys.length} pathKeys=${JSON.stringify(pathKeys.slice(0, 5))}${pathKeys.length > 5 ? '...' : ''}`,
            );
            const orgPathPrefix = 'organizations/{organizationId}';
            const paths = pathKeys
              .map((p) => {
                if (typeof p !== 'string') return '';
                const withoutLeadingSlash = p.replace(/^\//, '');
                const suffix = withoutLeadingSlash.startsWith(orgPathPrefix + '/')
                  ? withoutLeadingSlash.slice(orgPathPrefix.length + 1)
                  : withoutLeadingSlash === orgPathPrefix
                    ? ''
                    : withoutLeadingSlash;
                return suffix;
              })
              .filter(Boolean)
              .sort();
            log.appendLine(
              `[SCAPI] Normalized paths (${paths.length}): ${JSON.stringify(paths.slice(0, 10))}${paths.length > 10 ? '...' : ''}`,
            );
            const schemaInfo =
              data && typeof data === 'object' && 'info' in data
                ? (data as {info?: Record<string, unknown>}).info
                : undefined;
            const apiTypeRaw = schemaInfo?.['x-api-type'] ?? schemaInfo?.['x-apiType'] ?? schemaInfo?.['x_api_type'];
            const apiType = typeof apiTypeRaw === 'string' ? apiTypeRaw : undefined;
            if (schemaInfo && !apiType) {
              log.appendLine(`[SCAPI] Schema info keys (no x-api-type): ${Object.keys(schemaInfo).join(', ')}`);
            } else if (apiType) {
              log.appendLine(`[SCAPI] API type: ${apiType}`);
            }
            panel.webview.postMessage({
              type: 'scapiSchemaPathsResult',
              success: true,
              paths,
              apiType: apiType ?? null,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : '';
            log.appendLine(`[SCAPI] Fetch paths exception: ${message}`);
            if (stack) log.appendLine(`[SCAPI] Stack: ${stack}`);
            panel.webview.postMessage({
              type: 'scapiSchemaPathsResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiExecuteCurl') {
          const curlText = (msg.curlText ?? '').trim();
          const urlMatch = curlText.match(/"https:\/\/[^"]+"/);
          const url = urlMatch ? urlMatch[0].slice(1, -1) : '';
          const bearerMatch = curlText.match(/Authorization:\s*Bearer\s+([^"\\\s]+)/);
          const token = bearerMatch ? bearerMatch[1].trim() : '';
          if (!url) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Could not parse URL from curl command. Expected a quoted https:// URL.',
            });
            return;
          }
          if (!token) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Could not parse Authorization: Bearer token from curl command.',
            });
            return;
          }
          try {
            const res = await fetch(url, {
              method: 'GET',
              headers: {Authorization: `Bearer ${token}`},
            });
            const text = await res.text();
            if (!res.ok) {
              panel.webview.postMessage({
                type: 'scapiExecuteApiResult',
                success: false,
                error: `HTTP ${res.status}: ${text || res.statusText}`,
              });
              return;
            }
            let body: string | object = text;
            try {
              body = JSON.parse(text);
            } catch {
              // leave as string
            }
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: true,
              body,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiExecuteShopApi') {
          const token = (msg.token ?? '').trim();
          const tenantId = (msg.tenantId ?? '').trim();
          const channelId = (msg.channelId ?? '').trim();
          const apiFamily = (msg.apiFamily ?? '').trim();
          const apiName = (msg.apiName ?? '').trim();
          const apiPath = (msg.apiPath ?? '').trim();
          const query = (msg.query ?? '').trim();
          if (!token) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Bearer token is required. Generate a token first.',
            });
            return;
          }
          if (!tenantId || !channelId || !apiFamily || !apiName) {
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: 'Tenant Id, Channel Id, API Family, and API Name are required.',
            });
            return;
          }
          try {
            const config = getConfig();
            const shortCode = config.values.shortCode;
            if (!shortCode) {
              panel.webview.postMessage({
                type: 'scapiExecuteApiResult',
                success: false,
                error: 'Short code not found. Set short-code in dw.json or SFCC_SHORTCODE.',
              });
              return;
            }
            const orgId = toOrganizationId(tenantId);
            const pathPart = apiPath ? `/${apiPath.replace(/^\//, '')}` : '';
            const url = `https://${shortCode}.api.commercecloud.salesforce.com/${apiFamily}/${apiName}/v1/organizations/${orgId}${pathPart}?siteId=${encodeURIComponent(channelId)}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
            const res = await fetch(url, {
              method: 'GET',
              headers: {Authorization: `Bearer ${token}`},
            });
            const text = await res.text();
            if (!res.ok) {
              panel.webview.postMessage({
                type: 'scapiExecuteApiResult',
                success: false,
                error: `HTTP ${res.status}: ${text || res.statusText}`,
              });
              return;
            }
            let body: string | object = text;
            try {
              body = JSON.parse(text);
            } catch {
              // leave as string
            }
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: true,
              body,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiExecuteApiResult',
              success: false,
              error: message,
            });
          }
          return;
        }

        if (msg.type === 'scapiGenerateBearerToken') {
          const clientId = (msg.clientId ?? '').trim();
          const clientSecret = (msg.clientSecret ?? '').trim();
          const tenantId = (msg.tenantId ?? '').trim();
          const channelId = (msg.channelId ?? '').trim();
          if (!clientId || !clientSecret || !tenantId || !channelId) {
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: false,
              error: 'SLAS Client Id, Client Secret, Tenant Id, and Channel Id are required.',
            });
            return;
          }
          const config = getConfig();
          const shortCode = config.values.shortCode;
          if (!shortCode) {
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: false,
              error:
                'Short code not found. Set short-code or scapi-shortcode in dw.json, or SFCC_SHORTCODE in the environment.',
            });
            return;
          }
          const orgId = toOrganizationId(tenantId);
          const tokenUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`;
          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
          try {
            const res = await fetch(tokenUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
              },
              body: `grant_type=client_credentials&channel_id=${encodeURIComponent(channelId)}`,
            });
            const data = (await res.json()) as {access_token?: string; error?: string; error_description?: string};
            if (!res.ok) {
              const errMsg = data.error_description ?? data.error ?? res.statusText ?? String(res.status);
              panel.webview.postMessage({
                type: 'scapiGenerateBearerTokenResult',
                success: false,
                error: errMsg,
              });
              return;
            }
            const token = data.access_token;
            if (!token) {
              panel.webview.postMessage({
                type: 'scapiGenerateBearerTokenResult',
                success: false,
                error: 'No access_token in response.',
              });
              return;
            }
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: true,
              token,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            panel.webview.postMessage({
              type: 'scapiGenerateBearerTokenResult',
              success: false,
              error: message,
            });
          }
          return;
        }
        if (msg.type !== 'scapiCreateSlasClient') return;
        const tenantId = (msg.tenantId ?? '').trim();
        const channelId = (msg.channelId ?? '').trim();
        if (!tenantId || !channelId) {
          vscode.window.showErrorMessage('B2C DX: Tenant Id and Channel Id are required to create a SLAS client.');
          return;
        }
        const config = configProvider.getConfig();
        if (!config) {
          vscode.window.showErrorMessage(
            'B2C DX: No B2C Commerce configuration found. Configure dw.json or SFCC_* env vars.',
          );
          return;
        }
        const shortCode = config.values.shortCode;
        if (!shortCode) {
          vscode.window.showErrorMessage(
            'B2C DX: SCAPI short code required. Set short-code or scapi-shortcode in dw.json, or SFCC_SHORTCODE in the environment.',
          );
          return;
        }
        if (!config.hasOAuthConfig()) {
          vscode.window.showErrorMessage(
            'B2C DX: OAuth credentials required for SLAS. Set clientId and clientSecret in dw.json or SFCC_CLIENT_ID / SFCC_CLIENT_SECRET.',
          );
          return;
        }
        try {
          const oauthStrategy = config.createOAuth();
          const slasClient = createSlasClient({shortCode}, oauthStrategy);
          const {error: getErr, response: getResp} = await slasClient.GET('/tenants/{tenantId}', {
            params: {path: {tenantId}},
          });
          if (getErr) {
            const isNotFound =
              getResp.status === 404 ||
              (getResp.status === 400 &&
                typeof getErr === 'object' &&
                getErr !== null &&
                'exception_name' in getErr &&
                (getErr as {exception_name?: string}).exception_name === 'TenantNotFoundException');
            if (isNotFound) {
              await slasClient.PUT('/tenants/{tenantId}', {
                params: {path: {tenantId}},
                body: {
                  tenantId,
                  merchantName: 'B2C DX Tenant',
                  description: 'Created from SCAPI API Explorer',
                  contact: 'B2C DX',
                  emailAddress: 'noreply@example.com',
                  phoneNo: '+1 000-000-0000',
                },
              });
            } else {
              const message = getApiErrorMessage(getErr, getResp);
              vscode.window.showErrorMessage(`B2C DX: Failed to check tenant: ${message}`);
              return;
            }
          }
          const clientId = randomUUID().toLowerCase();
          const clientSecret = `sk_${randomUUID().replaceAll('-', '')}`;
          const defaultScopes = [
            'sfcc.shopper-baskets-orders.rw',
            'sfcc.shopper-categories',
            'sfcc.shopper-customers.login',
            'sfcc.shopper-customers.register',
            'sfcc.shopper-discovery-search',
            'sfcc.shopper-experience',
            'sfcc.shopper-gift-certificates',
            'sfcc.shopper-myaccount.addresses.rw',
            'sfcc.shopper-myaccount.baskets',
            'sfcc.shopper-myaccount.orders',
            'sfcc.shopper-myaccount.paymentinstruments.rw',
            'sfcc.shopper-myaccount.productlists.rw',
            'sfcc.shopper-myaccount.rw',
            'sfcc.shopper-promotions',
            'sfcc.shopper-product-search',
            'sfcc.shopper-productlists',
            'sfcc.shopper-products',
            'sfcc.shopper-stores',
          ];
          const {error, response} = await slasClient.PUT('/tenants/{tenantId}/clients/{clientId}', {
            params: {path: {tenantId, clientId}},
            body: {
              clientId,
              name: `b2c-dx client ${new Date().toISOString().slice(0, 19)}`,
              channels: [channelId],
              scopes: defaultScopes,
              redirectUri: ['http://localhost:3000/callback'],
              callbackUri: [],
              secret: clientSecret,
              isPrivateClient: true,
            },
          });
          if (error) {
            vscode.window.showErrorMessage(`B2C DX: Create SLAS client failed. ${getApiErrorMessage(error, response)}`);
            return;
          }
          vscode.window.showInformationMessage('B2C DX: SLAS client created. See Explorer for Client ID and Secret.');
          panel.webview.postMessage({
            type: 'scapiCreateSlasClientResult',
            success: true,
            clientId,
            secret: clientSecret,
            scopes: defaultScopes,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`B2C DX: Create SLAS client failed. ${message}`);
          panel.webview.postMessage({type: 'scapiCreateSlasClientResult', success: false, error: message});
        }
      },
    );
  });

  // --- Active instance status bar ---
  const dwJsonSource = new DwJsonSource();
  const getWorkingDirectory = () => vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();

  const instanceStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  instanceStatusBar.command = 'b2c-dx.instance.switch';
  const updateInstanceStatusBar = () => {
    const config = configProvider.getConfig();
    if (config) {
      // Find active instance name from dw.json
      const instances = dwJsonSource.listInstances({workingDirectory: getWorkingDirectory()});
      const active = instances.find((i) => i.active);
      const name = active?.name;
      const host = config.values.hostname ?? '';
      const truncatedHost = host.length > 40 ? host.slice(0, 37) + '...' : host;
      const display = name || truncatedHost || 'unnamed';
      instanceStatusBar.text = `$(cloud) ${display}`;
      const tooltipLines = [`B2C Instance: ${name ?? 'unnamed'}`];
      if (host) tooltipLines.push(`Host: ${host}`);
      tooltipLines.push('Click to switch instance');
      instanceStatusBar.tooltip = tooltipLines.join('\n');
      instanceStatusBar.show();
    } else {
      const err = configProvider.getConfigError();
      if (err) {
        instanceStatusBar.text = '$(cloud) B2C: Not configured';
        instanceStatusBar.tooltip = err;
        instanceStatusBar.show();
      } else {
        instanceStatusBar.hide();
      }
    }
  };
  updateInstanceStatusBar();
  configProvider.onDidReset(updateInstanceStatusBar);

  const instanceConfigScheme = 'b2c-instance-config';
  const instanceConfigContents = new Map<string, string>();
  const instanceConfigOnDidChange = new vscode.EventEmitter<vscode.Uri>();
  const instanceConfigRegistration = vscode.workspace.registerTextDocumentContentProvider(instanceConfigScheme, {
    onDidChange: instanceConfigOnDidChange.event,
    provideTextDocumentContent(uri: vscode.Uri) {
      return instanceConfigContents.get(uri.toString()) ?? '';
    },
  });

  const inspectInstanceDisposable = vscode.commands.registerCommand('b2c-dx.instance.inspect', async () => {
    const config = configProvider.getConfig();
    if (!config) {
      vscode.window.showWarningMessage('B2C DX: No B2C Commerce configuration found.');
      return;
    }
    const safeValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config.values)) {
      if (value === undefined) continue;
      // Redact secrets
      if (/secret|password|passphrase|apikey/i.test(key) && typeof value === 'string') {
        safeValues[key] = value.slice(0, 4) + '****';
      } else {
        safeValues[key] = value;
      }
    }
    const content = JSON.stringify(safeValues, null, 2);
    const host = config.values.hostname ?? 'instance';
    const uri = vscode.Uri.parse(`${instanceConfigScheme}:${host}.json`);
    instanceConfigContents.set(uri.toString(), content);
    instanceConfigOnDidChange.fire(uri);
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    await vscode.window.showTextDocument(doc, {preview: true});
  });

  const switchInstanceDisposable = vscode.commands.registerCommand('b2c-dx.instance.switch', async () => {
    const workingDirectory = getWorkingDirectory();
    const instances = dwJsonSource.listInstances({workingDirectory});

    if (instances.length === 0) {
      vscode.window.showWarningMessage('No instances configured in dw.json.');
      return;
    }

    if (instances.length === 1) {
      // Only one instance — go straight to inspect
      await vscode.commands.executeCommand('b2c-dx.instance.inspect');
      return;
    }

    const items = instances.map((inst) => ({
      label: `${inst.active ? '$(check) ' : ''}${inst.name}`,
      description: inst.hostname ?? '',
      instance: inst,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      title: 'Switch B2C Instance',
      placeHolder: 'Select an instance to activate',
    });
    if (!picked) return;

    if (picked.instance.active) {
      // Already active — just show config
      await vscode.commands.executeCommand('b2c-dx.instance.inspect');
      return;
    }

    try {
      dwJsonSource.setActiveInstance(picked.instance.name, {workingDirectory});
      // The FileSystemWatcher will detect the dw.json change and trigger reset,
      // but fire manually in case the watcher is slow
      configProvider.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to switch instance: ${message}`);
    }
  });

  const settings = vscode.workspace.getConfiguration('b2c-dx');

  if (settings.get<boolean>('features.webdavBrowser', true)) {
    registerWebDavTree(context, configProvider);
  }
  if (settings.get<boolean>('features.contentLibraries', true)) {
    registerContentTree(context, configProvider);
  }
  if (settings.get<boolean>('features.sandboxExplorer', true)) {
    registerSandboxTree(context, configProvider);
  }
  if (settings.get<boolean>('features.logTailing', true)) {
    registerLogs(context, configProvider);
  }

  // React to configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('b2c-dx.logLevel')) {
      applyLogLevel(log);
    }
  });

  context.subscriptions.push(
    disposable,
    promptAgentDisposable,
    listWebDavDisposable,
    scapiExplorerDisposable,
    instanceStatusBar,
    instanceConfigRegistration,
    inspectInstanceDisposable,
    switchInstanceDisposable,
    configChangeListener,
  );
  log.appendLine('B2C DX extension activated.');
}
