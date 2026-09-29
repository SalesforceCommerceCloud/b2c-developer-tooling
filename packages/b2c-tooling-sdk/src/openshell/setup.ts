/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Builds the OpenShell provider profiles, providers, network policy, and
 * sandbox environment for running the B2C tooling inside an OpenShell sandbox.
 *
 * @module openshell/setup
 */
import yaml from 'js-yaml';
import {Minimatch} from 'minimatch';

import {DEFAULT_ACCOUNT_MANAGER_HOST, DEFAULT_ODS_HOST} from '../defaults.js';
import {DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST} from '../clients/cip.js';
import {DEFAULT_MRT_ORIGIN} from '../clients/mrt.js';
import {getLogsWebSocketUrl} from '../operations/mrt/tail-logs.js';
import type {ClientAuthMethod} from '../auth/client-credentials.js';
import type {NormalizedConfig} from '../config/types.js';
import type {SafetyLevel} from '../safety/safety-middleware.js';
import type {SafetyRule} from '../safety/types.js';

/** Sandbox access levels. These are the Safety Mode levels. */
export type OpenShellAccessLevel = SafetyLevel;

/** All supported sandbox access levels. */
export const OPENSHELL_ACCESS_LEVELS = [
  'NONE',
  'NO_DELETE',
  'NO_UPDATE',
  'READ_ONLY',
] as const satisfies readonly OpenShellAccessLevel[];

/** Path of the forwarded Safety Mode configuration inside the sandbox. */
export const OPENSHELL_SAFETY_CONFIG_PATH = '/sandbox/.b2c/safety.json';

/** A provider profile to register with the OpenShell gateway. */
export interface OpenShellProfile {
  /** Profile id (the provider `--type`) */
  id: string;
  /** Profile YAML */
  content: string;
}

/** A provider (stored secret) to create on the OpenShell gateway. */
export interface OpenShellProvider {
  /** Provider name */
  name: string;
  /** Profile id the provider is created from */
  type: string;
  /** Environment variable that carries the secret (on the host and in the sandbox) */
  envVar: string;
  /** Config field the secret is read from */
  source: 'clientSecret' | 'mrtApiKey' | 'password';
}

/** Everything needed to create a B2C sandbox. Contains no secret values. */
export interface OpenShellSetup {
  /** Sandbox name */
  sandboxName: string;
  /** Provider profiles to register */
  profiles: OpenShellProfile[];
  /** Providers to create and attach to the sandbox */
  providers: OpenShellProvider[];
  /** Sandbox policy YAML */
  policy: string;
  /** Non-secret environment variables for the sandbox */
  env: Record<string, string>;
  /** Hosts the policy allows, for display */
  hosts: string[];
  /** Safety Mode configuration (JSON) to upload to {@link OPENSHELL_SAFETY_CONFIG_PATH}, if any */
  safetyConfig?: string;
  /**
   * Forwarded command rules that permit operations. The network policy can't
   * express them, so the requests they permit may still be denied.
   */
  unmappedSafetyRules: SafetyRule[];
}

/** Options for {@link buildOpenShellSetup}. */
export interface OpenShellSetupOptions {
  /** Sandbox name. Defaults to `b2c-<instance name or host prefix>`. */
  sandboxName?: string;
  /** Access level for B2C hosts, also applied to Safety Mode in the sandbox. Defaults to `NONE`. */
  accessLevel?: OpenShellAccessLevel;
  /**
   * Safety Mode settings to forward to the sandbox. `allow` and `confirm`
   * rules for HTTP requests and jobs are also added to the network policy.
   */
  safety?: {confirm?: boolean; rules?: SafetyRule[]};
  /** Additional hosts to allow at the same access level (e.g. the sandbox API host) */
  allowHosts?: string[];
}

const TOKEN_PATH = '/dwsso/oauth2/access_token';
const AM_API_PATH = '/dw/rest/**';
const MRT_LOG_TOKEN_PATH = '/api/projects/*/target/*/jwt/';

/** Documentation hosts read by `b2c docs read` and the MCP `docs_read` tool. */
const DOCS_HOSTS = ['developer.salesforce.com', 'salesforcecommercecloud.github.io'];
const WEBDAV_PATH = '/on/demandware.servlet/webdav/**';
const NODE_BINARY = '/usr/local/bin/node';

const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const WRITE_METHODS = ['POST', 'PUT', 'PATCH'];
const WEBDAV_READ_METHODS = ['PROPFIND'];
const WEBDAV_WRITE_METHODS = ['MKCOL', 'MOVE', 'COPY'];
const ALL_METHODS = [...READ_METHODS, ...WRITE_METHODS, 'DELETE', ...WEBDAV_READ_METHODS, ...WEBDAV_WRITE_METHODS];

