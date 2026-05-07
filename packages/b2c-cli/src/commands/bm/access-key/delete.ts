/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {ACCESS_KEY_SCOPES, deleteBmUserAccessKey} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {confirm} from '@salesforce/b2c-tooling-sdk/ux';
import {BmUserAuthCommand} from '../../../utils/bm/user-auth-command.js';
import {resolveLoginOrWhoami} from '../../../utils/bm/resolve-login.js';
import {t} from '../../../i18n/index.js';

interface DeleteResult {
  success: boolean;
  login: string;
  scope: string;
  hostname: string;
}

export default class BmAccessKeyDelete extends BmUserAuthCommand<typeof BmAccessKeyDelete> {
  static args = {
    login: Args.string({
      description: 'User login (email). Defaults to the currently authenticated user.',
      required: false,
    }),
  };

  static description = t(
    'commands.bm.accessKey.delete.description',
    'Delete an access key for an externally-managed Business Manager user. Defaults to the current user.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --scope STOREFRONT --force',
    '<%= config.bin %> <%= command.id %> user@example.com --scope AGENT_USER_AND_OCAPI',
  ];

  static flags = {
    scope: Flags.string({
      description: 'Access key scope',
      options: [...ACCESS_KEY_SCOPES],
      default: 'WEBDAV_AND_STUDIO',
    }),
    force: Flags.boolean({
      description: 'Skip the confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<DeleteResult> {
    this.requireOAuthCredentials();

    const {scope, force} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;
    const login = await resolveLoginOrWhoami(this.instance, this.args.login);

    if (!force && !this.jsonEnabled()) {
      const answer = await confirm(
        t('commands.bm.accessKey.delete.confirm', 'Delete the {{scope}} access key for {{login}} on {{hostname}}?', {
          login,
          scope,
          hostname,
        }),
      );
      if (!answer) {
        this.log(t('commands.bm.accessKey.delete.cancelled', 'Cancelled.'));
        return {success: false, login, scope, hostname};
      }
    }

    this.log(
      t('commands.bm.accessKey.delete.deleting', 'Deleting {{scope}} access key for {{login}} on {{hostname}}...', {
        login,
        scope,
        hostname,
      }),
    );

    await deleteBmUserAccessKey(this.instance, login, scope);

    const result = {success: true, login, scope, hostname};

    if (this.jsonEnabled()) {
      return result;
    }

    this.log(
      t('commands.bm.accessKey.delete.success', 'Access key for {{login}} ({{scope}}) deleted.', {login, scope}),
    );

    return result;
  }
}
