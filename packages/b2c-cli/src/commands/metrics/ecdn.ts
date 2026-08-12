/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MetricsCategoryCommand} from '../../utils/metrics/category-command.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * `b2c metrics ecdn` — edge CDN performance metrics.
 */
export default class MetricsEcdn extends MetricsCategoryCommand<typeof MetricsEcdn> {
  static description = withDocs(
    t(
      'commands.metrics.ecdn.description',
      '[CLOSED BETA] Get edge CDN performance metrics. The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-ecdn',
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

  protected readonly category = 'ecdn' as const;
}
