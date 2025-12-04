import * as os from 'node:os';
import * as path from 'node:path';
import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, loadMobifyConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import type {AuthStrategy} from '../auth/types.js';
import {ApiKeyStrategy} from '../auth/api-key.js';
import {MrtClient} from '../platform/mrt.js';
import type {MrtProject} from '../platform/mrt.js';
import {DEFAULT_MRT_ORIGIN} from '../clients/mrt.js';
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
    'cloud-origin': Flags.string({
      description: 'MRT cloud API origin URL',
      env: 'CLOUD_API_BASE',
      default: DEFAULT_MRT_ORIGIN,
      helpGroup: 'MRT',
    }),
    'credentials-file': Flags.string({
      char: 'c',
      description: 'Override the standard credentials file location (~/.mobify)',
      env: 'MRT_CREDENTIALS_FILE',
      helpGroup: 'AUTH',
    }),
  };

  protected override loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    // Determine credentials file path:
    // 1. Explicit --credentials-file flag takes precedence
    // 2. If --cloud-origin is non-default and no explicit credentials file,
    //    use ~/.mobify--[hostname] where hostname is extracted from the origin URL
    // 3. Otherwise use default ~/.mobify
    const credentialsPath = this.resolveCredentialsPath();

    // Load from credentials file as fallback
    const mobifyConfig = loadMobifyConfig(credentialsPath);

    const flagConfig: Partial<ResolvedConfig> = {
      // Flag/env takes precedence, then credentials file
      mrtApiKey: this.flags['api-key'] || mobifyConfig.apiKey,
      mrtOrigin: this.flags['cloud-origin'],
    };

    return loadConfig(flagConfig, options);
  }

  /**
   * Resolves the credentials file path based on flags.
   *
   * When --cloud-origin is overridden from default and --credentials-file is not
   * explicitly provided, the credentials file defaults to ~/.mobify--[hostname]
   * where hostname is the cloud-origin hostname value.
   *
   * @returns The resolved credentials file path, or undefined to use default ~/.mobify
   */
  private resolveCredentialsPath(): string | undefined {
    // Explicit credentials file always takes precedence
    if (this.flags['credentials-file']) {
      return this.flags['credentials-file'];
    }

    // If cloud-origin is non-default, derive credentials file from hostname
    const cloudOrigin = this.flags['cloud-origin'];
    if (cloudOrigin && cloudOrigin !== DEFAULT_MRT_ORIGIN) {
      try {
        const url = new URL(cloudOrigin);
        return path.join(os.homedir(), `.mobify--${url.hostname}`);
      } catch {
        // Invalid URL, fall back to default
        return undefined;
      }
    }

    // Use default ~/.mobify
    return undefined;
  }

  /**
   * Gets the configured MRT cloud origin URL.
   */
  protected getMrtOrigin(): string {
    return this.resolvedConfig.mrtOrigin || DEFAULT_MRT_ORIGIN;
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
