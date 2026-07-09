/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MetricsCategoryCommand, thirdPartyFilterFlags} from '../../utils/metrics/category-command.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * `b2c metrics third-party` — third-party service integration metrics,
 * optionally filtered by `--third-party-service-id`.
 */
export default class MetricsThirdParty extends MetricsCategoryCommand<typeof MetricsThirdParty> {
  static description = withDocs(
    t(
      'commands.metrics.thirdParty.description',
      '[CLOSED BETA] Get third-party service integration metrics. The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-third-party',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --third-party-service-id my-service',
  ];

  static flags = {
    ...MetricsCategoryCommand.baseFlags,
    ...MetricsCategoryCommand.timeWindowFlags,
    ...thirdPartyFilterFlags,
  };

  protected readonly category = 'third-party' as const;
}
