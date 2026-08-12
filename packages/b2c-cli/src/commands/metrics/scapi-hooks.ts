/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MetricsCategoryCommand} from '../../utils/metrics/category-command.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * `b2c metrics scapi-hooks` — SCAPI hook execution metrics.
 */
export default class MetricsScapiHooks extends MetricsCategoryCommand<typeof MetricsScapiHooks> {
  static description = withDocs(
    t(
      'commands.metrics.scapiHooks.description',
      '[CLOSED BETA] Get SCAPI hook execution metrics. The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-scapi-hooks',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --window 1h',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --json',
  ];

  static flags = {
    ...MetricsCategoryCommand.baseFlags,
    ...MetricsCategoryCommand.timeWindowFlags,
  };

  protected readonly category = 'scapi-hooks' as const;
}
