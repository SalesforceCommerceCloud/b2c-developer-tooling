/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MrtCommand, createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {getProfile, type MrtUserProfile as UserProfileType} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {t, withDocs} from '../../../i18n/index.js';

type ProfileEntry = {field: string; value: string};

const COLUMNS: Record<string, ColumnDef<ProfileEntry>> = {
  field: {
    header: 'Field',
    get: (e) => e.field,
  },
  value: {
    header: 'Value',
    get: (e) => e.value,
  },
};

const DEFAULT_COLUMNS = ['field', 'value'];

/**
 * Get the current user's profile information.
 */
export default class MrtUserProfile extends MrtCommand<typeof MrtUserProfile> {
  static description = withDocs(
    t('commands.mrt.user.profile.description', 'Display profile information for the current user'),
    '/cli/mrt.html#b2c-mrt-user-profile',
  );

  static enableJsonFlag = true;

  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];

  static flags = {
    ...MrtCommand.baseFlags,
  };

  async run(): Promise<UserProfileType> {
    this.requireMrtCredentials();

    this.log(t('commands.mrt.user.profile.fetching', 'Fetching user profile...'));

    const profile = await getProfile(
      {
        origin: this.resolvedConfig.values.mrtOrigin,
      },
      this.getMrtAuth(),
    );

    if (!this.jsonEnabled()) {
      const entries: ProfileEntry[] = [
        {field: 'Email', value: profile.email ?? '-'},
        {field: 'First Name', value: profile.first_name ?? '-'},
        {field: 'Last Name', value: profile.last_name ?? '-'},
        {field: 'Staff', value: profile.is_staff ? 'Yes' : 'No'},
        {field: 'Joined', value: profile.date_joined ? new Date(profile.date_joined).toLocaleString() : '-'},
        {field: 'UUID', value: profile.uuid ?? '-'},
      ];
      createTable(COLUMNS).render(entries, DEFAULT_COLUMNS);
    }

    return profile;
  }
}
