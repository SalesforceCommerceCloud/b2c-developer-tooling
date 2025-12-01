/**
 * dw.json configuration file loading.
 *
 * This module provides utilities for loading B2C Commerce configuration from
 * dw.json files, the standard configuration format used by B2C development tools.
 *
 * @module config
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {AuthMethod} from '../auth/types.js';

/**
 * Configuration structure matching dw.json file format.
 * Uses kebab-case keys to match the file format.
 */
export interface DwJsonConfig {
  /** Instance name (for multi-config files) */
  name?: string;
  /** Whether this config is active (for multi-config files) */
  active?: boolean;
  /** B2C instance hostname */
  hostname?: string;
  /** Code version for deployments */
  'code-version'?: string;
  /** Username for Basic auth (WebDAV) */
  username?: string;
  /** Password/access-key for Basic auth (WebDAV) */
  password?: string;
  /** OAuth client ID */
  'client-id'?: string;
  /** OAuth client secret */
  'client-secret'?: string;
  /** OAuth scopes */
  'oauth-scopes'?: string[];
  /** SCAPI short code (kebab-case) */
  'short-code'?: string;
  /** SCAPI short code (camelCase) */
  shortCode?: string;
  /** SCAPI short code (alternate kebab-case) */
  'scapi-shortcode'?: string;
  /** Alternate hostname for WebDAV (if different from main hostname) */
  'webdav-hostname'?: string;
  /** Allowed authentication methods in priority order */
  'auth-methods'?: AuthMethod[];
}

/**
 * dw.json with multi-config support (configs array).
 */
export interface DwJsonMultiConfig extends DwJsonConfig {
  /** Array of named instance configurations */
  configs?: DwJsonConfig[];
}

/**
 * Options for loading dw.json.
 */
export interface LoadDwJsonOptions {
  /** Named instance to select from configs array */
  instance?: string;
  /** Explicit path to dw.json (skips searching if provided) */
  path?: string;
  /** Starting directory for search (defaults to cwd) */
  startDir?: string;
}

/**
 * Finds dw.json by searching upward from the starting directory.
 *
 * @param startDir - Directory to start searching from (defaults to cwd)
 * @returns Path to dw.json if found, undefined otherwise
 *
 * @example
 * const dwPath = findDwJson();
 * if (dwPath) {
 *   console.log(`Found dw.json at ${dwPath}`);
 * }
 */
export function findDwJson(startDir: string = process.cwd()): string | undefined {
  let dir = startDir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    const dwJsonPath = path.join(dir, 'dw.json');
    if (fs.existsSync(dwJsonPath)) {
      return dwJsonPath;
    }
    dir = path.dirname(dir);
  }

  return undefined;
}

/**
 * Selects the appropriate config from a multi-config dw.json.
 *
 * Selection priority:
 * 1. Named instance (if `instance` option provided)
 * 2. Config marked as `active: true`
 * 3. Root-level config
 */
function selectConfig(json: DwJsonMultiConfig, instanceName?: string): DwJsonConfig {
  // Single config or no configs array
  if (!Array.isArray(json.configs) || json.configs.length === 0) {
    return json;
  }

  // Find by instance name
  if (instanceName) {
    // Check root first
    if (json.name === instanceName) {
      return json;
    }
    // Then check configs array
    const found = json.configs.find((c) => c.name === instanceName);
    if (found) {
      return found;
    }
    // Instance not found, fall through to other selection methods
  }

  // Find active config
  if (json.active === false) {
    // Root is inactive, look for active in configs
    const activeConfig = json.configs.find((c) => c.active === true);
    if (activeConfig) {
      return activeConfig;
    }
  }

  // Default to root config
  return json;
}

/**
 * Loads configuration from a dw.json file.
 *
 * Searches upward from the current directory (or specified startDir) for a dw.json file.
 * Supports both single-config and multi-config formats.
 *
 * @param options - Loading options
 * @returns The parsed config, or undefined if no dw.json found
 *
 * @example
 * // Auto-find dw.json
 * const config = loadDwJson();
 *
 * // Use named instance
 * const config = loadDwJson({ instance: 'staging' });
 *
 * // Explicit path
 * const config = loadDwJson({ path: './config/dw.json' });
 */
export function loadDwJson(options: LoadDwJsonOptions = {}): DwJsonConfig | undefined {
  const dwJsonPath = options.path || findDwJson(options.startDir);

  if (!dwJsonPath || !fs.existsSync(dwJsonPath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(dwJsonPath, 'utf8');
    const json = JSON.parse(content) as DwJsonMultiConfig;
    return selectConfig(json, options.instance);
  } catch {
    // Invalid JSON or read error
    return undefined;
  }
}
