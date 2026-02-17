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
import {
  createCustomApisClient,
  createScapiSchemasClient,
  toOrganizationId,
  WebDavClient,
  type CustomApisClient,
  type ScapiSchemasClient,
} from '@salesforce/b2c-tooling-sdk/clients';

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
  /** Resolved configuration for access to SCAPI settings */
  resolvedConfig: ResolvedB2CConfig;
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

  /**
   * Resolved configuration for accessing SCAPI settings.
   * Provides access to shortCode, tenantId, and OAuth credentials.
   * @private
   */
  private readonly resolvedConfig: ResolvedB2CConfig;

  public constructor(opts: ServicesOptions) {
    this.b2cInstance = opts.b2cInstance;
    this.mrtConfig = opts.mrtConfig ?? {};
    this.resolvedConfig = opts.resolvedConfig;
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
      resolvedConfig: config,
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
   * Get Custom APIs client for managing custom SCAPI endpoints.
   * Requires shortCode, tenantId, and OAuth credentials to be configured.
   *
   * @throws Error if shortCode, tenantId, or OAuth credentials are missing
   * @returns Typed Custom APIs client
   */
  public getCustomApisClient(): CustomApisClient {
    const {shortCode, tenantId} = this.resolvedConfig.values;

    if (!shortCode) {
      throw new Error(
        'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
      );
    }

    if (!tenantId) {
      throw new Error(
        'Tenant ID required. Provide --tenant-id, set SFCC_TENANT_ID, or configure tenant-id in dw.json.',
      );
    }

    // This will throw if OAuth credentials are missing
    const oauthStrategy = this.getOAuthStrategy();

    return createCustomApisClient({shortCode, tenantId}, oauthStrategy);
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
   * Get organization ID for SCAPI API calls.
   * Ensures the tenant ID has the required f_ecom_ prefix.
   *
   * @throws Error if tenantId is not configured
   * @returns Organization ID with f_ecom_ prefix
   */
  public getOrganizationId(): string {
    const {tenantId} = this.resolvedConfig.values;

    if (!tenantId) {
      throw new Error(
        'Tenant ID required. Provide --tenant-id, set SFCC_TENANT_ID, or configure tenant-id in dw.json.',
      );
    }

    return toOrganizationId(tenantId);
  }

  /**
   * Get OS platform information.
   */
  public getPlatform(): NodeJS.Platform {
    return os.platform();
  }

  /**
   * Get SCAPI Schemas client for discovering available SCAPI APIs.
   * Requires shortCode, tenantId, and OAuth credentials to be configured.
   *
   * @throws Error if shortCode, tenantId, or OAuth credentials are missing
   * @returns Typed SCAPI Schemas client
   */
  public getScapiSchemasClient(): ScapiSchemasClient {
    const {shortCode, tenantId} = this.resolvedConfig.values;

    if (!shortCode) {
      throw new Error(
        'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
      );
    }

    if (!tenantId) {
      throw new Error(
        'Tenant ID required. Provide --tenant-id, set SFCC_TENANT_ID, or configure tenant-id in dw.json.',
      );
    }

    // This will throw if OAuth credentials are missing
    const oauthStrategy = this.getOAuthStrategy();

    return createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
  }

  /**
   * Get SCAPI shortCode from configuration.
   * Returns undefined if not configured.
   *
   * @returns shortCode or undefined
   */
  public getShortCode(): string | undefined {
    return this.resolvedConfig.values.shortCode;
  }

  /**
   * Get tenant ID from configuration.
   * Returns undefined if not configured.
   *
   * @returns tenantId or undefined
   */
  public getTenantId(): string | undefined {
    return this.resolvedConfig.values.tenantId;
  }

  /**
   * Get system temporary directory.
   */
  public getTmpDir(): string {
    return os.tmpdir();
  }

  /**
   * Get WebDAV client for file operations on B2C instances.
   * Requires hostname and WebDAV credentials to be configured.
   *
   * @throws Error if hostname or B2C instance is missing
   * @returns WebDAV client instance
   */
  public getWebDavClient(): WebDavClient {
    if (!this.b2cInstance) {
      throw new Error('B2C instance required for WebDAV operations. Configure hostname and authentication in dw.json.');
    }

    return this.b2cInstance.webdav;
  }

  /**
   * Get the project working directory.
   * Falls back to process.cwd() if not explicitly set.
   *
   * This is the directory where the project is located, which may differ from process.cwd()
   * when MCP clients spawn servers from a different location (e.g., home directory).
   *
   * @returns Project working directory path
   */
  public getWorkingDirectory(): string {
    return this.resolvedConfig.values.workingDirectory ?? process.cwd();
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

  // ============================================
  // SCAPI Helper Methods
  // ============================================

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

  /**
   * Get OAuth strategy from resolved configuration.
   * Mirrors the pattern from OAuthCommand.getOAuthStrategy().
   *
   * @throws Error if OAuth credentials are not configured
   * @returns OAuth auth strategy
   * @private
   */
  private getOAuthStrategy(): AuthStrategy {
    if (!this.resolvedConfig.hasOAuthConfig()) {
      throw new Error('OAuth client ID required. Provide --client-id, set SFCC_CLIENT_ID, or configure in dw.json.');
    }

    // Use resolvedConfig factory to create OAuth strategy
    // This handles client-credentials vs implicit flow automatically
    return this.resolvedConfig.createOAuth();
  }
}
