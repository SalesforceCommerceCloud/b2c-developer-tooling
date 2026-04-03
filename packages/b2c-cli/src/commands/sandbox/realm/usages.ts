/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type MultiRealmUsageModel = OdsComponents['schemas']['MultiRealmUsageModel'];
type MultiRealmUsageResponse = OdsComponents['schemas']['MultiRealmUsageResponse'];

/**
 * Show usage information for multiple realms.
 */
export default class SandboxRealmUsages extends OdsCommand<typeof SandboxRealmUsages> {
  static aliases = ['ods:realm:usages'];

  static description = withDocs(
    t('commands.realm.usages.description', 'Show usage information for multiple realms'),
    '/cli/realm.html#b2c-realm-usages',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --realm zzzz --realm yyyy',
    '<%= config.bin %> <%= command.id %> --realm zzzz,yyyy --from 2026-02-08 --to 2026-02-11',
    '<%= config.bin %> <%= command.id %> --detailed-report --json',
  ];

  static flags = {
    realm: Flags.string({
      description: 'Realm ID(s). Repeat flag or provide comma-separated values',
      multiple: true,
      multipleNonGreedy: true,
      delimiter: ',',
    }),
    from: Flags.string({
      description: 'Earliest date to include in usage (ISO 8601)',
    }),
    to: Flags.string({
      description: 'Latest date to include in usage (ISO 8601)',
    }),
    'detailed-report': Flags.boolean({
      description: 'Include detailed usage information in the response',
      default: false,
    }),
  } as const;

  async run(): Promise<MultiRealmUsageModel[] | MultiRealmUsageResponse | undefined> {
    const {flags} = await this.parse(SandboxRealmUsages);

    const realms = await this.resolveRealms(flags.realm);
    if (realms.length === 0) {
      this.log(t('commands.realm.usages.noRealms', 'No realms found for the current user.'));
      return undefined;
    }

    const result = await this.odsClient.POST('/realms/usages', {
      body: {
        from: flags.from,
        to: flags.to,
        realms,
        detailedReport: flags['detailed-report'],
      },
    });

    if (result.error) {
      this.error(
        t('commands.realm.usages.error', 'Failed to fetch multi-realm usage: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as MultiRealmUsageResponse | undefined)?.data;
    if (!data || data.length === 0) {
      this.log(t('commands.realm.usages.noData', 'No usage data was returned for the requested realms.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as MultiRealmUsageResponse;
    }

    this.printUsage(data);
    return data;
  }

  private printUsage(items: MultiRealmUsageModel[]): void {
    console.log('Realm  Active  Created  Deleted  Minutes Up  Minutes Down  Sandbox Seconds');
    console.log('─────  ──────  ───────  ───────  ──────────  ────────────  ───────────────');

    for (const item of items) {
      const usage = item.realmUsage;
      const row = [
        String(item.realmName ?? '-').padEnd(5),
        String(usage?.activeSandboxes ?? '-').padStart(6),
        String(usage?.createdSandboxes ?? '-').padStart(7),
        String(usage?.deletedSandboxes ?? '-').padStart(7),
        String(usage?.minutesUp ?? '-').padStart(10),
        String(usage?.minutesDown ?? '-').padStart(12),
        String(usage?.sandboxSeconds ?? '-').padStart(15),
      ];

      console.log(row.join('  '));

      if (item.error) {
        console.log(`  ! ${item.error}`);
      }
    }
  }

  private async resolveRealms(inputRealms: string[] | undefined): Promise<string[]> {
    if (inputRealms && inputRealms.length > 0) {
      return inputRealms;
    }

    const meResult = await this.odsClient.GET('/me', {});
    if (meResult.error || !meResult.data?.data?.realms) {
      this.error(
        t('commands.realm.usages.realmsError', 'Failed to resolve realms from current user: {{message}}', {
          message: getApiErrorMessage(meResult.error, meResult.response),
        }),
      );
    }

    return meResult.data.data.realms ?? [];
  }
}
