/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {
  TableRenderer,
  columnFlagsFor,
  selectColumns,
  type ColumnDef,
  type ColumnFlags,
} from '@salesforce/b2c-tooling-sdk/cli';
import {
  getMetricsByCategory,
  resolveMetricsWindow,
  enrichMetricsTags,
  type MetricCategory,
  type MetricsDataResponse,
  type MetricDataPoint,
} from '@salesforce/b2c-tooling-sdk';
import {MetricsCommand} from './index.js';
import {t} from '../../i18n/index.js';

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
  /** Compact `key=value` rendering of the series tags. */
  tags: string;
}

/**
 * The effective query parameters echoed back to the caller (JSON mode) so the
 * resolved time bounds and filters actually sent to the API are always visible.
 * Both `from` and `to` are always present: the resolver derives whichever bound
 * was left open from the 24-hour default window. Filter fields appear only when
 * the command defines and receives them.
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
export interface MetricsGetOutput extends MetricsDataResponse {
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
  tags: {
    header: 'Tags',
    get: (r) => r.tags || '-',
    extended: true,
  },
};

const DEFAULT_COLUMNS = ['metric', 'series', 'latestValue', 'latestTimestamp'];

const tableRenderer = new TableRenderer(COLUMNS);

/**
 * The time-window and output flags shared by every `b2c metrics <category>`
 * command.
 */
const timeWindowFlags = {
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
  tags: Flags.boolean({
    allowNo: true,
    default: true,
    description: t(
      'flags.metrics.tags.description',
      'Add a structured "tags" object (realm, environment, applied filters, and per-series dimensions like apiFamily/host/cacheStatus) to each series. On by default; use --no-tags for the raw API shape',
      {},
    ),
  }),
};

/**
 * SCAPI-only filter flags (`b2c metrics scapi`).
 */
export const scapiFilterFlags = {
  'api-family': Flags.string({
    description: t('flags.metrics.apiFamily.description', 'Filter SCAPI metrics by API family', {}),
  }),
  'api-name': Flags.string({
    description: t('flags.metrics.apiName.description', 'Filter SCAPI metrics by API name', {}),
  }),
};

/**
 * OCAPI-only filter flags (`b2c metrics ocapi`).
 */
export const ocapiFilterFlags = {
  'ocapi-category': Flags.string({
    description: t('flags.metrics.ocapiCategory.description', 'Filter OCAPI metrics by category', {}),
  }),
  'ocapi-api': Flags.string({
    description: t('flags.metrics.ocapiApi.description', 'Filter OCAPI metrics by API', {}),
  }),
};

/**
 * Third-party-only filter flag (`b2c metrics third-party`).
 */
export const thirdPartyFilterFlags = {
  'third-party-service-id': Flags.string({
    description: t('flags.metrics.thirdPartyServiceId.description', 'Filter third-party metrics by service ID', {}),
  }),
};

/**
 * Base command for a single metric category (`b2c metrics <category>`).
 *
 * Each category is a first-class command — mirroring `b2c cip report <name>` —
 * so its `--help` shows only the flags that actually apply to it. The base holds
 * the shared time-window/output flags and the entire run() body (resolve window
 * → fetch → enrich tags → render); a subclass only declares its `category` and
 * spreads in any category-specific filter flags. Because filter flags live on the
 * subclasses, passing e.g. `--api-family` to `b2c metrics overall` is a
 * "Nonexistent flag" error rather than a silently-ignored no-op.
 */
export abstract class MetricsCategoryCommand<T extends typeof Command> extends MetricsCommand<T> {
  static enableJsonFlag = true;

  /**
   * The time-window, tag, and column flags shared by every category command.
   * Subclasses spread this in and add their own filter flags.
   */
  static timeWindowFlags = {
    ...timeWindowFlags,
    ...columnFlagsFor(COLUMNS),
  };

  /** The metric category this command fetches. */
  protected abstract readonly category: MetricCategory;

  async run(): Promise<MetricsGetOutput> {
    this.requireOAuthCredentials();

    const {category} = this;
    // Filter flags are declared per-subclass, so only the relevant ones exist
    // here; reading a flag a category does not define yields undefined.
    const flags = this.flags as Record<string, unknown>;
    const fromFlag = flags.from as string | undefined;
    const toFlag = flags.to as string | undefined;
    const windowFlag = flags.window as string | undefined;
    const tagsFlag = flags.tags as boolean;
    const thirdPartyServiceId = flags['third-party-service-id'] as string | undefined;
    const apiFamily = flags['api-family'] as string | undefined;
    const apiName = flags['api-name'] as string | undefined;
    const ocapiCategory = flags['ocapi-category'] as string | undefined;
    const ocapiApi = flags['ocapi-api'] as string | undefined;

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
      category,
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
      response = await getMetricsByCategory(client, tenantId, category, {
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

    // Attach a structured `tags` object to each series (on by default; --no-tags
    // opts out to the raw API shape). Additive: id/name/data are preserved, so
    // consumers that ignore tags are unaffected. Applied filters are folded into
    // the context so drilled-down series are tagged authoritatively.
    if (tagsFlag) {
      response = enrichMetricsTags(response, category, {
        tenantId,
        apiFamily,
        apiName,
        ocapiCategory,
        ocapiApi,
        thirdPartyServiceId,
      });
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
        // series.tags is present only when --tags enriched the response.
        const seriesTags = (series as {tags?: Record<string, string>}).tags;
        rows.push({
          metric: metric.title,
          series: series.name,
          unit: metric.unit || '',
          latestValue: latestPoint ? String(latestPoint.value) : '-',
          points: series.data.length,
          latestTimestamp: latestPoint ? new Date(latestPoint.timestamp).toISOString() : '-',
          tags: seriesTags
            ? Object.entries(seriesTags)
                .map(([k, v]) => `${k}=${v}`)
                .join(' ')
            : '',
        });
      }
    }

    this.log(
      t('commands.metrics.get.count', 'Found {{count}} metric series:', {
        count: rows.length,
      }),
    );
    this.log('');

    // Tags are on by default in JSON/machine output, but kept out of the default
    // human table to avoid clutter; the Tags column is extended-only (shown with
    // -x, or selected explicitly via -c tags).
    tableRenderer.render(
      rows,
      selectColumns(this.flags as ColumnFlags, tableRenderer, DEFAULT_COLUMNS, this.warn.bind(this)),
    );

    return output;
  }
}
