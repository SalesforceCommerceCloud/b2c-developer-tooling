import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, ALL_AUTH_METHODS} from './config.js';
import type {ResolvedConfig, LoadConfigOptions, AuthMethod} from './config.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {ImplicitOAuthStrategy} from '../auth/oauth-implicit.js';
import {t} from '../i18n/index.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';

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
    'auth-methods': Flags.string({
      description: 'Allowed auth methods in priority order (comma-separated or multiple flags)',
      env: 'SFCC_AUTH_METHODS',
      multiple: true,
      options: ALL_AUTH_METHODS,
      helpGroup: 'AUTH',
    }),
    'account-manager-host': Flags.string({
      description: 'Account Manager hostname for OAuth',
      env: 'SFCC_ACCOUNT_MANAGER_HOST',
      default: DEFAULT_ACCOUNT_MANAGER_HOST,
      helpGroup: 'AUTH',
    }),
  };

  /**
   * Parses auth methods from flags, supporting both comma-separated values and multiple flags.
   * Returns methods in the order specified (priority order).
   */
  protected parseAuthMethods(): AuthMethod[] | undefined {
    const flagValues = this.flags['auth-methods'] as string[] | undefined;
    if (!flagValues || flagValues.length === 0) {
      return undefined;
    }

    // Flatten comma-separated values while preserving order
    const methods: AuthMethod[] = [];
    for (const value of flagValues) {
      const parts = value.split(',').map((s) => s.trim());
      for (const part of parts) {
        if (part && ALL_AUTH_METHODS.includes(part as AuthMethod)) {
          methods.push(part as AuthMethod);
        }
      }
    }

    return methods.length > 0 ? methods : undefined;
  }

  protected override loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    const flagConfig: Partial<ResolvedConfig> = {
      clientId: this.flags['client-id'],
      clientSecret: this.flags['client-secret'],
      shortCode: this.flags['short-code'],
      authMethods: this.parseAuthMethods(),
    };

    const config = loadConfig(flagConfig, options);

    // Merge scopes from flags with config file scopes (flags take precedence if provided)
    if (this.flags.scope && this.flags.scope.length > 0) {
      config.scopes = this.flags.scope;
    }

    return config;
  }

  /**
   * Gets the configured Account Manager host.
   */
  protected get accountManagerHost(): string {
    return this.flags['account-manager-host'] ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  }

  /**
   * Gets an OAuth auth strategy based on allowed auth methods and available credentials.
   *
   * Iterates through allowed methods (in priority order) and returns the first
   * strategy for which the required credentials are available.
   *
   * @throws Error if no allowed method has the required credentials configured
   */
  protected getOAuthStrategy(): OAuthStrategy | ImplicitOAuthStrategy {
    const config = this.resolvedConfig;
    const accountManagerHost = this.accountManagerHost;
    // Default to client-credentials and implicit if no methods specified
    const allowedMethods = config.authMethods || (['client-credentials', 'implicit'] as AuthMethod[]);

    for (const method of allowedMethods) {
      switch (method) {
        case 'client-credentials':
          if (config.clientId && config.clientSecret) {
            return new OAuthStrategy({
              clientId: config.clientId,
              clientSecret: config.clientSecret,
              scopes: config.scopes,
              accountManagerHost,
            });
          }
          break;

        case 'implicit':
          if (config.clientId) {
            return new ImplicitOAuthStrategy({
              clientId: config.clientId,
              scopes: config.scopes,
              accountManagerHost,
            });
          }
          break;

        // 'basic' and 'api-key' are not applicable for OAuth strategies
        // They would be handled by different command bases (e.g., InstanceCommand, MRTCommand)
      }
    }

    // Build helpful error message based on what methods were allowed
    const methodsStr = allowedMethods.join(', ');
    throw new Error(
      t(
        'error.noValidAuthMethod',
        `No valid auth method available. Allowed methods: [${methodsStr}]. ` +
          `Ensure required credentials are configured for at least one method.`,
      ),
    );
  }

  /**
   * Check if OAuth credentials are available.
   * Returns true if clientId is configured (with or without clientSecret).
   */
  protected hasOAuthCredentials(): boolean {
    const config = this.resolvedConfig;
    return Boolean(config.clientId);
  }

  /**
   * Check if full OAuth credentials (client credentials flow) are available.
   * Returns true only if both clientId and clientSecret are configured.
   */
  protected hasFullOAuthCredentials(): boolean {
    const config = this.resolvedConfig;
    return Boolean(config.clientId && config.clientSecret);
  }

  /**
   * Validates that OAuth credentials are configured, errors if not.
   * Only clientId is required (implicit flow can be used without clientSecret).
   */
  protected requireOAuthCredentials(): void {
    if (!this.hasOAuthCredentials()) {
      this.error(
        t('error.oauthClientIdRequired', 'OAuth client ID required. Provide --client-id or set SFCC_CLIENT_ID.'),
      );
    }
  }
}
