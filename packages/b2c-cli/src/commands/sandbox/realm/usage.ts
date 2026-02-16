/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../../i18n/index.js';

type RealmUsageModel = OdsComponents['schemas']['RealmUsageModel'];

/**
 * Show realm-level usage information.
 */
export default class SandboxRealmUsage extends OdsCommand<typeof SandboxRealmUsage> {
  static aliases = ['ods:realm:usage', 'realm:usage'];

  static args = {
    realm: Args.string({
      description: 'Realm ID (four-letter ID)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.realm.usage.description', 'Show usage information for a realm'),
    '/cli/realm.html#b2c-realm-usage',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz',
    '<%= config.bin %> <%= command.id %> zzzz --from 2026-02-08 --to 2026-02-11',
    '<%= config.bin %> <%= command.id %> zzzz --granularity daily',
    '<%= config.bin %> <%= command.id %> zzzz --detailed-report --json',
  ];

  static flags = {
    from: Flags.string({
      description:
        'Earliest date to include in usage (ISO 8601, defaults to 30 days in the past if omitted by the API)',
    }),
    to: Flags.string({
      description: 'Latest date to include in usage (ISO 8601, defaults to today if omitted by the API)',
    }),
    granularity: Flags.string({
      description: 'Granularity of usage data (daily, weekly, monthly)',
    }),
    'detailed-report': Flags.boolean({
      description: 'Include detailed usage information in the response',
      default: false,
    }),
  } as const;

  async run(): Promise<OdsComponents['schemas']['RealmUsageResponse'] | RealmUsageModel | undefined> {
    const {args, flags} = await this.parse(SandboxRealmUsage);
    const realm = args.realm;
    const host = this.odsHost;

    this.log(
      t('commands.realm.usage.fetching', 'Fetching realm usage for {{realm}} from {{host}}...', {
        realm,
        host,
      }),
    );

    const result = await this.odsClient.GET('/realms/{realm}/usage', {
      params: {
        path: {realm},
        query: {
          from: flags.from,
          to: flags.to,
          detailedReport: flags['detailed-report'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          granularity: flags.granularity as any,
        },
      },
    });

    if (result.error) {
      this.error(
        t('commands.realm.usage.error', 'Failed to fetch realm usage: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as OdsComponents['schemas']['RealmUsageResponse'] | undefined)?.data;

    if (!data) {
      this.log(t('commands.realm.usage.noData', 'No usage data was returned for this realm.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as OdsComponents['schemas']['RealmUsageResponse'];
    }

    this.printRealmUsageSummary(data);
    return data;
  }

  private printRealmUsageSummary(usage: RealmUsageModel): void {
    console.log('Realm Usage Summary');

    console.log('───────────────────');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyUsage = usage as any;

    const metrics: Array<[string, number | undefined]> = [
      ['Active sandboxes', anyUsage.activeSandboxes],
      ['Created sandboxes', anyUsage.createdSandboxes],
      ['Deleted sandboxes', anyUsage.deletedSandboxes],
      ['Minutes up', anyUsage.minutesUp],
      ['Minutes down', anyUsage.minutesDown],
      ['Sandbox seconds', anyUsage.sandboxSeconds],
    ];

    let hasSummaryMetric = false;

    for (const [label, value] of metrics) {
      if (value !== undefined) {
        hasSummaryMetric = true;

        console.log(`${label}: ${value}`);
      }
    }

    if (anyUsage.minutesUpByProfile && anyUsage.minutesUpByProfile.length > 0) {
      console.log();

      console.log('Minutes up by profile:');
      for (const item of anyUsage.minutesUpByProfile) {
        if (item.profile && item.minutes !== undefined) {
          console.log(`  ${item.profile}: ${item.minutes} minutes`);
        }
      }
    }

    const hasDetailedData =
      (anyUsage.granularUsage && anyUsage.granularUsage.length > 0) ||
      (anyUsage.sandboxDetails && anyUsage.sandboxDetails.length > 0);

    if (
      !hasSummaryMetric &&
      !hasDetailedData &&
      !(anyUsage.minutesUpByProfile && anyUsage.minutesUpByProfile.length > 0)
    ) {
      console.log(
        t('commands.realm.usage.emptyPeriod', 'No usage data was returned for this realm in the requested period.'),
      );
    } else if (hasDetailedData) {
      console.log();

      console.log(
        t(
          'commands.realm.usage.detailedHint',
          'Detailed usage data is available; re-run with --json to see full details.',
        ),
      );
    }
  }
}
