/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createAccountManagerRolesClient} from '../clients/am-roles-api.js';
import type {AccountManagerRolesClient} from '../clients/am-roles-api.js';

/**
 * Base command for Account Manager role operations.
 *
 * Extends OAuthCommand with Account Manager Roles client setup.
 *
 * @example
 * export default class RoleList extends RoleCommand<typeof RoleList> {
 *   async run(): Promise<void> {
 *     const roles = await listRoles(this.accountManagerRolesClient, {});
 *     // ...
 *   }
 * }
 */
export abstract class RoleCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _accountManagerRolesClient?: AccountManagerRolesClient;

  /**
   * Gets the Account Manager Roles client, creating it if necessary.
   */
  protected get accountManagerRolesClient(): AccountManagerRolesClient {
    if (!this._accountManagerRolesClient) {
      this.requireOAuthCredentials();
      const authStrategy = this.getOAuthStrategy();
      this._accountManagerRolesClient = createAccountManagerRolesClient(
        {
          hostname: this.accountManagerHost,
        },
        authStrategy,
      );
    }
    return this._accountManagerRolesClient;
  }
}
