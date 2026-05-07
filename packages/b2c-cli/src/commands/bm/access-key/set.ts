/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {setBmUserAccessKeyEnabled, type BmAccessKeyDetails} from '@salesforce/b2c-tooling-sdk/operations/bm-users';
import {BmUserAuthCommand} from '../../../utils/bm/user-auth-command.js';
import {resolveLoginOrWhoami} from '../../../utils/bm/resolve-login.js';
import {t} from '../../../i18n/index.js';

const ACCESS_KEY_SCOPES = ['WEBDAV_AND_STUDIO', 'AGENT_USER_AND_OCAPI', 'STOREFRONT'] as const;

export default class BmAccessKeySet extends BmUserAuthCommand<typeof BmAccessKeySet> {
  static args = {
    login: Args.string({
      description: 'User login (email). Defaults to the currently authenticated user.',
      required: false,
    }),
  };

  static description = t(
    'commands.bm.accessKey.set.description',
    'Enable or disable an existing access key for an externally-managed Business Manager user. Defaults to the current user.',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> --enabled',
    '<%= config.bin %> <%= command.id %> --no-enabled',
    '<%= config.bin %> <%= command.id %> user@example.com --scope STOREFRONT --enabled',
  ];

  static flags = {
    scope: Flags.string({
      description: 'Access key scope',
      options: [...ACCESS_KEY_SCOPES],
      default: 'WEBDAV_AND_STUDIO',
    }),
    enabled: Flags.boolean({
      description: 'Whether the access key should be enabled (use --no-enabled to disable)',
      allowNo: true,
      required: true,
    }),
  };

  async run(): Promise<BmAccessKeyDetails> {
    this.requireOAuthCredentials();

    const {scope, enabled} = this.flags;
    const hostname = this.resolvedConfig.values.hostname!;
    const login = await resolveLoginOrWhoami(this.instance, this.args.login);

    this.log(
      t('commands.bm.accessKey.set.updating', '{{verb}} {{scope}} access key for {{login}} on {{hostname}}...', {
        verb: enabled ? 'Enabling' : 'Disabling',
        login,
        scope,
        hostname,
      }),
    );

    const details = await setBmUserAccessKeyEnabled(this.instance, login, scope, enabled);

    if (this.jsonEnabled()) {
      return details;
    }

    this.log(
      t('commands.bm.accessKey.set.success', 'Access key for {{login}} ({{scope}}) is now {{state}}.', {
        login,
        scope,
        state: details.enabled ? 'enabled' : 'disabled',
      }),
    );

    return details;
  }
}
