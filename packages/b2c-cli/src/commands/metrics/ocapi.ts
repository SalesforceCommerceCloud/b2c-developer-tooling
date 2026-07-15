/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {MetricsCategoryCommand, ocapiFilterFlags} from '../../utils/metrics/category-command.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * `b2c metrics ocapi` — OCAPI request metrics, optionally drilled down by
 * `--ocapi-category`/`--ocapi-api`.
 */
export default class MetricsOcapi extends MetricsCategoryCommand<typeof MetricsOcapi> {
  static description = withDocs(
    t(
      'commands.metrics.ocapi.description',
      '[CLOSED BETA] Get OCAPI request metrics. The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-ocapi',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --ocapi-category shop',
    '<%= config.bin %> <%= command.id %> --tenant-id f_ecom_zzxy_prd --ocapi-category shop --ocapi-api baskets',
  ];

  static flags = {
    ...MetricsCategoryCommand.baseFlags,
    ...MetricsCategoryCommand.timeWindowFlags,
    ...ocapiFilterFlags,
  };

  protected readonly category = 'ocapi' as const;
}
