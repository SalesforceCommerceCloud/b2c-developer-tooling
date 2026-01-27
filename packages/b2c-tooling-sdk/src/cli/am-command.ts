/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createAccountManagerClient} from '../clients/am-api.js';
import type {AccountManagerClient} from '../clients/am-api.js';

/**
 * Base command for Account Manager operations.
 *
 * Extends OAuthCommand with Account Manager client setup for users, roles, and organizations.
 *
 * @example
 * export default class UserList extends AmCommand<typeof UserList> {
 *   async run(): Promise<void> {
 *     const users = await listUsers(this.accountManagerUsersClient, {});
 *     // ...
 *   }
 * }
 *
 * @example
 * export default class OrgList extends AmCommand<typeof OrgList> {
 *   async run(): Promise<void> {
 *     const orgs = await this.accountManagerOrgsClient.listOrgs();
 *     // ...
 *   }
 * }
 */
export abstract class AmCommand<T extends typeof Command> extends OAuthCommand<T> {
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