interface ProfileDefinition {
  id: string;
  displayName: string;
  description: string;
  credential: string;
  envVar: string;
  authStyle?: 'basic' | 'bearer';
}

/**
 * Profiles declare no endpoints: each provider is bound to hosts in the
 * sandbox policy instead. OpenShell releases every credential of a provider to
 * every host it is bound to, so each secret gets its own profile and provider.
 */
const PROFILES: Record<OpenShellProvider['source'], ProfileDefinition> = {
  clientSecret: {
    id: 'b2c-client-secret',
    displayName: 'B2C Commerce API client secret',
    description: 'Account Manager API client secret for client credentials authentication',
    credential: 'client_secret',
    envVar: 'SFCC_CLIENT_SECRET',
  },
  password: {
    id: 'b2c-webdav-access-key',
    displayName: 'B2C Commerce WebDAV access key',
    description: 'Business Manager user access key for WebDAV',
    credential: 'access_key',
    envVar: 'SFCC_PASSWORD',
    authStyle: 'basic',
  },
  mrtApiKey: {
    id: 'b2c-mrt-api-key',
    displayName: 'Managed Runtime API key',
    description: 'Managed Runtime API key',
    credential: 'api_key',
    envVar: 'MRT_API_KEY',
    authStyle: 'bearer',
  },
};

function renderProfile(def: ProfileDefinition): string {
  return yaml.dump(
    {
      id: def.id,
      display_name: def.displayName,
      description: def.description,
      category: 'other',
      credentials: [
        {
          name: def.credential,
          description: def.description,
          env_vars: [def.envVar],
          required: true,
          ...(def.authStyle ? {auth_style: def.authStyle} : {}),
          ...(def.authStyle === 'bearer' ? {header_name: 'Authorization'} : {}),
        },
      ],
      discovery: {credentials: [def.credential]},
    },
    {lineWidth: -1},
  );
}

/**
 * Returns true when a secret sent in an unencoded Basic header would reach
 * Account Manager altered (it form-decodes `+` and `%xx`).
 */
export function secretNeedsBodyAuth(secret: string): boolean {
  return /[+%]/.test(secret);
}

function toSandboxName(value: string): string {
  const slug = value
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
  return slug.startsWith('b2c') ? slug : `b2c-${slug}`;
}

function hostOf(value: string): string {
  return value.includes('://') ? new URL(value).hostname : value;
}

type Rule = {allow: {method: string; path: string}};

// NO_UPDATE is enforced like NO_DELETE on the network. Safety Mode in the
// sandbox blocks its reset, stop, and restart operations.
function methodRules(level: OpenShellAccessLevel, webdav: boolean, path = '/**'): Rule[] {
  const methods = [...READ_METHODS];
  if (level !== 'READ_ONLY') methods.push(...WRITE_METHODS);
  if (level === 'NONE') methods.push('DELETE');
  const rules = methods.map((method) => ({allow: {method, path}}));
  if (webdav) {
    const webdavMethods = [...WEBDAV_READ_METHODS];
    if (level !== 'READ_ONLY') webdavMethods.push(...WEBDAV_WRITE_METHODS);
    rules.push(...webdavMethods.map((method) => ({allow: {method, path: WEBDAV_PATH}})));
  }
  return rules;
}

/**
 * Converts Safety Mode rules that permit HTTP requests or jobs into network
 * rules, so exceptions to the level also work in the sandbox. Command rules
 * can't be expressed as network rules.
 */
function safetyNetworkRules(rules: SafetyRule[]): Rule[] {
  const result: Rule[] = [];
  for (const rule of rules) {
    if (rule.action === 'block' || rule.command !== undefined) continue;
    if (rule.job !== undefined) {
      result.push({allow: {method: 'POST', path: `/**/jobs/${rule.job}/executions`}});
    } else if (rule.path !== undefined || rule.method !== undefined) {
      const matcher = rule.method ? new Minimatch(rule.method, {nocase: true}) : undefined;
      for (const method of ALL_METHODS.filter((m) => !matcher || matcher.match(m))) {
        result.push({allow: {method, path: rule.path ?? '/**'}});
      }
    }
  }
  return result;
}

function endpoint(host: string, rules: unknown[], extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {host, port: 443, protocol: 'rest', enforcement: 'enforce', ...extra, rules};
}

/**
 * Builds the OpenShell setup for a resolved B2C configuration.
 *
 * Only secrets present in the configuration get a provider. The API client
 * secret is released only to the Account Manager token endpoint, the WebDAV
 * access key only to the instance host, and the MRT API key only to the MRT
 * host. B2C hosts are limited to the HTTP methods of the access level.
 *
 * @param config - The resolved configuration (secrets are read but never included in the result)
 * @param options - Sandbox name, access level, and extra hosts
 */
