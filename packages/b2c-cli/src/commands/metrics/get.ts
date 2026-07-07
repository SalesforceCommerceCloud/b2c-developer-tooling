/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getMetricsByCategory,
  METRIC_CATEGORIES,
  type MetricCategory,
  type MetricsDataResponse,
  type MetricDataPoint,
} from '@salesforce/b2c-tooling-sdk';
import {parseSinceTime} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {MetricsCommand} from '../../utils/metrics/index.js';
import {t, withDocs} from '../../i18n/index.js';

/**
 * Flattened metric data for table display.
 */
interface MetricRow {
  metric: string;
  series: string;
  unit: string;
  latestValue: string;
  points: number;
  latestTimestamp: string;
}

const COLUMNS: Record<string, ColumnDef<MetricRow>> = {
  metric: {
    header: 'Metric',
    get: (r) => r.metric,
  },
  series: {
    header: 'Series',
    get: (r) => r.series,
  },
  unit: {
    header: 'Unit',
    get: (r) => r.unit || '-',
    extended: true,
  },
  latestValue: {
    header: 'Latest Value',
    get: (r) => r.latestValue,
  },
  points: {
    header: 'Points',
    get: (r) => String(r.points),
    extended: true,
  },
  latestTimestamp: {
    header: 'Latest Timestamp',
    get: (r) => r.latestTimestamp,
  },
};

const DEFAULT_COLUMNS = ['metric', 'series', 'latestValue', 'latestTimestamp'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * Command to get metrics for a specific category.
 *
 * ⚠️ **CLOSED BETA:** The Metrics API is a closed beta feature. It must be enabled for your
 * organization, and its behavior, output, and OAuth scopes may change without notice.
 */
export default class MetricsGet extends MetricsCommand<typeof MetricsGet> {
  static args = {
    category: Args.string({
      description: 'Metrics category to retrieve',
      required: true,
      options: [...METRIC_CATEGORIES],
    }),
  };

  static description = withDocs(
    t(
      'commands.metrics.get.description',
      '[CLOSED BETA] Get metrics for a specific category. The Metrics API must be enabled for your organization.',
      {},
    ),
    '/cli/metrics.html#b2c-metrics-get',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd',
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd --since 1h',
    '<%= config.bin %> <%= command.id %> sales --tenant-id f_ecom_zzxy_prd --since 7d',
    '<%= config.bin %> <%= command.id %> scapi --tenant-id f_ecom_zzxy_prd --api-family product',
    '<%= config.bin %> <%= command.id %> third-party --tenant-id f_ecom_zzxy_prd --third-party-service-id my-service',
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd --since "2026-01-25T10:00:00" --until "2026-01-25T12:00:00"',
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd --json',
  ];

  static flags = {
    ...MetricsCommand.baseFlags,
    since: Flags.string({
      description: t(
        'flags.metrics.since.description',
        'Start of the time window: relative (e.g. "5m", "1h", "2d") or ISO 8601 (e.g. "2026-01-25T10:00:00")',
        {},
      ),
    }),
    until: Flags.string({
      description: t(
        'flags.metrics.until.description',
        'End of the time window: relative (e.g. "5m", "1h", "2d") or ISO 8601. Defaults to now',
        {},
      ),
    }),
    'third-party-service-id': Flags.string({
      description: t('flags.metrics.thirdPartyServiceId.description', 'Filter third-party metrics by service ID', {}),
    }),
    'api-family': Flags.string({
      description: t('flags.metrics.apiFamily.description', 'Filter SCAPI metrics by API family', {}),
    }),
    'api-name': Flags.string({
      description: t('flags.metrics.apiName.description', 'Filter SCAPI metrics by API name', {}),
    }),
    'ocapi-category': Flags.string({
      description: t('flags.metrics.ocapiCategory.description', 'Filter OCAPI metrics by category', {}),
    }),
    'ocapi-api': Flags.string({
      description: t('flags.metrics.ocapiApi.description', 'Filter OCAPI metrics by API', {}),
    }),
    ...columnFlagsFor(COLUMNS),
  };

  async run(): Promise<MetricsDataResponse> {
    this.requireOAuthCredentials();

    const {category} = this.args;
    const {
      since,
      until,
      'third-party-service-id': thirdPartyServiceId,
      'api-family': apiFamily,
      'api-name': apiName,
      'ocapi-category': ocapiCategory,
      'ocapi-api': ocapiApi,
    } = this.flags;

    // Parse the time window. Both accept relative ("1h", "2d") or ISO 8601.
    let from: Date | undefined;
    let to: Date | undefined;
    try {
      if (since) from = parseSinceTime(since);
      if (until) to = parseSinceTime(until);
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    if (from && to && from.getTime() > to.getTime()) {
      this.error(
        t('commands.metrics.get.invalidRange', '--since ({{since}}) must be before --until ({{until}}).', {
          since,
          until,
        }),
      );
    }

    if (!this.jsonEnabled()) {
      this.log(
        t('commands.metrics.get.fetching', 'Fetching {{category}} metrics...', {
          category,
        }),
      );
    }

    const client = this.getMetricsClient();
    const tenantId = this.requireTenantId();

    let response: MetricsDataResponse;
    try {
      response = await getMetricsByCategory(client, tenantId, category as MetricCategory, {
        from,
        to,
        thirdPartyServiceId,
        apiFamily,
        apiName,
        ocapiCategory,
        ocapiApi,
      });
    } catch (error) {
      this.error(
        t('commands.metrics.get.error', 'Failed to fetch {{category}} metrics: {{message}}', {
          category,
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }

    if (this.jsonEnabled()) {
      return response;
    }

    if (!response.data || response.data.length === 0) {
      this.log(
        t('commands.metrics.get.noMetrics', 'No metrics data available for category {{category}}.', {
          category,
        }),
      );
      return response;
    }

    // Flatten metrics data for table display
    const rows: MetricRow[] = [];
    for (const metric of response.data) {
      for (const series of metric.dataSeries) {
        const latestPoint: MetricDataPoint | undefined = series.data.at(-1);
        rows.push({
          metric: metric.title,
          series: series.name,
          unit: metric.unit || '',
          latestValue: latestPoint ? String(latestPoint.value) : '-',
          points: series.data.length,
          latestTimestamp: latestPoint ? new Date(latestPoint.timestamp).toISOString() : '-',
        });
      }
    }

    this.log(
      t('commands.metrics.get.count', 'Found {{count}} metric series:', {
        count: rows.length,
      }),
    );
    this.log('');

    tableRenderer.render(rows, selectColumns(this.flags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)));

    return response;
  }
}
