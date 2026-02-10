/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createAccountManagerClient} from '../clients/am-api.js';
import type {AccountManagerClient} from '../clients/am-api.js';
import type {AuthMethod} from './config.js';
import {DEFAULT_PUBLIC_CLIENT_ID} from '../defaults.js';

/**
 * Base command for Account Manager operations.
 *
 * Extends OAuthCommand with Account Manager client setup for users, roles, and organizations.
 * Overrides default auth methods to prioritize implicit flow for Account Manager operations.
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
  protected override getDefaultClientId(): string {
    return DEFAULT_PUBLIC_CLIENT_ID;
  }

  /**
   * Override default auth methods to prioritize implicit flow for Account Manager.
   * Gets the default methods from parent class, then ensures 'implicit' is first.
   * If 'implicit' is already present, moves it to first position.
   * If 'implicit' is not present, prepends it to the beginning.
   */
  protected override getDefaultAuthMethods(): AuthMethod[] {
    const defaultMethods = super.getDefaultAuthMethods();
    const implicitIndex = defaultMethods.indexOf('implicit');

    if (implicitIndex === 0) {
      // Already first, return as-is
      return defaultMethods;
    }

    if (implicitIndex > 0) {
      // Implicit exists but not first - move it to first
      const methods = [...defaultMethods];
      methods.splice(implicitIndex, 1);
      return ['implicit', ...methods];
    }

    // Implicit not present - prepend it
    return ['implicit', ...defaultMethods];
  }
  private _accountManagerClient?: AccountManagerClient;

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
      this._accountManagerClient = createAccountManagerClient(
        {
          hostname: this.accountManagerHost,
        },
        authStrategy,
      );
    }
    return this._accountManagerClient;
  }
}
