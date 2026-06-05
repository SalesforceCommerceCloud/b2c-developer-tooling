/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags, ux} from '@oclif/core';
import {PreferencesCommand} from '../../../../utils/scapi/preferences.js';
import {
  getApiErrorMessage,
  type OrganizationPreferences,
  type PreferenceInstanceType,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../../i18n/index.js';

const INSTANCE_TYPES: PreferenceInstanceType[] = ['staging', 'development', 'sandbox', 'production'];

export default class PreferencesGlobalGet extends PreferencesCommand<typeof PreferencesGlobalGet> {
  static args = {
    'group-id': Args.string({
      description: 'Preference group ID',
      required: true,
    }),
    'instance-type': Args.string({
      description: 'Instance type to read preferences for. Use "current" to use the instance handling the request.',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.preferences.global.get.description',
      'Read custom preferences in a global preference group for a given instance type',
    ),
    '/cli/preferences.html#get-global',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId staging --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId current --tenant-id zzxy_prd --expand sites',
  ];

  static flags = {
    'mask-passwords': Flags.boolean({
      description: 'Mask values of type password',
      default: false,
      allowNo: true,
    }),
    expand: Flags.string({
      description: 'Expand option ("sites" returns site-specific values)',
      options: ['sites'],
    }),
  };

  async run(): Promise<OrganizationPreferences> {
    this.requireOAuthCredentials();

    const {'group-id': groupId, 'instance-type': instanceTypeArg} = this.args;
    const {'mask-passwords': maskPasswords, expand} = this.flags;
    const organizationId = this.getOrganizationId();

    if (instanceTypeArg !== 'current' && !INSTANCE_TYPES.includes(instanceTypeArg as PreferenceInstanceType)) {
      this.error(
        t(
          'commands.preferences.invalidInstanceType',
          'Invalid instance type "{{value}}". Use one of: {{values}} or "current".',
          {value: instanceTypeArg, values: INSTANCE_TYPES.join(', ')},
        ),
      );
    }

    const result = await this.preferencesClient.GET(
      '/organizations/{organizationId}/global-preference-groups/{groupId}/{instanceType}',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceTypeArg as PreferenceInstanceType},
          query: {maskPasswords, expand: expand ? [expand as 'sites'] : undefined},
        },
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.global.get.error', 'Failed to read global preference group: {{message}}', {message}),
      );
    }

    if (this.jsonEnabled()) return result.data;

    ux.stdout(JSON.stringify(result.data, null, 2) + '\n');
    return result.data;
  }
}
