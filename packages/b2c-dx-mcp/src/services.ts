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
 * Use {@link Services.fromResolvedConfig} with an already-resolved configuration:
 *
 * ```typescript
 * // In a command that extends BaseCommand
 * const services = Services.fromResolvedConfig(this.resolvedConfig);
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
 * **MRT Origin** (for Managed Runtime API URL):
 * 1. `--cloud-origin` flag (oclif also checks `SFCC_MRT_CLOUD_ORIGIN` env var)
 * 2. `mrtOrigin` field in dw.json
 * 3. Default: `https://cloud.mobify.com`
 *
 * @module services
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {AuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';

/**
 * MRT (Managed Runtime) configuration.
 * Groups auth, project, environment, and origin settings.
 */
export interface MrtConfig {
  /** Pre-resolved auth strategy for MRT API operations */
  auth?: AuthStrategy;
  /** MRT project slug from --project flag or SFCC_MRT_PROJECT env var */
  project?: string;
  /** MRT environment from --environment flag or SFCC_MRT_ENVIRONMENT env var */
  environment?: string;
  /** MRT API origin URL from --cloud-origin flag, SFCC_MRT_CLOUD_ORIGIN env var, or mrtOrigin in dw.json */
  origin?: string;
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
 * Use the static `Services.fromResolvedConfig()` factory method to create
 * an instance from an already-resolved configuration.
 *
 * @example
 * ```typescript
 * // In a command that extends BaseCommand
 * const services = Services.fromResolvedConfig(this.resolvedConfig);
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
   * Pre-resolved MRT configuration (auth, project, environment, origin).
   * Resolved once at server startup from MrtCommand flags and ~/.mobify.
   */
  public readonly mrtConfig: MrtConfig;

  public constructor(opts: ServicesOptions = {}) {
    this.b2cInstance = opts.b2cInstance;
    this.mrtConfig = opts.mrtConfig ?? {};
  }

  /**
   * Creates a Services instance from an already-resolved configuration.
   *
   * @param config - Already-resolved configuration from BaseCommand.resolvedConfig
   * @returns Services instance with resolved config
   *
   * @example
   * ```typescript
   * // In a command that extends BaseCommand
   * const services = Services.fromResolvedConfig(this.resolvedConfig);
   * ```
   */
  public static fromResolvedConfig(config: ResolvedB2CConfig): Services {
    // Build MRT config using factory methods
    const mrtConfig: MrtConfig = {
      auth: config.hasMrtConfig() ? config.createMrtAuth() : undefined,
      project: config.values.mrtProject,
      environment: config.values.mrtEnvironment,
      origin: config.values.mrtOrigin,
    };

    // Build B2C instance using factory method
    const b2cInstance = config.hasB2CInstanceConfig() ? config.createB2CInstance() : undefined;

    return new Services({
      b2cInstance,
      mrtConfig,
    });
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
