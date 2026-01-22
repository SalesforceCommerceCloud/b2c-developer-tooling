/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createAccountManagerOrgsClient} from '../clients/am-orgs-api.js';
import type {AccountManagerOrgsClient} from '../clients/am-orgs-api.js';

/**
 * Base command for Account Manager organization operations.
 *
 * Extends OAuthCommand with Account Manager Organizations client setup.
 *
 * @example
 * export default class OrgList extends OrgCommand<typeof OrgList> {
 *   async run(): Promise<void> {
 *     const orgs = await this.accountManagerOrgsClient.listOrgs();
 *     // ...
 *   }
 * }
 */
export abstract class OrgCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _accountManagerOrgsClient?: AccountManagerOrgsClient;

  /**
   * Gets the Account Manager Organizations client, creating it if necessary.
   */
  protected get accountManagerOrgsClient(): AccountManagerOrgsClient {
    if (!this._accountManagerOrgsClient) {
      this.requireOAuthCredentials();
      const authStrategy = this.getOAuthStrategy();
      this._accountManagerOrgsClient = createAccountManagerOrgsClient(
        {
          hostname: this.accountManagerHost,
        },
        authStrategy,
      );
    }
    return this._accountManagerOrgsClient;
  }
}
