import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, loadMobifyConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import type {AuthStrategy} from '../auth/types.js';
import {ApiKeyStrategy} from '../auth/api-key.js';
import {MrtClient} from '../platform/mrt.js';
import type {MrtProject} from '../platform/mrt.js';
import {t} from '../i18n/index.js';

/**
 * Base command for Managed Runtime (MRT) operations.
 * Uses API key authentication.
 *
 * API key resolution order:
 * 1. --api-key flag
 * 2. SFCC_MRT_API_KEY environment variable
 * 3. ~/.mobify config file (api_key field)
 */
export abstract class MrtCommand<T extends typeof Command> extends BaseCommand<T> {
  static baseFlags = {
    ...BaseCommand.baseFlags,
    'api-key': Flags.string({
      description: 'MRT API key',
      env: 'SFCC_MRT_API_KEY',
      helpGroup: 'AUTH',
    }),
  };

  protected override loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    // Load from ~/.mobify as fallback
    const mobifyConfig = loadMobifyConfig();

    const flagConfig: Partial<ResolvedConfig> = {
      // Flag/env takes precedence, then ~/.mobify
      mrtApiKey: this.flags['api-key'] || mobifyConfig.apiKey,
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
