/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
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
import {getLogger} from '../logging/logger.js';
import {normalizeConfigKeys} from './mapping.js';

/**
 * Configuration structure for dw.json after key normalization.
 *
 * All keys are normalized to camelCase by `normalizeConfigKeys()` when loading.
 * Both camelCase and kebab-case are accepted in the raw file; the interface
 * documents the canonical (post-normalization) field names.
 *
 * Legacy aliases (e.g., `server`, `secureHostname`, `passphrase`, `selfsigned`,
 * `cloudOrigin`, `scapi-shortcode`) are also accepted and mapped to their
 * canonical names during normalization.
 */
export interface DwJsonConfig {
  /** Instance name (for multi-config files) */
  name?: string;
  /** Whether this config is active (for multi-config files) */
  active?: boolean;
  /** B2C instance hostname */
  hostname?: string;
  /** Code version for deployments */
  codeVersion?: string;
  /** Username for Basic auth (WebDAV) */
  username?: string;
  /** Password/access-key for Basic auth (WebDAV) */
  password?: string;
  /** OAuth client ID */
  clientId?: string;
  /** OAuth client secret */
  clientSecret?: string;
  /** OAuth scopes */
  oauthScopes?: string[];
  /** SCAPI short code */
  shortCode?: string;
  /** Alternate hostname for WebDAV (if different from main hostname) */
  webdavHostname?: string;
  /** Allowed authentication methods in priority order */
  authMethods?: AuthMethod[];
  /** Account Manager hostname for OAuth */
  accountManagerHost?: string;
  /** MRT project slug */
  mrtProject?: string;
  /** MRT environment name (e.g., staging, production) */
  mrtEnvironment?: string;
  /** MRT API key */
  mrtApiKey?: string;
  /** MRT cloud origin URL */
  mrtOrigin?: string;
  /** Tenant/Organization ID for SCAPI */
  tenantId?: string;
  /** ODS API hostname */
  sandboxApiHost?: string;
  /** Default content library ID for content export/list commands */
  contentLibrary?: string;
  /** Path to PKCS12 certificate file for mTLS (two-factor auth) */
  certificate?: string;
  /** Passphrase for the certificate */
  certificatePassphrase?: string;
  /** Whether to skip SSL/TLS certificate verification (self-signed certs) */
  selfSigned?: boolean;
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
 * Result of loading dw.json configuration.
 */
export interface LoadDwJsonResult {
  /** The parsed configuration */
  config: DwJsonConfig;
  /** The path to the dw.json file that was loaded */
  path: string;
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
function selectConfig(json: DwJsonMultiConfig, instanceName?: string): DwJsonConfig | undefined {
  const logger = getLogger();

  // Single config or no configs array
  if (!Array.isArray(json.configs) || json.configs.length === 0) {
    logger.trace(
      {selection: 'root', instanceName: json.name},
      `[DwJsonSource] Selected config "${json.name ?? 'root'}" (single config)`,
    );
    return json;
  }

  // Find by instance name
  if (instanceName) {
    // Check root first
    if (json.name === instanceName) {
      logger.trace(
        {selection: 'named', instanceName},
        `[DwJsonSource] Selected config "${instanceName}" by name (root)`,
      );
      return json;
    }
    // Then check configs array
    const found = json.configs.find((c) => c.name === instanceName);
    if (found) {
      logger.trace({selection: 'named', instanceName}, `[DwJsonSource] Selected config "${instanceName}" by name`);
      return found;
    }
    // Instance explicitly requested but not found - return undefined
    logger.trace({requestedInstance: instanceName}, `[DwJsonSource] Named instance "${instanceName}" not found`);
    return undefined;
  }

  // Find active config
  if (json.active === false) {
    // Root is inactive, look for active in configs
    const activeConfig = json.configs.find((c) => c.active === true);
    if (activeConfig) {
      logger.trace(
        {selection: 'active', instanceName: activeConfig.name},
        `[DwJsonSource] Selected config "${activeConfig.name}" by active flag`,
      );
      return activeConfig;
    }
  }

  // Default to root config
  logger.trace(
    {selection: 'root', instanceName: json.name},
    `[DwJsonSource] Selected config "${json.name ?? 'root'}" (default to root)`,
  );
  return json;
}

/**
 * Loads configuration from a dw.json file.
 *
 * If an explicit path is provided, uses that file. Otherwise, looks for dw.json
 * in the startDir (or cwd). Does NOT search parent directories.
 *
 * Use `findDwJson()` if you need to search upward through parent directories.
 *
 * @param options - Loading options
 * @returns The parsed config with its path, or undefined if no dw.json found
 *
 * @example
 * // Load from ./dw.json (current directory)
 * const result = loadDwJson();
 * if (result) {
 *   console.log(`Loaded from ${result.path}`);
 *   console.log(result.config.hostname);
 * }
 *
 * // Load from specific directory
 * const result = loadDwJson({ startDir: '/path/to/project' });
 *
 * // Use named instance
 * const result = loadDwJson({ instance: 'staging' });
 *
 * // Explicit path
 * const result = loadDwJson({ path: './config/dw.json' });
 */
export function loadDwJson(options: LoadDwJsonOptions = {}): LoadDwJsonResult | undefined {
  const logger = getLogger();

  // If explicit path provided, use it. Otherwise default to ./dw.json (no upward search)
  const dwJsonPath = options.path ?? path.join(options.startDir || process.cwd(), 'dw.json');

  logger.trace({path: dwJsonPath}, '[DwJsonSource] Checking for config file');

  if (!fs.existsSync(dwJsonPath)) {
    logger.trace({path: dwJsonPath}, '[DwJsonSource] No config file found');
    return undefined;
  }

  try {
    const content = fs.readFileSync(dwJsonPath, 'utf8');
    const raw = JSON.parse(content) as Record<string, unknown>;

    // Normalize root-level keys to camelCase
    const normalized = normalizeConfigKeys(raw) as DwJsonMultiConfig;

    // Normalize keys in each configs[] item
    if (Array.isArray(normalized.configs)) {
      normalized.configs = normalized.configs.map(
        (item) => normalizeConfigKeys(item as Record<string, unknown>) as DwJsonConfig,
      );
    }

    const config = selectConfig(normalized, options.instance);
    if (!config) {
      return undefined;
    }
    return {
      config,
      path: dwJsonPath,
    };
  } catch (error) {
    // Invalid JSON or read error - log at trace level and re-throw
    // The resolver will catch this and create a SOURCE_ERROR warning
    const message = error instanceof Error ? error.message : String(error);
    logger.trace({path: dwJsonPath, error: message}, '[DwJsonSource] Failed to parse config file');
    throw error;
  }
}
