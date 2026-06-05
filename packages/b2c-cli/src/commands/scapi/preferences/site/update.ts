/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {PreferencesCommand} from '../../../../utils/scapi/preferences.js';
import {getApiErrorMessage, type SitePreferences, type PreferenceInstanceType} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../../i18n/index.js';

const INSTANCE_TYPES: PreferenceInstanceType[] = ['staging', 'development', 'sandbox', 'production'];

export default class PreferencesSiteUpdate extends PreferencesCommand<typeof PreferencesSiteUpdate> {
  static args = {
    'group-id': Args.string({
      description: 'Preference group ID',
      required: true,
    }),
    'instance-type': Args.string({
      description: 'Instance type to update preferences for. Use "current" to use the instance handling the request.',
      required: true,
    }),
  };

  static description = withDocs(
    t(
      'commands.preferences.site.update.description',
      'Update custom preferences in a site preference group for a given instance type',
    ),
    '/cli/preferences.html#update-site',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId staging --site-id RefArch --file prefs.json --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId staging --site-id RefArch --body \'{"c_attr":"value"}\' --tenant-id zzxy_prd',
  ];

  static flags = {
    'site-id': Flags.string({
      char: 's',
      description: 'Site ID',
      required: true,
    }),
    file: Flags.string({
      char: 'f',
      description: 'JSON file with preferences body. Custom attributes use the "c_" prefix.',
      exclusive: ['body'],
    }),
    body: Flags.string({
      description: 'Inline JSON body with preferences. Custom attributes use the "c_" prefix.',
      exclusive: ['file'],
    }),
    'mask-passwords': Flags.boolean({
      description: 'Mask values of type password in the response',
      default: false,
      allowNo: true,
    }),
  };

  async run(): Promise<SitePreferences> {
    this.requireOAuthCredentials();

    const {'group-id': groupId, 'instance-type': instanceTypeArg} = this.args;
    const {'site-id': siteId, file, body, 'mask-passwords': maskPasswords} = this.flags;
    const organizationId = this.getOrganizationId();

    if (!file && !body) {
      this.error(t('commands.preferences.bodyRequired', 'Provide --file or --body with the preferences to update.'));
    }

    if (instanceTypeArg !== 'current' && !INSTANCE_TYPES.includes(instanceTypeArg as PreferenceInstanceType)) {
      this.error(
        t(
          'commands.preferences.invalidInstanceType',
          'Invalid instance type "{{value}}". Use one of: {{values}} or "current".',
          {value: instanceTypeArg, values: INSTANCE_TYPES.join(', ')},
        ),
      );
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

    let requestBody: SitePreferences;
    try {
      requestBody = JSON.parse(raw) as SitePreferences;
    } catch {
      this.error(t('commands.preferences.parseError', 'Failed to parse JSON body'));
    }

    const result = await this.preferencesRwClient.PATCH(
      '/organizations/{organizationId}/site-preference-groups/{groupId}/{instanceType}',
      {
        params: {
          path: {organizationId, groupId, instanceType: instanceTypeArg as PreferenceInstanceType},
          query: {siteId, maskPasswords},
        },
        body: requestBody,
      },
    );

    if (!result.data) {
      const message = getApiErrorMessage(result.error, result.response);
      this.error(
        t('commands.preferences.site.update.error', 'Failed to update site preference group: {{message}}', {message}),
      );
    }

    if (this.jsonEnabled()) return result.data;

    ux.stdout(JSON.stringify(result.data, null, 2) + '\n');
    return result.data;
  }
}
