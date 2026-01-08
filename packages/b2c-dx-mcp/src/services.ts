/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Services module providing dependency injection for MCP tools.
 *
 * The {@link Services} class is the central dependency container for tools,
 * providing:
 * - Pre-resolved B2CInstance for WebDAV/OCAPI operations
 * - Pre-resolved MRT authentication for Managed Runtime operations
 * - MRT project/environment configuration
 * - File system utilities for local operations
 *
 * ## Creating Services
 *
 * Use {@link Services.create} to create an instance with all configuration
 * resolved eagerly at startup:
 *
 * ```typescript
 * const services = Services.create({
 *   b2cInstance: {
 *     configPath: flags.config,
 *     hostname: flags.server,
 *   },
 *   mrt: {
 *     apiKey: flags['api-key'],
 *     project: flags.project,
 *   },
 * });
 * ```
 *
 * ## Resolution Pattern
 *
 * Both B2CInstance and MRT auth are resolved once at server startup (not on each tool call).
 * This provides fail-fast behavior and consistent performance.
 *
 * **B2C Instance** (for WebDAV/OCAPI tools):
 * - Flags (highest priority) merged with dw.json (auto-discovered or via --config)
 *
 * **MRT Auth** (for Managed Runtime tools):
 * 1. `--api-key` flag (oclif also checks `SFCC_MRT_API_KEY` env var)
 * 2. `~/.mobify` config file (or `~/.mobify--[hostname]` if `--cloud-origin` is set)
 *
 * @module services
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {B2CInstance, type B2CInstanceOptions} from '@salesforce/b2c-tooling-sdk';
import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {loadMobifyConfig} from '@salesforce/b2c-tooling-sdk/cli';

/**
 * MRT (Managed Runtime) configuration.
 * Groups auth, project, and environment settings.
 */
export interface MrtConfig {
  /** Pre-resolved auth strategy for MRT API operations */
  auth?: AuthStrategy;
  /** MRT project slug from --project flag or SFCC_MRT_PROJECT env var */
  project?: string;
  /** MRT environment from --environment flag or SFCC_MRT_ENVIRONMENT env var */
  environment?: string;
}

/**
 * MRT input options for Services.create().
 */
export interface MrtCreateOptions {
  /** MRT API key from --api-key flag */
  apiKey?: string;
  /** MRT cloud origin URL for environment-specific config files */
  cloudOrigin?: string;
  /** MRT project slug from --project flag */
  project?: string;
  /** MRT environment from --environment flag */
  environment?: string;
}

/**
 * Options for Services.create() factory method.
 */
export interface ServicesCreateOptions {
  /** B2C instance configuration (from InstanceCommand.baseFlags) */
  b2cInstance?: B2CInstanceOptions;
  /** MRT configuration (from MrtCommand.baseFlags) */
  mrt?: MrtCreateOptions;
}

/**
 * Options for Services constructor (internal).
 */
export interface ServicesOptions {
  /** Pre-resolved B2C instance (if configured) */
  b2cInstance?: B2CInstance;
  /** Pre-resolved MRT configuration (auth, project, environment) */
  mrtConfig?: MrtConfig;
}

/**
 * Services class that provides utilities for MCP tools.
 *
 * Use the static `Services.create()` factory method to create an instance
 * with all configuration resolved eagerly at startup.
 *
 * @example
 * ```typescript
 * const services = Services.create({
 *   b2cInstance: { hostname: flags.server },
 *   mrt: { apiKey: flags['api-key'], project: flags.project },
 * });
 *
 * // Access resolved config
 * services.b2cInstance;        // B2CInstance | undefined
 * services.mrtConfig.auth;     // AuthStrategy | undefined
 * services.mrtConfig.project;  // string | undefined
 * ```
 */
export class Services {
  /**
   * Pre-resolved B2C instance for WebDAV/OCAPI operations.
   * Resolved once at server startup from InstanceCommand flags and dw.json.
   * Undefined if no B2C instance configuration was available.
   */
  public readonly b2cInstance?: B2CInstance;

  /**
   * Pre-resolved MRT configuration (auth, project, environment).
   * Resolved once at server startup from MrtCommand flags and ~/.mobify.
   */
  public readonly mrtConfig: MrtConfig;

  public constructor(opts: ServicesOptions = {}) {
    this.b2cInstance = opts.b2cInstance;
    this.mrtConfig = opts.mrtConfig ?? {};
  }

