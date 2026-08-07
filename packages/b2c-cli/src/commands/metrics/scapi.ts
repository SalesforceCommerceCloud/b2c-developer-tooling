/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MetricsCategoryCommand, scapiFilterFlags} from '../../utils/metrics/category-command.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * `b2c metrics scapi` — SCAPI request metrics (volume, latency, errors, cache),
 * optionally drilled down by `--api-family`/`--api-name`.
 */
export default class MetricsScapi extends MetricsCategoryCommand<typeof MetricsScapi> {
  static description = withDocs(
    t(
      'commands.metrics.scapi.description',
      '[CLOSED BETA] Get SCAPI request metrics (volume, latency, errors, cache). The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-scapi',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --from 7d --window 1h',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --api-family products',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --api-family shopper --api-name shopper-products',
  ];

  static flags = {
    ...MetricsCategoryCommand.baseFlags,
    ...MetricsCategoryCommand.timeWindowFlags,
    ...scapiFilterFlags,
  };

  protected readonly category = 'scapi' as const;
}
