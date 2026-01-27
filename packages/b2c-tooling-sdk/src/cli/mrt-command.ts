/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, extractMrtFlags} from './config.js';
import type {LoadConfigOptions} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import type {AuthStrategy} from '../auth/types.js';
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
 * 3. dw.json (mrtOrigin field)
 * 4. Default: https://cloud.mobify.com
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
      description: `MRT cloud origin URL (or set mrtOrigin in dw.json; default: ${DEFAULT_MRT_ORIGIN})`,
      env: 'SFCC_MRT_CLOUD_ORIGIN',
    }),
    'credentials-file': Flags.string({
      description: 'Path to MRT credentials file (overrides default ~/.mobify)',
      env: 'MRT_CREDENTIALS_FILE',
    }),
  };

  protected override loadConfiguration(): ResolvedB2CConfig {
    const mrt = extractMrtFlags(this.flags as Record<string, unknown>);
    const options: LoadConfigOptions = {
      ...this.getBaseConfigOptions(),
      ...mrt.options,
    };

    return loadConfig(mrt.config, options, this.getPluginSources());
  }

  /**
   * Gets an API key auth strategy for MRT.
   */
  protected getMrtAuth(): AuthStrategy {
    if (this.resolvedConfig.hasMrtConfig()) {
      return this.resolvedConfig.createMrtAuth();
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
    return this.resolvedConfig.hasMrtConfig();
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
