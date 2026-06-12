/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, ux} from '@oclif/core';
import {PreferencesCommand, instanceTypeFlag, maskPasswordsFlag} from '../../../../utils/preferences.js';
import {getApiErrorMessage, type PreferenceInstanceType, type PreferenceValue} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../../i18n/index.js';

export default class PreferencesSitePreferenceGet extends PreferencesCommand<typeof PreferencesSitePreferenceGet> {
  static args = {
    'group-id': Args.string({
      description: 'Preference group ID',
      required: true,
    }),
    'preference-id': Args.string({
      description: 'Preference attribute ID',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.preferences.site.preference.get.description',
      'Read a single preference value across sites in a site preference group',
    ),
    '/cli/preferences.html#get-site-preference',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId WapiStringAttr --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId WapiStringAttr --instance-type staging --tenant-id zzxy_prd',
  ];

  static flags = {
    'instance-type': instanceTypeFlag,
    'mask-passwords': maskPasswordsFlag,
  };

  async run(): Promise<PreferenceValue> {
    this.requireOAuthCredentials();

    const {'group-id': groupId, 'preference-id': preferenceId} = this.args;
    const {'instance-type': instanceType, 'mask-passwords': maskPasswords} = this.flags;
    const organizationId = this.getOrganizationId();

    const result = await this.preferencesClient.GET(
      '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceType as PreferenceInstanceType, preferenceId},
          query: {maskPasswords},
        },
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.site.preference.get.error', 'Failed to read site preference: {{message}}', {message}),
      );
    }

    if (this.jsonEnabled()) return result.data;

    ux.stdout(JSON.stringify(result.data, null, 2) + '\n');
    return result.data;
  }
}
