/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {printFieldsBlock} from '@salesforce/b2c-tooling-sdk/cli';
import {
  ACCESS_KEY_SCOPES,
  getBmUserAccessKey,
  type BmAccessKeyDetails,
} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {BmUserAuthCommand} from '../../../utils/bm/user-auth-command.js';
import {resolveLoginOrWhoami} from '../../../utils/bm/resolve-login.js';
import {t} from '../../../i18n/index.js';

export default class BmAccessKeyGet extends BmUserAuthCommand<typeof BmAccessKeyGet> {
  static args = {
    login: Args.string({
      description: 'User login (email). Defaults to the currently authenticated user.',
      required: false,
    }),
  };

  static description = t(
    'commands.bm.accessKey.get.description',
    'Get access key details for an externally-managed Business Manager user. Defaults to the current user.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --scope STOREFRONT',
    '<%= config.bin %> <%= command.id %> user@example.com --scope AGENT_USER_AND_OCAPI',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    scope: Flags.string({
      description: 'Access key scope',
      options: [...ACCESS_KEY_SCOPES],
      default: 'WEBDAV_AND_STUDIO',
    }),
  };

  async run(): Promise<BmAccessKeyDetails> {
    this.requireOAuthCredentials();

    const {scope} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;
    const login = await resolveLoginOrWhoami(this.instance, this.args.login);

    this.log(
      t('commands.bm.accessKey.get.fetching', 'Fetching {{scope}} access key for {{login}} on {{hostname}}...', {
        login,
        scope,
        hostname,
      }),
    );

    const details = await getBmUserAccessKey(this.instance, login, scope);

    if (this.jsonEnabled()) {
      return details;
    }

    printFieldsBlock('Access Key', [
      ['Login', login],
      ['Scope', scope],
      ['Enabled', details.enabled?.toString()],
      ['Expiration date', details.expiration_date],
    ]);

    return details;
  }
}
