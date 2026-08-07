/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import { DataSourceInstanceSettings, MetricFindValue, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import {
  B2CMetricsDataSourceOptions,
  B2CMetricsQuery,
  METRIC_CATEGORIES,
  MetricCategory,
  MetricOption,
  PushDownFilter,
} from './types';

/**
 * B2C Metrics datasource.
 *
 * Extends DataSourceWithBackend so query execution is delegated to the Go backend
 * plugin (which owns OAuth, the Metrics API calls, tag enrichment, and data.Frame
 * construction). The frontend uses `getResource(...)` to drive the dynamic, Prometheus-
 * style query editor (metrics, label keys, label values) and ad-hoc filters.
 */
export class B2CMetricsDataSource extends DataSourceWithBackend<B2CMetricsQuery, B2CMetricsDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<B2CMetricsDataSourceOptions>) {
    super(instanceSettings);
  }

  getDefaultQuery(): Partial<B2CMetricsQuery> {
    return { category: 'overall', metricIds: [], labelFilters: [], groupBy: [] };
  }

  filterQuery(query: B2CMetricsQuery): boolean {
    return Boolean(query.category);
  }

  /** Interpolate template variables (incl. a dashboard $tenant and any filter values). */
  applyTemplateVariables(query: B2CMetricsQuery, scopedVars: ScopedVars): B2CMetricsQuery {
    const t = getTemplateSrv();
    const rep = (v?: string) => (v ? t.replace(v, scopedVars) : v);
    return {
      ...query,
      category: t.replace(query.category, scopedVars) as MetricCategory,
      tenantId: rep(query.tenantId),
      apiFamily: rep(query.apiFamily),
      apiName: rep(query.apiName),
      ocapiCategory: rep(query.ocapiCategory),
      ocapiApi: rep(query.ocapiApi),
      thirdPartyServiceId: rep(query.thirdPartyServiceId),
      metricIds: query.metricIds?.map((m) => t.replace(m, scopedVars)),
      labelFilters: query.labelFilters?.map((f) => ({ ...f, value: t.replace(f.value, scopedVars) })),
    };
  }

  // ---- Discovery helpers (used by the query editor) --------------------------

  /** Metric options (metricId + unit) for a category, probed live by the backend. */
  async getMetricOptions(category: string, tenantId?: string): Promise<MetricOption[]> {
    if (!category) {
      return [];
    }
    return (await this.getResource('metrics', { category, tenantId: tenantId ?? '' })) as MetricOption[];
  }

  /** Server-side (push-down) filter descriptors for a category, with enum values. */
  async getPushDownFilters(category: string): Promise<PushDownFilter[]> {
    if (!category) {
      return [];
    }
    return (await this.getResource('push-down-filters', { category })) as PushDownFilter[];
  }

  /** Derived (post-fetch) label keys for a category — for Label filters + Group by. */
  async getLabelKeys(category: string, tenantId?: string): Promise<string[]> {
    if (!category) {
      return [];
    }
    return (await this.getResource('label-keys', { category, tenantId: tenantId ?? '' })) as string[];
  }

  /** Distinct values for a label key (server enum for push-down keys, else probed). */
  async getLabelValues(category: string, key: string, tenantId?: string): Promise<string[]> {
    if (!category || !key) {
      return [];
    }
    return (await this.getResource('label-values', { category, key, tenantId: tenantId ?? '' })) as string[];
  }

  // ---- Template variables ----------------------------------------------------

  /**
   * Powers dashboard template variables. Supported queries:
   *   categories
   *   metrics(<category>)
   *   labelKeys(<category>)
   *   labelValues(<category>,<key>)
   */
  async metricFindQuery(query: string): Promise<MetricFindValue[]> {
    const q = (query || '').trim();
    if (q === '' || q === 'categories') {
      return METRIC_CATEGORIES.map((c) => ({ text: c, value: c }));
    }
    const m = q.match(/^(\w+)\s*\((.*)\)$/);
    if (!m) {
      return [];
    }
    const fn = m[1];
    const args = m[2].split(',').map((s) => s.trim());
    try {
      if (fn === 'metrics') {
        return (await this.getMetricOptions(args[0])).map((o) => ({ text: o.label, value: o.value }));
      }
      if (fn === 'labelKeys') {
        return (await this.getLabelKeys(args[0])).map((k) => ({ text: k, value: k }));
      }
      if (fn === 'labelValues') {
        return (await this.getLabelValues(args[0], args[1])).map((v) => ({ text: v, value: v }));
      }
    } catch (error) {
      console.error('metricFindQuery error:', error);
    }
    return [];
  }
}
