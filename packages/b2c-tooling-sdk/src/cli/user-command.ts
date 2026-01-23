/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createAccountManagerUsersClient} from '../clients/am-users-api.js';
import type {AccountManagerUsersClient} from '../clients/am-users-api.js';

/**
 * Base command for Account Manager user operations.
 *
 * Extends OAuthCommand with Account Manager Users client setup.
 *
 * @example
 * export default class UserList extends UserCommand<typeof UserList> {
 *   async run(): Promise<void> {
 *     const users = await this.accountManagerUsersClient.listUsers();
 *     // ...
 *   }
 * }
 */
export abstract class UserCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _accountManagerUsersClient?: AccountManagerUsersClient;

  /**
   * Gets the Account Manager Users client, creating it if necessary.
   */
  protected get accountManagerUsersClient(): AccountManagerUsersClient {
    if (!this._accountManagerUsersClient) {
      this.requireOAuthCredentials();
      const authStrategy = this.getOAuthStrategy();
      this._accountManagerUsersClient = createAccountManagerUsersClient(
        {
          hostname: this.accountManagerHost,
        },
        authStrategy,
      );
    }
    return this._accountManagerUsersClient;
  }
}
