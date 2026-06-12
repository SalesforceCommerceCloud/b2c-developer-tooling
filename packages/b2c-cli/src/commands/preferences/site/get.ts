/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {PreferencesCommand, instanceTypeFlag, maskPasswordsFlag} from '../../../utils/preferences.js';
import {getApiErrorMessage, type SitePreferences, type PreferenceInstanceType} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

export default class PreferencesSiteGet extends PreferencesCommand<typeof PreferencesSiteGet> {
  static args = {
    'group-id': Args.string({
      description: 'Preference group ID',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.preferences.site.get.description',
      'Read custom preferences in a site preference group for a given instance type',
    ),
    '/cli/preferences.html#get-site',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId --site-id RefArch --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId --instance-type staging --site-id RefArch --tenant-id zzxy_prd',
  ];

  static flags = {
    'instance-type': instanceTypeFlag,
    'site-id': Flags.string({
      char: 's',
      description: 'Site ID',
      required: true,
    }),
    'mask-passwords': maskPasswordsFlag,
  };

  async run(): Promise<SitePreferences> {
    this.requireOAuthCredentials();

    const {'group-id': groupId} = this.args;
    const {'instance-type': instanceType, 'site-id': siteId, 'mask-passwords': maskPasswords} = this.flags;
    const organizationId = this.getOrganizationId();

    const result = await this.preferencesClient.GET(
      '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceType as PreferenceInstanceType},
          query: {siteId, maskPasswords},
        },
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.site.get.error', 'Failed to read site preference group: {{message}}', {message}),
      );
    }

    if (this.jsonEnabled()) return result.data;

    ux.stdout(JSON.stringify(result.data, null, 2) + '\n');
    return result.data;
  }
}
