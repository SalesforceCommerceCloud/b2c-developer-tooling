/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Args, Flags} from '@oclif/core';
import {OdsCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {getApiErrorMessage, type OdsComponents} from '@salesforce/b2c-tooling-sdk';
import {t, withDocs} from '../../i18n/index.js';

type SandboxUsageModel = OdsComponents['schemas']['SandboxUsageModel'];

/**
 * Show sandbox-level usage information.
 */
export default class SandboxUsage extends OdsCommand<typeof SandboxUsage> {
  static aliases = ['ods:usage'];

  static args = {
    sandboxId: Args.string({
      description: 'Sandbox ID (UUID or realm-instance, e.g., zzzz-001)',
      required: true,
    }),
  };

  static description = withDocs(
    t('commands.sandbox.usage.description', 'Show usage information for a specific sandbox'),
    '/cli/sandbox.html#b2c-sandbox-usage',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> zzzz-001',
    '<%= config.bin %> <%= command.id %> zzzz-001 --from 2026-02-08 --to 2026-02-11',
    '<%= config.bin %> <%= command.id %> zzzz-001 --from 2026-02-08 --to 2026-02-11 --json',
  ];

  static flags = {
    from: Flags.string({
      description: 'Start date for usage data (ISO 8601 format, e.g., 2024-01-01)',
    }),
    to: Flags.string({
      description: 'End date for usage data (ISO 8601 format, e.g., 2024-12-31)',
    }),
  } as const;

  async run(): Promise<OdsComponents['schemas']['SandboxUsageResponse'] | SandboxUsageModel | undefined> {
    const {args, flags} = await this.parse(SandboxUsage);
    const rawId = args.sandboxId;
    const host = this.odsHost;

    const sandboxId = await this.resolveSandboxId(rawId);

    this.log(
      t('commands.sandbox.usage.fetching', 'Fetching sandbox usage for {{sandboxId}} from {{host}}...', {
        sandboxId,
        host,
      }),
    );

    const result = await this.odsClient.GET('/sandboxes/{sandboxId}/usage', {
      params: {
        path: {sandboxId},
        query: {
          from: flags.from,
          to: flags.to,
        },
      },
    });

    if (result.error) {
      this.error(
        t('commands.sandbox.usage.error', 'Failed to fetch sandbox usage: {{message}}', {
          message: getApiErrorMessage(result.error, result.response),
        }),
      );
    }

    const data = (result.data as OdsComponents['schemas']['SandboxUsageResponse'] | undefined)?.data;

    if (!data) {
      this.log(t('commands.sandbox.usage.noData', 'No usage data was returned for this sandbox.'));
      return undefined;
    }

    if (this.jsonEnabled()) {
      return result.data as OdsComponents['schemas']['SandboxUsageResponse'];
    }

    this.printSandboxUsageSummary(data);
    return data;
  }

  private printSandboxUsageSummary(usage: SandboxUsageModel): void {
    console.log('Sandbox Usage Summary');

    console.log('─────────────────────');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyUsage = usage as any;

    const metrics: Array<[string, number | undefined]> = [
      ['Sandbox seconds', anyUsage.sandboxSeconds],
      ['Minutes up', anyUsage.minutesUp],
      ['Minutes down', anyUsage.minutesDown],
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
      (anyUsage.history && anyUsage.history.length > 0);

    if (
      !hasSummaryMetric &&
      !hasDetailedData &&
      !(anyUsage.minutesUpByProfile && anyUsage.minutesUpByProfile.length > 0)
    ) {
      console.log(
        t('commands.sandbox.usage.emptyPeriod', 'No usage data was returned for this sandbox in the requested period.'),
      );
    } else if (hasDetailedData) {
      console.log();

      console.log(
        t(
          'commands.sandbox.usage.detailedHint',
          'Detailed usage data is available; re-run with --json to see full details.',
        ),
      );
    }
  }
}