  /**
   * Creates a Services instance with all configuration resolved eagerly.
   *
   * **MRT auth resolution** (matches CLI behavior):
   * 1. `mrt.apiKey` option (from --api-key flag, which includes SFCC_MRT_API_KEY env var via oclif)
   * 2. `~/.mobify` config file (or `~/.mobify--[hostname]` if `mrt.cloudOrigin` is set)
   *
   * **B2C instance resolution**:
   * - `b2cInstance` options merged with dw.json (auto-discovered or via configPath)
   *
   * @param options - Configuration options
   * @returns Services instance with resolved config
   *
   * @example
   * ```typescript
   * const services = Services.create({
   *   b2cInstance: { configPath: flags.config, hostname: flags.server },
   *   mrt: { apiKey: flags['api-key'], project: flags.project },
   * });
   * ```
   */
  public static create(options: ServicesCreateOptions = {}): Services {
    // Resolve MRT config (auth from flag/env via oclif → ~/.mobify, plus project/environment)
    const mrtConfig: MrtConfig = {
      auth: Services.resolveMrtAuth({
        apiKey: options.mrt?.apiKey,
        cloudOrigin: options.mrt?.cloudOrigin,
      }),
      project: options.mrt?.project,
      environment: options.mrt?.environment,
    };

    // Resolve B2C instance from options (B2CInstanceOptions passed directly)
    const b2cInstance = Services.resolveB2CInstance(options.b2cInstance);

    return new Services({
      b2cInstance,
      mrtConfig,
    });
  }

  /**
   * Resolves B2C instance from available sources.
   *
   * Resolution merges:
   * 1. Explicit flag values (highest priority)
   * 2. dw.json file (via configPath or auto-discovery)
   *
   * @param options - Resolution options (same as B2CInstance.fromEnvironment)
   * @returns B2CInstance if configured, undefined if resolution fails
   */
  public static resolveB2CInstance(options: B2CInstanceOptions = {}): B2CInstance | undefined {
    try {
      return B2CInstance.fromEnvironment(options);
    } catch {
      // B2C instance resolution failed (no config available)
      // This is not an error - tools that don't need B2C instance will work fine
      return undefined;
    }
  }

  /**
   * Resolves MRT auth strategy from available sources.
   *
   * Resolution order:
   * 1. apiKey option (from --api-key flag, which includes SFCC_MRT_API_KEY env var via oclif)
   * 2. ~/.mobify config file (or ~/.mobify--[hostname] if cloudOrigin is set)
   *
   * Note: The --api-key flag in MrtCommand.baseFlags has `env: 'SFCC_MRT_API_KEY'`,
   * so oclif automatically falls back to the env var during flag parsing.
   *
   * @param options - Resolution options
   * @param options.apiKey - MRT API key from --api-key flag (includes env var via oclif)
   * @param options.cloudOrigin - MRT cloud origin URL for environment-specific config
   * @returns AuthStrategy if configured, undefined otherwise
   */
  public static resolveMrtAuth(options: {apiKey?: string; cloudOrigin?: string} = {}): AuthStrategy | undefined {
    // 1. Check apiKey option (oclif handles --api-key flag → SFCC_MRT_API_KEY env var fallback)
    if (options.apiKey?.trim()) {
      return new ApiKeyStrategy(options.apiKey, 'Authorization');
    }

    // 2. Check ~/.mobify config file (or ~/.mobify--[hostname] if cloud origin specified)
    const mobifyConfig = loadMobifyConfig(options.cloudOrigin);
    if (mobifyConfig.apiKey) {
      return new ApiKeyStrategy(mobifyConfig.apiKey, 'Authorization');
    }

    return undefined;
  }

  // ============================================
  // Internal OS Resource Access Methods
  // These are for internal use by tools, not exposed to AI assistants
  // ============================================

  /**
   * Check if a file or directory exists.
   *
   * @param targetPath - Path to check
   * @returns True if exists, false otherwise
   */
  public exists(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  /**
   * Get the current working directory.
   */
  public getCwd(): string {
    return process.cwd();
  }

  /**
   * Get the user's home directory.
   */
  public getHomeDir(): string {
    return os.homedir();
  }

  /**
   * Get OS platform information.
   */
  public getPlatform(): NodeJS.Platform {
    return os.platform();
  }

  /**
   * Get system temporary directory.
   */
  public getTmpDir(): string {
    return os.tmpdir();
  }

  /**
   * Join path segments.
   *
   * @param segments - Path segments to join
   * @returns Joined path
   */
  public joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * List directory contents.
   *
   * @param dirPath - Directory path to list
   * @returns Array of directory entries
   */
  public listDirectory(dirPath: string): fs.Dirent[] {
    return fs.readdirSync(dirPath, {withFileTypes: true});
  }

  /**
   * Read a file from the filesystem.
   *
   * @param filePath - Path to the file
   * @param encoding - File encoding (default: utf8)
   * @returns File contents as a string
   */
  public readFile(filePath: string, encoding: 'ascii' | 'base64' | 'hex' | 'latin1' | 'utf8' = 'utf8'): string {
    return fs.readFileSync(filePath, {encoding});
  }

  /**
   * Resolve a path relative to the current working directory.
   *
   * @param segments - Path segments to join and resolve
   * @returns Absolute path
   */
  public resolvePath(...segments: string[]): string {
    return path.resolve(...segments);
  }

  /**
   * Get file or directory stats.
   *
   * @param targetPath - Path to get stats for
   * @returns File stats object
   */
  public stat(targetPath: string): fs.Stats {
    return fs.statSync(targetPath);
  }
}
