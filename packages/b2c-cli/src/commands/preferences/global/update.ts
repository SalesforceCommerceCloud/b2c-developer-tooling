/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {PreferencesCommand, instanceTypeFlag, maskPasswordsFlag} from '../../../utils/preferences.js';
import {
  getApiErrorMessage,
  type OrganizationPreferences,
  type PreferenceInstanceType,
} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

export default class PreferencesGlobalUpdate extends PreferencesCommand<typeof PreferencesGlobalUpdate> {
  static args = {
    'group-id': Args.string({
      description: 'Preference group ID',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.preferences.global.update.description',
      'Update custom preferences in a global preference group for a given instance type',
    ),
    '/cli/preferences.html#update-global',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId --file prefs.json --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId --instance-type staging --body \'{"c_attr": "value"}\' --tenant-id zzxy_prd',
  ];

  static flags = {
    'instance-type': instanceTypeFlag,
    file: Flags.string({
      char: 'f',
      description: 'JSON file with preferences body. Custom attributes use the "c_" prefix.',
      exclusive: ['body'],
    }),
    body: Flags.string({
      description: 'Inline JSON body with preferences. Custom attributes use the "c_" prefix.',
      exclusive: ['file'],
    }),
    'mask-passwords': maskPasswordsFlag,
  };

  async run(): Promise<OrganizationPreferences> {
    this.requireOAuthCredentials();

    const {'group-id': groupId} = this.args;
    const {'instance-type': instanceType, file, body, 'mask-passwords': maskPasswords} = this.flags;
    const organizationId = this.getOrganizationId();

    if (!file && !body) {
      this.error(t('commands.preferences.bodyRequired', 'Provide --file or --body with the preferences to update.'));
    }

    let raw: string;
    if (file) {
      if (!fs.existsSync(file)) {
        this.error(t('commands.preferences.fileNotFound', 'File not found: {{file}}', {file}));
      }
      raw = fs.readFileSync(file, 'utf8');
    } else {
      raw = body!;
    }

    let requestBody: OrganizationPreferences;
    try {
      requestBody = JSON.parse(raw) as OrganizationPreferences;
    } catch {
      this.error(t('commands.preferences.parseError', 'Failed to parse JSON body'));
    }

    const result = await this.preferencesRwClient.PATCH(
      '/organizations/{organizationId}/global-preference-groups/{groupId}/{instanceType}',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceType as PreferenceInstanceType},
          query: {maskPasswords},
        },
        body: requestBody,
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.global.update.error', 'Failed to update global preference group: {{message}}', {
          message,
        }),
      );
    }

    if (this.jsonEnabled()) return result.data;

    ux.stdout(JSON.stringify(result.data, null, 2) + '\n');
    return result.data;
  }
}
