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
 * - Configuration paths (dw.json location)
 * - Pre-resolved MRT authentication
 * - File system utilities for local operations
 *
 * ## Creating Services
 *
 * Use {@link Services.create} to create an instance with MRT auth automatically
 * resolved from command flags, environment variables, or config files:
 *
 * ```typescript
 * const services = Services.create({
 *   configPath: flags.config,
 *   mrtApiKey: flags['mrt-api-key'],
 *   mrtCloudOrigin: flags['mrt-cloud-origin'],
 * });
 * ```
 *
 * ## MRT Auth Resolution
 *
 * MRT authentication is resolved once at server startup (not on each tool call):
 *
 * 1. `mrtApiKey` option (from `--mrt-api-key` flag)
 * 2. `SFCC_MRT_API_KEY` environment variable
 * 3. `~/.mobify` config file (or `~/.mobify--[hostname]` if `mrtCloudOrigin` is set)
 *
 * @module services
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {loadMobifyConfig} from '@salesforce/b2c-tooling-sdk/cli';

/**
 * Options for Services.create() factory method.
 */
export interface ServicesCreateOptions {
  /** Optional explicit path to config file (dw.json format) */
  configPath?: string;
  /** MRT API key from --mrt-api-key flag */
  mrtApiKey?: string;
  /** MRT cloud origin URL for environment-specific config files */
  mrtCloudOrigin?: string;
}

/**
 * Options for Services constructor (internal).
 */
export interface ServicesOptions {
  /** Optional explicit path to config file (dw.json format) */
  configPath?: string;
  /** Pre-resolved MRT auth strategy (if configured) */
  mrtAuth?: AuthStrategy;
}

/**
 * Services class that provides utilities for MCP tools.
 *
 * Use the static `Services.create()` factory method to create an instance
 * with MRT auth automatically resolved from flags, environment, or config files.
 *
 * @example
 * ```typescript
 * const services = Services.create({
 *   configPath: flags.config,
 *   mrtApiKey: flags['mrt-api-key'],
 *   mrtCloudOrigin: flags['mrt-cloud-origin'],
 * });
 * ```
 */
export class Services {
  /**
   * Optional explicit path to config file (dw.json format).
   * If undefined, SDK's `loadDwJson()` will auto-discover it.
   */
  public readonly configPath?: string;

  /**
   * Pre-resolved MRT auth strategy for Managed Runtime operations.
   * Resolved once at server startup from --mrt-api-key flag,
   * SFCC_MRT_API_KEY env var, or ~/.mobify config file.
   * Undefined if no MRT API key was configured.
   */
  public readonly mrtAuth?: AuthStrategy;

  public constructor(opts: ServicesOptions = {}) {
    this.configPath = opts.configPath;
    this.mrtAuth = opts.mrtAuth;
  }

  /**
   * Creates a Services instance with MRT auth resolved from available sources.
   *
   * Resolution order for MRT auth (matches CLI behavior):
   * 1. mrtApiKey option (from --mrt-api-key flag)
   * 2. SFCC_MRT_API_KEY environment variable
   * 3. ~/.mobify config file (or ~/.mobify--[hostname] if mrtCloudOrigin is set)
   *
   * @param options - Configuration options
   * @returns Services instance with resolved auth
   *
   * @example
   * ```typescript
   * const services = Services.create({
   *   configPath: flags.config,
   *   mrtApiKey: flags['mrt-api-key'],
   *   mrtCloudOrigin: flags['mrt-cloud-origin'],
   * });
   * ```
   */
  public static create(options: ServicesCreateOptions = {}): Services {
    const mrtAuth = Services.resolveMrtAuth({
      apiKey: options.mrtApiKey,
      cloudOrigin: options.mrtCloudOrigin,
    });
    return new Services({
      configPath: options.configPath,
      mrtAuth,
    });
  }

  /**
   * Resolves MRT auth strategy from available sources.
   *
   * Resolution order (matches CLI behavior):
   * 1. apiKey option (from --mrt-api-key flag)
   * 2. SFCC_MRT_API_KEY environment variable
   * 3. ~/.mobify config file (or ~/.mobify--[hostname] if cloudOrigin is set)
   *
   * @param options - Resolution options
   * @param options.apiKey - MRT API key from --mrt-api-key flag
   * @param options.cloudOrigin - MRT cloud origin URL for environment-specific config
   * @returns AuthStrategy if configured, undefined otherwise
   */
  public static resolveMrtAuth(options: {apiKey?: string; cloudOrigin?: string} = {}): AuthStrategy | undefined {
    // 1. Check flag value first (highest priority)
    if (options.apiKey?.trim()) {
      return new ApiKeyStrategy(options.apiKey, 'Authorization');
    }

    // 2. Check environment variable
    const envApiKey = process.env.SFCC_MRT_API_KEY?.trim();
    if (envApiKey) {
      return new ApiKeyStrategy(envApiKey, 'Authorization');
    }

    // 3. Check ~/.mobify config file (or ~/.mobify--[hostname] if cloud origin specified)
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
