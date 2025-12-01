import * as fs from 'node:fs';
import * as path from 'node:path';
import type {AuthMethod} from '../auth/types.js';
import {ALL_AUTH_METHODS} from '../auth/types.js';

// Re-export for convenience
export type {AuthMethod};
export {ALL_AUTH_METHODS};

export interface ResolvedConfig {
  hostname?: string;
  webdavHostname?: string;
  codeVersion?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  shortCode?: string;
  mrtApiKey?: string;
  instanceName?: string;
  /** Allowed authentication methods (in priority order). If not set, all methods are allowed. */
  authMethods?: AuthMethod[];
}

/**
 * dw.json single config structure
 */
interface DwJsonConfig {
  name?: string;
  active?: boolean;
  hostname?: string;
  'code-version'?: string;
  username?: string;
  password?: string;
  'client-id'?: string;
  'client-secret'?: string;
  'oauth-scopes'?: string[];
  /** SCAPI short code (multiple key formats supported) */
  shortCode?: string;
  'short-code'?: string;
  'scapi-shortcode'?: string;
  secureHostname?: string;
  'secure-server'?: string;
  /** Allowed authentication methods (in priority order) */
  'auth-methods'?: AuthMethod[];
}

/**
 * dw.json with multi-config support
 */
interface DwJsonMultiConfig extends DwJsonConfig {
  configs?: DwJsonConfig[];
}

export interface LoadConfigOptions {
  instance?: string;
  configPath?: string;
}

/**
 * Finds dw.json by walking up from current directory.
 */
export function findDwJson(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    const dwJsonPath = path.join(dir, 'dw.json');
    if (fs.existsSync(dwJsonPath)) {
      return dwJsonPath;
    }
    dir = path.dirname(dir);
  }

  return null;
}

/**
 * Maps dw.json fields to ResolvedConfig
 */
function mapDwJsonToConfig(json: DwJsonConfig): ResolvedConfig {
  return {
    hostname: json.hostname,
    webdavHostname: json.secureHostname || json['secure-server'],
    codeVersion: json['code-version'],
    username: json.username,
    password: json.password,
    clientId: json['client-id'],
    clientSecret: json['client-secret'],
    scopes: json['oauth-scopes'],
    shortCode: json.shortCode || json['short-code'] || json['scapi-shortcode'],
    instanceName: json.name,
    authMethods: json['auth-methods'],
  };
}

/**
 * Loads configuration from dw.json file.
 * Supports multi-config format with 'configs' array.
 */
function loadDwJson(instanceName?: string, configPath?: string): ResolvedConfig {
  const dwJsonPath = configPath || findDwJson();
  if (!dwJsonPath || !fs.existsSync(dwJsonPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(dwJsonPath, 'utf8');
    const json = JSON.parse(content) as DwJsonMultiConfig;

    let selectedConfig: DwJsonConfig = json;

    // Handle multi-config format
    if (Array.isArray(json.configs)) {
      if (instanceName) {
        // Find by instance name
        const found = json.name === instanceName ? json : json.configs.find((c) => c.name === instanceName);
        if (found) {
          selectedConfig = found;
        }
      } else if (json.active === false) {
        // Root config is inactive, find active one in configs
        const activeConfig = json.configs.find((c) => c.active === true);
        if (activeConfig) {
          selectedConfig = activeConfig;
        }
      }
      // Otherwise use root config
    }

    return mapDwJsonToConfig(selectedConfig);
  } catch {
    // Silently ignore parse errors
    return {};
  }
}

/**
 * Merges config sources with precedence: flags (includes env via OCLIF) > dw.json
 *
 * Note: Environment variables are handled by OCLIF's flag parsing with the `env`
 * property on each flag definition. By the time flags reach this function, they
 * already contain env var values where applicable.
 */
function mergeConfigs(
  flags: Partial<ResolvedConfig>,
  dwJson: ResolvedConfig,
  options: LoadConfigOptions,
): ResolvedConfig {
  return {
    hostname: flags.hostname || dwJson.hostname,
    webdavHostname: flags.webdavHostname || dwJson.webdavHostname,
    codeVersion: flags.codeVersion || dwJson.codeVersion,
    username: flags.username || dwJson.username,
    password: flags.password || dwJson.password,
    clientId: flags.clientId || dwJson.clientId,
    clientSecret: flags.clientSecret || dwJson.clientSecret,
    scopes: flags.scopes || dwJson.scopes,
    shortCode: flags.shortCode || dwJson.shortCode,
    mrtApiKey: flags.mrtApiKey,
    instanceName: dwJson.instanceName || options.instance,
    authMethods: flags.authMethods || dwJson.authMethods,
  };
}

/**
 * Loads configuration with precedence: CLI flags/env vars > dw.json
 *
 * OCLIF handles environment variables automatically via flag `env` properties.
 * The flags parameter already contains resolved env var values.
 */
export function loadConfig(flags: Partial<ResolvedConfig> = {}, options: LoadConfigOptions = {}): ResolvedConfig {
  const dwJsonConfig = loadDwJson(options.instance, options.configPath);
  return mergeConfigs(flags, dwJsonConfig, options);
}