export function buildOpenShellSetup(config: NormalizedConfig, options: OpenShellSetupOptions = {}): OpenShellSetup {
  const accessLevel = options.accessLevel ?? 'NONE';
  const safetyRules = options.safety?.rules ?? [];
  const forwardSafety = safetyRules.length > 0 || options.safety?.confirm === true;
  const extraRules = accessLevel === 'NONE' ? [] : safetyNetworkRules(safetyRules);
  const sandboxName = toSandboxName(
    options.sandboxName ?? config.instanceName ?? config.hostname?.split('.')[0] ?? 'sandbox',
  );

  const providers: OpenShellProvider[] = [];
  const addProvider = (source: OpenShellProvider['source'], suffix: string): string => {
    const name = `${sandboxName}-${suffix}`;
    providers.push({name, type: PROFILES[source].id, envVar: PROFILES[source].envVar, source});
    return name;
  };

  const env: Record<string, string> = {};
  const setEnv = (key: string, value: string | undefined): void => {
    if (value) env[key] = value;
  };
  const policies: Record<string, unknown> = {};
  const hosts: string[] = [];
  const addPolicy = (key: string, name: string, endpoints: Array<Record<string, unknown>>): void => {
    policies[key] = {name, endpoints, binaries: [{path: NODE_BINARY}]};
    hosts.push(...endpoints.map((e) => e.host as string));
  };

  // Account Manager: the client secret may only be sent to the token endpoint.
  // The Account Manager API (`b2c am`) uses the OAuth token.
  const accountManagerHost = config.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  if (config.clientId && config.clientSecret) {
    const provider = addProvider('clientSecret', 'client-secret');
    // Inside the sandbox the secret is a placeholder, which defaults to an
    // unencoded Basic header. Secrets that Account Manager would misread
    // there go in the body instead, which the proxy re-encodes.
    const clientAuthMethod: ClientAuthMethod | undefined =
      config.clientAuthMethod === 'body' || secretNeedsBodyAuth(config.clientSecret) ? 'body' : undefined;
    const bodyRewrite = clientAuthMethod === 'body' ? {request_body_credential_rewrite: true} : {};
    addPolicy('b2c_account_manager', 'b2c-account-manager', [
      endpoint(
        accountManagerHost,
        [{allow: {method: 'POST', path: TOKEN_PATH}}, ...methodRules(accessLevel, false, AM_API_PATH)],
        {...bodyRewrite, credential_binding: {provider}},
      ),
    ]);
    setEnv('SFCC_CLIENT_ID', config.clientId);
    setEnv('SFCC_ACCOUNT_MANAGER_HOST', config.accountManagerHost);
    setEnv('SFCC_CLIENT_AUTH_METHOD', clientAuthMethod);
  }

  // Instance: OCAPI and WebDAV. The WebDAV access key is bound here only.
  if (config.hostname) {
    const provider = config.username && config.password ? addProvider('password', 'webdav') : undefined;
    const binding = provider ? {credential_binding: {provider}} : {};
    const instanceHosts = [...new Set([config.hostname, config.webdavHostname].filter(Boolean) as string[])];
    addPolicy(
      'b2c_instance',
      'b2c-instance',
      instanceHosts.map((host) => endpoint(host, [...methodRules(accessLevel, true), ...extraRules], binding)),
    );
    setEnv('SFCC_SERVER', config.hostname);
    setEnv('SFCC_WEBDAV_SERVER', config.webdavHostname);
    setEnv('SFCC_USERNAME', provider ? config.username : undefined);
    setEnv('SFCC_CODE_VERSION', config.codeVersion);
  }

  // SCAPI Admin APIs use the OAuth access token; no stored secret.
  if (config.shortCode) {
    addPolicy('b2c_scapi', 'b2c-scapi', [
      endpoint(`${config.shortCode}.api.commercecloud.salesforce.com`, [
        ...methodRules(accessLevel, false),
        ...extraRules,
      ]),
    ]);
    setEnv('SFCC_SHORTCODE', config.shortCode);
  }
  setEnv('SFCC_TENANT_ID', config.tenantId);
  setEnv('SFCC_SITE_ID', config.siteId);

  if (config.clientId && config.clientSecret) {
    // On-demand sandboxes (`b2c sandbox`) use the OAuth token.
    addPolicy('b2c_sandbox_api', 'b2c-sandbox-api', [
      endpoint(config.sandboxApiHost ?? DEFAULT_ODS_HOST, methodRules(accessLevel, false)),
    ]);
    setEnv('SFCC_SANDBOX_API_HOST', config.sandboxApiHost);

    // CIP analytics queries are read-only SQL, but the protocol sends every
    // request as a POST, so POST is allowed at every access level.
    const cipHosts = config.cipHost ? [config.cipHost] : [DEFAULT_CIP_HOST, DEFAULT_CIP_STAGING_HOST];
    addPolicy(
      'b2c_cip',
      'b2c-cip',
      cipHosts.map((host) => endpoint(host, [{allow: {method: 'POST', path: '/**'}}])),
    );
    setEnv('SFCC_CIP_HOST', config.cipHost);
  }

  // Managed Runtime: the API key is bound to the MRT host only.
  if (config.mrtApiKey) {
    const provider = addProvider('mrtApiKey', 'mrt');
    const mrtOrigin = config.mrtOrigin ?? DEFAULT_MRT_ORIGIN;
    // Tailing logs requests a short-lived log token (a POST), then opens a
    // WebSocket to the log host with that token.
    const logTokenRule = accessLevel === 'READ_ONLY' ? [{allow: {method: 'POST', path: MRT_LOG_TOKEN_PATH}}] : [];
    addPolicy('b2c_mrt', 'b2c-mrt', [
      endpoint(hostOf(mrtOrigin), [...methodRules(accessLevel, false), ...logTokenRule], {
        credential_binding: {provider},
      }),
      {host: hostOf(getLogsWebSocketUrl(mrtOrigin)), port: 443},
    ]);
    setEnv('MRT_PROJECT', config.mrtProject);
    setEnv('MRT_ENVIRONMENT', config.mrtEnvironment);
    setEnv('MRT_CLOUD_ORIGIN', config.mrtOrigin);
  }

  if (options.allowHosts && options.allowHosts.length > 0) {
    addPolicy(
      'b2c_additional',
      'b2c-additional-hosts',
      options.allowHosts.map((host) => endpoint(hostOf(host), methodRules(accessLevel, false))),
    );
  }

  // Documentation pages for `b2c docs read`: read only.
  addPolicy(
    'b2c_docs',
    'b2c-docs',
    DOCS_HOSTS.map((host) => endpoint(host, methodRules('READ_ONLY', false))),
  );

  // Match Safety Mode to the network policy so blocked operations fail early
  // with a clear message. Telemetry and update checks would only be denied.
  env.SFCC_SAFETY_LEVEL = accessLevel;
  if (forwardSafety) env.SFCC_SAFETY_CONFIG = OPENSHELL_SAFETY_CONFIG_PATH;
  env.SFCC_DISABLE_TELEMETRY = 'true';
  env.B2C_SKIP_NEW_VERSION_CHECK = 'true';

  const policy = yaml.dump(
    {
      version: 1,
      filesystem_policy: {
        include_workdir: true,
        read_only: ['/bin', '/usr', '/opt', '/lib', '/proc', '/dev/urandom', '/etc'],
        read_write: ['/sandbox', '/tmp', '/dev/null', '/home/sandbox'],
      },
      landlock: {compatibility: 'best_effort'},
      network_policies: policies,
    },
    {lineWidth: -1, flowLevel: 6, noRefs: true},
  );

  const profileSources = [...new Set(providers.map((p) => p.source))];
  return {
    sandboxName,
    profiles: profileSources.map((source) => ({id: PROFILES[source].id, content: renderProfile(PROFILES[source])})),
    providers,
    policy,
    env,
    hosts,
    safetyConfig: forwardSafety
      ? `${JSON.stringify({level: accessLevel, confirm: options.safety?.confirm, rules: safetyRules}, null, 2)}\n`
      : undefined,
    unmappedSafetyRules:
      accessLevel === 'NONE' ? [] : safetyRules.filter((r) => r.action !== 'block' && r.command !== undefined),
  };
}

/**
 * Returns the Dockerfile for a sandbox image with the B2C CLI (and optionally
 * the MCP server) installed.
 *
 * @param options - Package versions to install; defaults to `latest`
 */
export function buildOpenShellDockerfile(
  options: {cliVersion?: string; mcpVersion?: string; mcp?: boolean} = {},
): string {
  const packages = [`@salesforce/b2c-cli@${options.cliVersion ?? 'latest'}`];
  if (options.mcp) packages.push(`@salesforce/b2c-dx-mcp@${options.mcpVersion ?? 'latest'}`);
  return `FROM node:22-bookworm-slim
RUN apt-get update \\
 && apt-get install -y --no-install-recommends ca-certificates iproute2 \\
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g ${packages.join(' ')} && npm cache clean --force
RUN useradd --create-home --shell /bin/bash sandbox \\
 && install -d -o sandbox -g sandbox /sandbox
USER sandbox
WORKDIR /sandbox
`;
}
