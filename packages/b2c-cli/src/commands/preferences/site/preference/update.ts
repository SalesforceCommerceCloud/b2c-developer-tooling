/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import {Args, Flags, ux} from '@oclif/core';
import {
  PreferencesCommand,
  buildAssignmentMap,
  instanceTypeFlag,
  maskPasswordsFlag,
} from '../../../../utils/preferences.js';
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
      'Update a single preference value across sites in a site preference group. Use repeatable --site-value SITE=val (operators: =, :=, =@file, :=@file, =) or --file/--body for bulk edits.',
    ),
    '/cli/preferences.html#update-site-preference',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> CustomGroupId WapiStringAttr --site-value RefArch=hello --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId c_count --site-value RefArch:=5 --site-value RefArchGlobal:=42 --tenant-id zzxy_prd',
    '<%= config.bin %> <%= command.id %> CustomGroupId WapiStringAttr -I staging --file pref.json --tenant-id zzxy_prd',
  ];

  static flags = {
    'instance-type': instanceTypeFlag,
    'site-value': Flags.string({
      description: 'Per-site assignment SITE=val (repeatable). Operators: =, :=, =@file, :=@file, = (null).',
      multiple: true,
    }),
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
    const {
      'instance-type': instanceType,
      'site-value': siteValueExprs,
      file,
      body,
      'mask-passwords': maskPasswords,
    } = this.flags;
    const organizationId = this.getOrganizationId();

    const haveSiteValues = Array.isArray(siteValueExprs) && siteValueExprs.length > 0;

    if (haveSiteValues && (file || body)) {
      this.error(
        t(
          'commands.preferences.siteValueAndBodyExclusive',
          'Provide either --site-value flags or --file/--body, not both.',
        ),
      );
    }

    if (!haveSiteValues && !file && !body) {
      this.error(
        t(
          'commands.preferences.bodyRequired',
          'Provide --site-value flags or --file/--body with the preferences to update.',
        ),
      );
    }

    let requestBody: PreferenceValue;
    if (haveSiteValues) {
      try {
        requestBody = {
          id: preferenceId,
          siteValues: buildAssignmentMap(siteValueExprs!),
        } as PreferenceValue;
      } catch (error) {
        this.error((error as Error).message);
      }
    } else {
      let raw: string;
      if (file) {
        if (!fs.existsSync(file)) {
          this.error(t('commands.preferences.fileNotFound', 'File not found: {{file}}', {file}));
        }
        raw = fs.readFileSync(file, 'utf8');
      } else {
        raw = body!;
      }
      try {
        requestBody = JSON.parse(raw) as PreferenceValue;
      } catch {
        this.error(t('commands.preferences.parseError', 'Failed to parse JSON body'));
      }
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
