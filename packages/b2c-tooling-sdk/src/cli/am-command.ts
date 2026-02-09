/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createAccountManagerClient} from '../clients/am-api.js';
import type {AccountManagerClient} from '../clients/am-api.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {ImplicitOAuthStrategy} from '../auth/oauth-implicit.js';

/** Account Manager role: User Administrator */
const AM_USER_ADMIN = 'User Administrator';
/** Account Manager role: Account Administrator */
const AM_ACCOUNT_ADMIN = 'Account Administrator';
/** Account Manager role: API Administrator */
const AM_API_ADMIN = 'API Administrator';

/** Patterns that indicate an authentication/authorization error */
const AUTH_ERROR_PATTERNS = [
  'authentication invalid',
  'operation forbidden',
  '401',
  '403',
  'failed to get access token',
  'unauthorized',
];

/**
 * Base command for Account Manager operations.
 *
 * Extends OAuthCommand with Account Manager client setup for users, roles, and organizations.
 * Provides enhanced error messages with role-specific guidance when authentication fails.
 *
 * @example
 * export default class UserList extends AmCommand<typeof UserList> {
 *   async run(): Promise<void> {
 *     const users = await this.accountManagerClient.listUsers({});
 *     // ...
 *   }
 * }
 *
 * @example
 * export default class OrgList extends AmCommand<typeof OrgList> {
 *   async run(): Promise<void> {
 *     const orgs = await this.accountManagerClient.listOrgs();
 *     // ...
 *   }
 * }
 */
export abstract class AmCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _accountManagerClient?: AccountManagerClient;
  private _authStrategy?: OAuthStrategy | ImplicitOAuthStrategy;

  /**
   * Gets the auth method type that was used, based on the stored strategy.
   */
  protected get authMethodUsed(): 'implicit' | 'client-credentials' | undefined {
    if (!this._authStrategy) return undefined;
    return this._authStrategy instanceof ImplicitOAuthStrategy ? 'implicit' : 'client-credentials';
  }

  /**
   * Gets the unified Account Manager client, creating it if necessary.
   * This provides direct access to all Account Manager API methods (users, roles, orgs).
   *
   * @example
   * const client = this.accountManagerClient;
   * const users = await client.listUsers({});
   * const roles = await client.listRoles({});
   * const orgs = await client.listOrgs();
   * const user = await client.getUser('user-id');
   * const role = await client.getRole('bm-admin');
   * const org = await client.getOrg('org-id');
   */
  protected get accountManagerClient(): AccountManagerClient {
    if (!this._accountManagerClient) {
      this.requireOAuthCredentials();
      const authStrategy = this.getOAuthStrategy();
      this._authStrategy = authStrategy;
      this._accountManagerClient = createAccountManagerClient(
        {
          hostname: this.accountManagerHost,
        },
        authStrategy,
      );
    }
    return this._accountManagerClient;
  }

  /**
   * Override catch() to detect auth errors and append contextual AM role guidance.
   */
  protected async catch(err: Error & {exitCode?: number}): Promise<never> {
    const message = err.message?.toLowerCase() ?? '';
    const isAuthError = AUTH_ERROR_PATTERNS.some((pattern) => message.includes(pattern));

    if (isAuthError) {
      const suggestion = this.getAuthErrorSuggestion();
      if (suggestion) {
        err.message = `${err.message}\n\n${suggestion}`;
      }
    }

    return super.catch(err);
  }

  /**
   * Builds a contextual suggestion message based on the auth method and AM subtopic.
   */
  private getAuthErrorSuggestion(): string | undefined {
    const subtopic = this.getAmSubtopic();
    const authMethod = this.authMethodUsed;

    if (!subtopic) return undefined;

    // Try to get current JWT roles for client-credentials (avoid triggering browser login for implicit)
    let rolesInfo = '';
    if (authMethod === 'client-credentials' && this._authStrategy) {
      try {
        // getJWT() is async but we only want cached token info — use synchronous check
        // The token should already be cached if we got far enough to receive an auth error
        rolesInfo = this.getJwtRolesInfo();
      } catch {
        // Token may be expired or unavailable, skip roles info
      }
    }

    if (authMethod === 'client-credentials') {
      return this.getClientCredentialsSuggestion(subtopic, rolesInfo);
    }

    if (authMethod === 'implicit') {
      return this.getImplicitSuggestion(subtopic);
    }

    return undefined;
  }

  /**
   * Gets the AM subtopic from the command ID (e.g., 'am:users:list' → 'users').
   */
  private getAmSubtopic(): string | undefined {
    if (!this.id) return undefined;
    const parts = this.id.split(':');
    // Command IDs are like 'am:users:list', 'am:roles:get', 'am:orgs:list', 'am:clients:list'
    const amIndex = parts.indexOf('am');
    if (amIndex >= 0 && amIndex + 1 < parts.length) {
      return parts[amIndex + 1];
    }
    return undefined;
  }

  /**
   * Attempts to extract roles from the cached JWT token synchronously.
   */
  private getJwtRolesInfo(): string {
    // Access the strategy's internal token cache via getJWT()
    // This is best-effort — if no token is cached, we skip
    if (!this._authStrategy) return '';

    // We can't call async getJWT() here, but we can check if OAuthStrategy has a cached token
    // by looking at the strategy type. For now, we'll return empty and let the suggestion
    // work without role details.
    return '';
  }

  /**
   * Suggestion for client-credentials auth failures.
   */
  private getClientCredentialsSuggestion(subtopic: string, rolesInfo: string): string {
    const suffix = rolesInfo ? `\n${rolesInfo}` : '';

    switch (subtopic) {
      case 'users':
      case 'roles':
        return (
          `Suggestion: Add the "${AM_USER_ADMIN}" role to your API client, ` +
          `or use --user-auth to authenticate as a user with the appropriate role.${suffix}`
        );
      case 'orgs':
        return (
          `Suggestion: Use --user-auth to authenticate as a user with the "${AM_ACCOUNT_ADMIN}" role. ` +
          `Organization management requires user authentication.${suffix}`
        );
      case 'clients':
        return (
          `Suggestion: Use --user-auth to authenticate as a user with the ` +
          `"${AM_ACCOUNT_ADMIN}" or "${AM_API_ADMIN}" role. ` +
          `API client management requires user authentication.${suffix}`
        );
      default:
        return `Suggestion: Try using --user-auth for browser-based authentication.${suffix}`;
    }
  }

  /**
   * Suggestion for implicit auth failures.
   */
  private getImplicitSuggestion(subtopic: string): string {
    switch (subtopic) {
      case 'users':
      case 'roles':
        return (
          `Suggestion: Your user account needs the "${AM_ACCOUNT_ADMIN}" or "${AM_USER_ADMIN}" role ` +
          `to manage users and roles.`
        );
      case 'clients':
        return (
          `Suggestion: Your user account needs the "${AM_ACCOUNT_ADMIN}" or "${AM_API_ADMIN}" role ` +
          `to manage API clients.`
        );
      case 'orgs':
        return `Suggestion: Your user account needs the "${AM_ACCOUNT_ADMIN}" role to manage organizations.`;
      default:
        return `Suggestion: Verify your user account has the appropriate Account Manager role.`;
    }
  }
}
