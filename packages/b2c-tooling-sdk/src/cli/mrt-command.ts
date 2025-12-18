/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, loadMobifyConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import type {AuthStrategy} from '../auth/types.js';
import {ApiKeyStrategy} from '../auth/api-key.js';
import {MrtClient} from '../platform/mrt.js';
import type {MrtProject} from '../platform/mrt.js';
import {t} from '../i18n/index.js';
import {DEFAULT_MRT_ORIGIN} from '../clients/mrt.js';

/**
 * Base command for Managed Runtime (MRT) operations.
 * Uses API key authentication.
 *
 * API key resolution order:
 * 1. --api-key flag
 * 2. SFCC_MRT_API_KEY environment variable
 * 3. ~/.mobify config file (api_key field), or ~/.mobify--[hostname] if --cloud-origin is set
 *
 * Project/environment resolution order:
 * 1. --project / --environment flags
 * 2. SFCC_MRT_PROJECT / SFCC_MRT_ENVIRONMENT environment variables
 * 3. dw.json (mrtProject / mrtEnvironment fields)
 *
 * Cloud origin resolution:
 * 1. --cloud-origin flag
 * 2. SFCC_MRT_CLOUD_ORIGIN environment variable
 * 3. Default: https://cloud.mobify.com
 */
export abstract class MrtCommand<T extends typeof Command> extends BaseCommand<T> {
  static baseFlags = {
    ...BaseCommand.baseFlags,
    'api-key': Flags.string({
      description: 'MRT API key',
      env: 'SFCC_MRT_API_KEY',
      helpGroup: 'AUTH',
    }),
    project: Flags.string({
      char: 'p',
      description: 'MRT project slug (or set mrtProject in dw.json)',
      env: 'SFCC_MRT_PROJECT',
    }),
    environment: Flags.string({
      char: 'e',
      description: 'MRT environment (e.g., staging, production; or set mrtEnvironment in dw.json)',
      env: 'SFCC_MRT_ENVIRONMENT',
    }),
    'cloud-origin': Flags.string({
      description: `MRT cloud origin URL (default: ${DEFAULT_MRT_ORIGIN})`,
      env: 'SFCC_MRT_CLOUD_ORIGIN',
    }),
  };

  protected override loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    const cloudOrigin = this.flags['cloud-origin'] as string | undefined;

    // Load from ~/.mobify (or ~/.mobify--[hostname] if cloud-origin specified) as fallback
    const mobifyConfig = loadMobifyConfig(cloudOrigin);

    const flagConfig: Partial<ResolvedConfig> = {
      // Flag/env takes precedence, then ~/.mobify
      mrtApiKey: this.flags['api-key'] || mobifyConfig.apiKey,
      // Project/environment from flags (if present - subclasses define these)
      mrtProject: this.flags.project as string | undefined,
      mrtEnvironment: this.flags.environment as string | undefined,
      // Cloud origin override
      mrtOrigin: cloudOrigin,
    };

    return loadConfig(flagConfig, options);
  }

  /**
   * Gets an API key auth strategy for MRT.
   */
  protected getMrtAuth(): AuthStrategy {
    const config = this.resolvedConfig;

    if (config.mrtApiKey) {
      return new ApiKeyStrategy(config.mrtApiKey, 'Authorization');
    }

    throw new Error(
      t(
        'error.mrtApiKeyRequired',
        'MRT API key required. Provide --api-key, set SFCC_MRT_API_KEY, or configure ~/.mobify',
      ),
    );
  }

  /**
   * Check if MRT credentials are available.
   */
  protected hasMrtCredentials(): boolean {
    return Boolean(this.resolvedConfig.mrtApiKey);
  }

  /**
   * Validates that MRT credentials are configured, errors if not.
   */
  protected requireMrtCredentials(): void {
    if (!this.hasMrtCredentials()) {
      this.error(
        t(
          'error.mrtApiKeyRequired',
          'MRT API key required. Provide --api-key, set SFCC_MRT_API_KEY, or configure ~/.mobify',
        ),
      );
    }
  }

  /**
   * Creates an MRT client for the given project.
   */
  protected createMrtClient(project: MrtProject): MrtClient {
    this.requireMrtCredentials();

    return new MrtClient(project, this.getMrtAuth());
  }
}
