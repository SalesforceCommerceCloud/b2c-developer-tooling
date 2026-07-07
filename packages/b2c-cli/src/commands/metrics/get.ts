/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Args, Flags} from '@oclif/core';
import {TableRenderer, columnFlagsFor, selectColumns, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getMetricsByCategory,
  resolveMetricsWindow,
  METRIC_CATEGORIES,
  type MetricCategory,
  type MetricsDataResponse,
  type MetricDataPoint,
} from '@salesforce/b2c-tooling-sdk';
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

/**
 * The effective query parameters echoed back to the caller (JSON mode) so the
 * resolved time bounds and filters actually sent to the API are always visible.
 * Both `from` and `to` are always present: the resolver derives whichever bound
 * was left open from the 24-hour default window.
 */
interface MetricsQueryEcho {
  category: MetricCategory;
  /** Resolved start bound (ISO 8601). */
  from: string;
  /** Resolved end bound (ISO 8601). */
  to: string;
  /** Resolved start bound (epoch seconds — the API wire unit). */
  fromEpochSeconds: number;
  /** Resolved end bound (epoch seconds — the API wire unit). */
  toEpochSeconds: number;
  /** True when a bound was derived from the 24-hour default window. */
  defaultedWindow?: boolean;
  /** True when `from` was clamped forward to stay within the 30-day retention window. */
  clampedFrom?: boolean;
  thirdPartyServiceId?: string;
  apiFamily?: string;
  apiName?: string;
  ocapiCategory?: string;
  ocapiApi?: string;
}

/**
 * Command output: the metrics response plus the effective query parameters.
 */
interface MetricsGetOutput extends MetricsDataResponse {
  query: MetricsQueryEcho;
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
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd --window 1h',
    '<%= config.bin %> <%= command.id %> scapi --tenant-id f_ecom_zzxy_prd --from 7d --window 1h',
    '<%= config.bin %> <%= command.id %> scapi --tenant-id f_ecom_zzxy_prd --api-family product',
    '<%= config.bin %> <%= command.id %> third-party --tenant-id f_ecom_zzxy_prd --third-party-service-id my-service',
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd --from "2026-01-25T10:00:00" --to "2026-01-25T11:00:00"',
    '<%= config.bin %> <%= command.id %> overall --tenant-id f_ecom_zzxy_prd --json',
  ];

  static flags = {
    ...MetricsCommand.baseFlags,
    from: Flags.string({
      description: t(
        'flags.metrics.from.description',
        'Start of the time window: relative (e.g. "1h", "7d" ago) or ISO 8601 (e.g. "2026-01-25T10:00:00")',
        {},
      ),
    }),
    to: Flags.string({
      description: t(
        'flags.metrics.to.description',
        'End of the time window: relative (e.g. "6h" ago) or ISO 8601. Defaults to 24h after --from (capped at now)',
        {},
      ),
    }),
    window: Flags.string({
      aliases: ['for'],
      description: t(
        'flags.metrics.window.description',
        'Window duration (e.g. "1h", "30m", "2d"). With --from: window forward from it; with --to: window back from it; alone: the last <window>. Defaults to 24h',
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

  async run(): Promise<MetricsGetOutput> {
    this.requireOAuthCredentials();

    const {category} = this.args;
    const {
      from: fromFlag,
      to: toFlag,
      window: windowFlag,
      'third-party-service-id': thirdPartyServiceId,
      'api-family': apiFamily,
      'api-name': apiName,
      'ocapi-category': ocapiCategory,
      'ocapi-api': ocapiApi,
    } = this.flags;

    // Resolve the requested bounds. --from/--to/--window each accept relative
    // durations ("1h", "7d" ago) or ISO 8601. The resolver always produces an
    // explicit from+to pair, filling any bound left open from the 24-hour default
    // window — the Metrics API pairs a missing `to` with its own `now` and caps
    // the window at 24h, so an open-ended `from` older than 24h would 400.
    let window;
    try {
      window = resolveMetricsWindow({from: fromFlag, to: toFlag, window: windowFlag});
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    if (window.clampedFrom) {
      this.warn(
        t(
          'commands.metrics.get.clampedFrom',
          'Requested start was at the edge of the 30-day retention window; adjusted to {{from}} to stay within range.',
          {from: window.fromIso},
        ),
      );
    }

    const query: MetricsQueryEcho = {
      category: category as MetricCategory,
      from: window.fromIso,
      to: window.toIso,
      fromEpochSeconds: window.fromEpochSeconds,
      toEpochSeconds: window.toEpochSeconds,
      defaultedWindow: window.defaultedWindow || undefined,
      clampedFrom: window.clampedFrom || undefined,
      thirdPartyServiceId,
      apiFamily,
      apiName,
      ocapiCategory,
      ocapiApi,
    };

    if (!this.jsonEnabled()) {
      const rangeLabel = window.defaultedWindow
        ? `${window.fromIso} → ${window.toIso}, default 24h window`
        : `${window.fromIso} → ${window.toIso}`;
      this.log(
        t('commands.metrics.get.fetching', 'Fetching {{category}} metrics ({{range}})...', {
          category,
          range: rangeLabel,
        }),
      );
    }

    const client = this.getMetricsClient();
    const tenantId = this.requireTenantId();

    let response: MetricsDataResponse;
    try {
      response = await getMetricsByCategory(client, tenantId, category as MetricCategory, {
        from: window.from,
        to: window.to,
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

    const output: MetricsGetOutput = {...response, query};

    if (this.jsonEnabled()) {
      return output;
    }

    if (!response.data || response.data.length === 0) {
      this.log(
        t('commands.metrics.get.noMetrics', 'No metrics data available for category {{category}}.', {
          category,
        }),
      );
      return output;
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

    return output;
  }
}
