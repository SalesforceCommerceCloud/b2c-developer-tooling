/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {PreferencesCommand, instanceTypeFlag, maskPasswordsFlag} from '../../../../utils/preferences.js';
import {getApiErrorMessage, type PreferenceInstanceType, type PreferenceValue} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../../i18n/index.js';

export default class PreferencesSitePreferenceUpdate extends PreferencesCommand<
  typeof PreferencesSitePreferenceUpdate
> {
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
      'commands.preferences.site.preference.update.description',
      'Update a single preference value across sites in a site preference group',
    ),
    '/cli/preferences.html#update-site-preference',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId WapiStringAttr --file pref.json --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId WapiStringAttr --instance-type staging --body \'{"id":"WapiStringAttr","siteValues":{"RefArch":"new"}}\' --tenant-id zzxy_prd',
  ];

  static flags = {
    'instance-type': instanceTypeFlag,
    file: Flags.string({
      char: 'f',
      description: 'JSON file with PreferenceValue body (use siteValues map keyed by site ID)',
      exclusive: ['body'],
    }),
    body: Flags.string({
      description: 'Inline JSON PreferenceValue body (use siteValues map keyed by site ID)',
      exclusive: ['file'],
    }),
    'mask-passwords': maskPasswordsFlag,
  };

  async run(): Promise<PreferenceValue> {
    this.requireOAuthCredentials();

    const {'group-id': groupId, 'preference-id': preferenceId} = this.args;
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

    let requestBody: PreferenceValue;
    try {
      requestBody = JSON.parse(raw) as PreferenceValue;
    } catch {
      this.error(t('commands.preferences.parseError', 'Failed to parse JSON body'));
    }

    const result = await this.preferencesRwClient.PATCH(
      '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}/preferences/{preferenceId}',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceType as PreferenceInstanceType, preferenceId},
          query: {maskPasswords},
        },
        body: requestBody,
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.site.preference.update.error', 'Failed to update site preference: {{message}}', {
          message,
        }),
      );
    }

    if (this.jsonEnabled()) return result.data;

    ux.stdout(JSON.stringify(result.data, null, 2) + '\n');
    return result.data;
  }
}
