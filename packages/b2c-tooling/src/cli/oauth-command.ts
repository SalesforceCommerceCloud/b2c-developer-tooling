import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {t} from '../i18n/index.js';

/**
 * Base command for operations requiring OAuth authentication.
 * Use this for platform-level operations like ODS, APIs.
 *
 * Environment variables:
 * - SFCC_CLIENT_ID: OAuth client ID
 * - SFCC_CLIENT_SECRET: OAuth client secret
 *
 * For B2C instance specific operations, use InstanceCommand instead.
 */
export abstract class OAuthCommand<T extends typeof Command> extends BaseCommand<T> {
  static baseFlags = {
    ...BaseCommand.baseFlags,
    'client-id': Flags.string({
      description: 'Client ID for OAuth',
      env: 'SFCC_CLIENT_ID',
      helpGroup: 'AUTH',
    }),
    'client-secret': Flags.string({
      description: 'Client Secret for OAuth',
      env: 'SFCC_CLIENT_SECRET',
      helpGroup: 'AUTH',
    }),
    scope: Flags.string({
      description: 'OAuth scopes to request (can be specified multiple times)',
      env: 'SFCC_OAUTH_SCOPES',
      multiple: true,
      helpGroup: 'AUTH',
    }),
    'short-code': Flags.string({
      description: 'SCAPI short code',
      env: 'SFCC_SHORTCODE',
      helpGroup: 'AUTH',
    }),
  };

  protected override loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    const flagConfig: Partial<ResolvedConfig> = {
      clientId: this.flags['client-id'],
      clientSecret: this.flags['client-secret'],
      shortCode: this.flags['short-code'],
    };

    const config = loadConfig(flagConfig, options);

    // Merge scopes from flags with config file scopes (flags take precedence if provided)
    if (this.flags.scope && this.flags.scope.length > 0) {
      config.scopes = this.flags.scope;
    }

    return config;
  }

  /**
   * Gets an OAuth auth strategy.
   */
  protected getOAuthStrategy(): OAuthStrategy {
    const config = this.resolvedConfig;

    if (config.clientId && config.clientSecret) {
      return new OAuthStrategy({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: config.scopes,
      });
    }

    throw new Error(
      t(
        'error.oauthCredentialsRequired',
        'OAuth credentials required. Provide --client-id/--client-secret or set SFCC_CLIENT_ID/SFCC_CLIENT_SECRET.',
      ),
    );
  }

  /**
   * Check if OAuth credentials are available.
   */
  protected hasOAuthCredentials(): boolean {
    const config = this.resolvedConfig;
    return Boolean(config.clientId && config.clientSecret);
  }

  /**
   * Validates that OAuth credentials are configured, errors if not.
   */
  protected requireOAuthCredentials(): void {
    if (!this.hasOAuthCredentials()) {
      this.error(
        t(
          'error.oauthCredentialsRequired',
          'OAuth credentials required. Provide --client-id/--client-secret or set SFCC_CLIENT_ID/SFCC_CLIENT_SECRET.',
        ),
      );
    }
  }
}
