/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, extractOAuthFlags, ALL_AUTH_METHODS} from './config.js';
import type {AuthMethod} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {ImplicitOAuthStrategy} from '../auth/oauth-implicit.js';
import {StatefulOAuthStrategy} from '../auth/stateful-oauth-strategy.js';
import {getStoredSession, isStatefulTokenValid} from '../auth/stateful-store.js';
import {t} from '../i18n/index.js';
import {DEFAULT_ACCOUNT_MANAGER_HOST} from '../defaults.js';

/**
 * Default OAuth authentication methods array used by getOAuthStrategy.
 * Extracted from getOAuthStrategy() to ensure getDefaultAuthMethods() returns the same array.
 */
const DEFAULT_OAUTH_AUTH_METHODS: AuthMethod[] = ['client-credentials', 'implicit'];

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
  private readonly _rawArgv: string[];

  constructor(argv: string[], config: ConstructorParameters<typeof Command>[1]) {
    super(argv, config);
    this._rawArgv = [...argv];
  }

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
    'auth-scope': Flags.string({
      description: 'OAuth scopes to request (comma-separated)',
      env: 'SFCC_OAUTH_SCOPES',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
      helpGroup: 'AUTH',
    }),
    'short-code': Flags.string({
      description: 'SCAPI short code',
      env: 'SFCC_SHORTCODE',
      helpGroup: 'AUTH',
    }),
    'tenant-id': Flags.string({
      description: 'Organization/tenant ID',
      env: 'SFCC_TENANT_ID',
      helpGroup: 'AUTH',
      aliases: ['tenant'],
    }),
    'auth-methods': Flags.string({
      description: 'Allowed auth methods in priority order (comma-separated)',
      env: 'SFCC_AUTH_METHODS',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
      options: ALL_AUTH_METHODS,
      helpGroup: 'AUTH',
      exclusive: ['user-auth'],
    }),
    'user-auth': Flags.boolean({
      description: 'Use browser-based user authentication (implicit OAuth flow)',
      default: false,
      exclusive: ['auth-methods'],
      helpGroup: 'AUTH',
    }),
    'account-manager-host': Flags.string({
      description: `Account Manager hostname for OAuth (default: ${DEFAULT_ACCOUNT_MANAGER_HOST})`,
      env: 'SFCC_ACCOUNT_MANAGER_HOST',
      helpGroup: 'AUTH',
    }),
  };

  protected override loadConfiguration(): ResolvedB2CConfig {
    return loadConfig(
      extractOAuthFlags(this.flags as Record<string, unknown>),
      this.getBaseConfigOptions(),
      this.getPluginSources(),
    );
  }

  /**
   * Gets the configured Account Manager host.
   */
  protected get accountManagerHost(): string {
    return this.resolvedConfig.values.accountManagerHost ?? DEFAULT_ACCOUNT_MANAGER_HOST;
  }

  /**
   * Gets the default authentication methods in priority order.
   * This method is used by getOAuthStrategy() when no auth methods are specified in config.
   * Subclasses can override this to change the default priority.
   *
   * @returns Array of auth methods in priority order (first is highest priority)
   */
  protected getDefaultAuthMethods(): AuthMethod[] {
    return DEFAULT_OAUTH_AUTH_METHODS;
  }

  /**
   * Returns a default client ID for implicit OAuth flows when no client ID is configured.
   * Returns undefined by default. Subclasses (AmCommand, OdsCommand, etc.) override this
   * to return DEFAULT_PUBLIC_CLIENT_ID for platform-level commands that support public client tokens.
   */
  protected getDefaultClientId(): string | undefined {
    return undefined;
  }

  /**
   * Gets an OAuth auth strategy based on allowed auth methods and available credentials.
   *
   * Iterates through allowed methods (in priority order) and returns the first
   * strategy for which the required credentials are available.
   *
   * For the implicit flow, falls back to getDefaultClientId() when no client ID
   * is explicitly configured.
   *
   * @throws Error if no allowed method has the required credentials configured
   */
  protected getOAuthStrategy(): OAuthStrategy | ImplicitOAuthStrategy | StatefulOAuthStrategy {
    const config = this.resolvedConfig.values;
    const accountManagerHost = this.accountManagerHost;
    const requiredScopes = config.scopes ?? [];

    const statefulSession = getStoredSession();
    const explicitAuthFlags = this.detectExplicitAuthFlags();
    const configuredClientId = config.clientId;
    const validSession =
      statefulSession !== null && isStatefulTokenValid(statefulSession, requiredScopes, undefined, configuredClientId);

    // Use stateful auth only when the session is valid and no explicit auth flags override it
    if (validSession && explicitAuthFlags.length === 0) {
      this.logger.debug('[Auth] Using stateful session (sfcc-ci compatible store)');
      return new StatefulOAuthStrategy(statefulSession, {
        accountManagerHost,
        scopes: requiredScopes,
      });
    }

    // Warn when an invalid stored session exists or explicit auth flags override a valid one
    if (statefulSession) {
      if (validSession && explicitAuthFlags.length > 0) {
        this.warn(
          t(
            'warning.statefulTokenOverridden',
            '[StatefulAuth] Valid token found in stored session. ' +
              `However, switching to stateless auth due to presence of ${explicitAuthFlags.join(', ')}. ` +
              'Remove these flags to use the stored session.',
          ),
        );
      } else if (!validSession) {
        const renewable = statefulSession.renewBase !== null && statefulSession.renewBase !== undefined;
        this.warn(
          t(
            renewable ? 'warning.statefulTokenExpired' : 'warning.statefulTokenExpiredNoRenew',
            '[StatefulAuth] [sfcc-ci compatibility] Stored token is expired or invalid for the given request. ' +
              (renewable
                ? 'Run `b2c auth client renew` to refresh it. '
                : 'Run `b2c auth client` or `b2c auth login` to re-authenticate. ') +
              'Falling back to stateless auth.',
          ),
        );
      }
    }

    // Fall back to stateless auth
    const allowedMethods = config.authMethods || this.getDefaultAuthMethods();
    const defaultClientId = this.getDefaultClientId();

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

        case 'implicit': {
          const effectiveClientId = config.clientId ?? defaultClientId;
          if (effectiveClientId) {
            if (!config.clientId && defaultClientId) {
              this.logger.debug('Using default B2C CLI public client for authentication');
            }
            return new ImplicitOAuthStrategy({
              clientId: effectiveClientId,
              scopes: config.scopes,
              accountManagerHost,
            });
          }
          break;
        }

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
   * Detects explicit CLI flags that indicate intent to use stateless auth.
   * Only flags that mandate a specific auth flow are considered:
   * - --client-secret: indicates client-credentials flow
   * - --user-auth: indicates browser-based implicit flow
   * - --auth-methods: explicit auth method selection
   *
   * Contextual flags (--client-id, --auth-scope, --short-code, --tenant-id,
   * --account-manager-host) are NOT included because they are handled by
   * isStatefulTokenValid (clientId/scope matching) or don't affect auth flow.
   */
  private detectExplicitAuthFlags(): string[] {
    const rawArgs = this._rawArgv;
    const statelessFlags = ['--client-secret', '--user-auth', '--auth-methods'];
    return statelessFlags.filter((flag) => rawArgs.some((arg) => arg === flag || arg.startsWith(`${flag}=`)));
  }

  /**
   * Check if OAuth credentials are available.
   * Returns true if clientId is configured (with or without clientSecret),
   * or if a default client ID is available for implicit flows.
   */
  protected hasOAuthCredentials(): boolean {
    return (
      this.resolvedConfig.hasOAuthConfig() || this.getDefaultClientId() !== undefined || getStoredSession() !== null
    );
  }

  /**
   * Check if full OAuth credentials (client credentials flow) are available.
   * Returns true only if both clientId and clientSecret are configured.
   */
  protected hasFullOAuthCredentials(): boolean {
    const config = this.resolvedConfig.values;
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

  /**
   * Get the tenant ID from resolved config, throwing if not available.
   * @throws Error if tenant ID is not provided through any source
   */
  protected requireTenantId(): string {
    const tenantId = this.resolvedConfig.values.tenantId;

    if (!tenantId) {
      this.error(
        t(
          'error.tenantIdRequired',
          'tenant-id is required. Provide via --tenant-id flag, SFCC_TENANT_ID env var, or tenant-id in dw.json.',
        ),
      );
    }
    // Strip optional f_ecom_ prefix so users can pass either the organization ID or tenant ID
    if (tenantId.startsWith('f_ecom_')) {
      return tenantId.slice('f_ecom_'.length);
    }
    return tenantId;
  }
}
