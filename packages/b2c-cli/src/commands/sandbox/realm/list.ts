/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

interface RealmItem {
  realmId: string;
}

interface RealmListResponse {
  realms: RealmItem[];
}

/**
 * List realms eligible for sandbox management.
 */
export default class SandboxRealmList extends OdsCommand<typeof SandboxRealmList> {
  static aliases = ['ods:realm:list', 'realm:list'];

  static args = {
    realm: Args.string({
      description: 'Optional realm ID filter (four-letter ID)',
      required: false,
    }),
  };

  static description = withDocs(
    t('commands.realm.list.description', 'List realms eligible for sandbox management'),
    '/cli/realm.html#b2c-realm-list',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> zzzz',
  ];

  async run(): Promise<RealmListResponse> {
    const {args} = await this.parse(SandboxRealmList);
    const host = this.odsHost;

    this.log(t('commands.realm.list.fetching', 'Fetching realms from {{host}}...', {host}));

    let realmIds: string[];

    if (args.realm) {
      realmIds = [args.realm];
    } else {
      // Discover realms from the current user info
      const meResult = await this.odsClient.GET('/me', {});
      if (meResult.error || !meResult.data?.data?.realms) {
        this.error(
          t('commands.realm.list.meError', 'Failed to fetch user realms: {{message}}', {
            message: getApiErrorMessage(meResult.error, meResult.response),
          }),
        );
      }

      realmIds = meResult.data.data.realms ?? [];
    }

    const realms: RealmItem[] = realmIds.map((realmId) => ({realmId}));

    const response: RealmListResponse = {realms};

    if (this.jsonEnabled()) {
      return response;
    }

    if (realms.length === 0) {
      this.log(t('commands.realm.list.none', 'No realms found for sandbox management.'));
      return response;
    }

    // Human-readable output: simple table-like listing

    console.log('Realm');

    console.log('─────');

    for (const realm of realms) {
      console.log(realm.realmId);
    }

    return response;
  }
}
