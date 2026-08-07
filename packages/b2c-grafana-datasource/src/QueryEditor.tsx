/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useEffect, useState } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { Button, Field, InlineField, InlineFieldRow, MultiSelect, Select } from '@grafana/ui';

import { B2CMetricsDataSource } from './datasource';
import {
  B2CMetricsDataSourceOptions,
  B2CMetricsQuery,
  LabelFilter,
  METRIC_CATEGORIES,
  MetricCategory,
  MetricOption,
  PushDownFilter,
} from './types';

type Props = QueryEditorProps<B2CMetricsDataSource, B2CMetricsQuery, B2CMetricsDataSourceOptions>;

const CATEGORY_OPTIONS: Array<SelectableValue<MetricCategory>> = METRIC_CATEGORIES.map((c) => ({
  label: c,
  value: c,
}));

const OP_OPTIONS: Array<SelectableValue<'=' | '!='>> = [
  { label: '=', value: '=' },
  { label: '!=', value: '!=' },
];

/**
 * Dynamic, tiered query editor for the B2C Metrics datasource.
 *
 * Layout:
 *   Category        — the endpoint (required)
 *   Metric          — multi-select metricIds (blank = all); each carries its unit
 *   Server filters  — push-down filters (validated dropdowns of the API enum; these
 *                     reduce data at the source and trigger drill-down)
 *   Label filters   — post-fetch filters on enriched tags (key/op/value rows)
 *   Group by        — label keys that drive the per-series legend
 *
 * All option lists are discovered from the backend via getResource, so the editor
 * reflects what the tenant actually exposes (Prometheus-style label browsing).
 */
export function QueryEditor(props: Props) {
  const { datasource, query, onChange, onRunQuery } = props;
  const category = query.category;

  const [metricOpts, setMetricOpts] = useState<MetricOption[]>([]);
  const [pushDown, setPushDown] = useState<PushDownFilter[]>([]);
  const [labelKeys, setLabelKeys] = useState<string[]>([]);

  // Resolve the tenant override for discovery calls. getResource does NOT interpolate
  // template variables (unlike query execution), so a raw "$tenant" would be probed
  // literally and fail. Interpolate here; if it stays unresolved (still contains "$"),
  // fall back to the datasource default by sending empty.
  const resolveTenant = (raw?: string): string | undefined => {
    if (!raw) {
      return undefined;
    }
    const resolved = getTemplateSrv().replace(raw);
    return resolved.includes('$') ? undefined : resolved;
  };
  const discoveryTenant = resolveTenant(query.tenantId);

  // Load discovery data whenever the category (or resolved tenant) changes.
  useEffect(() => {
    let active = true;
    if (!category) {
      return;
    }
    const tenant = discoveryTenant;
    Promise.all([
      datasource.getMetricOptions(category, tenant),
      datasource.getPushDownFilters(category),
      datasource.getLabelKeys(category, tenant),
    ])
      .then(([metrics, pd, keys]) => {
        if (!active) {
          return;
        }
        setMetricOpts(metrics);
        setPushDown(pd);
        setLabelKeys(keys);
      })
      .catch((e) => console.error('discovery load failed', e));
    return () => {
      active = false;
    };
  }, [datasource, category, discoveryTenant]);

  const patch = (partial: Partial<B2CMetricsQuery>, run = true) => {
    onChange({ ...query, ...partial });
    if (run) {
      onRunQuery();
    }
  };

  const onCategoryChange = (v: SelectableValue<MetricCategory>) => {
    // Reset all metric/filter selections — they are category-specific.
    onChange({
      ...query,
      category: v.value as MetricCategory,
      metricIds: [],
      apiFamily: undefined,
      apiName: undefined,
      ocapiCategory: undefined,
      ocapiApi: undefined,
      thirdPartyServiceId: undefined,
      labelFilters: [],
      groupBy: [],
    });
    // Discovered label values are category-specific; clear the cache so a filter with
    // the same key in the new category doesn't show stale values from the old one.
    setValueCache({});
    onRunQuery();
  };

  // ---- Server (push-down) filters -----------------------------------------
  const pushDownKeyToField: Record<string, keyof B2CMetricsQuery> = {
    apiFamily: 'apiFamily',
    apiName: 'apiName',
    ocapiCategory: 'ocapiCategory',
    ocapiApi: 'ocapiApi',
    thirdPartyServiceId: 'thirdPartyServiceId',
  };

  const renderPushDownFilter = (f: PushDownFilter) => {
    const field = pushDownKeyToField[f.key];
    const current = (query[field] as string | undefined) || '';
    const enumOptions: Array<SelectableValue<string>> = (f.values ?? []).map((v) => ({ label: v, value: v }));
    return (
      <InlineField key={f.key} label={f.key} labelWidth={18} tooltip="Server-side filter (API enum; reduces data at source)">
        <Select
          width={28}
          isClearable
          allowCustomValue={!f.hasEnum}
          placeholder={f.hasEnum ? 'select…' : 'type a value…'}
          options={enumOptions}
          value={current ? { label: current, value: current } : null}
          onChange={(opt) => patch({ [field]: opt?.value || undefined } as Partial<B2CMetricsQuery>)}
        />
      </InlineField>
    );
  };

  // ---- Label filters (post-fetch) -----------------------------------------
  const labelFilters = query.labelFilters ?? [];
  const labelKeyOptions: Array<SelectableValue<string>> = labelKeys.map((k) => ({ label: k, value: k }));

  const updateLabelFilter = (idx: number, partial: Partial<LabelFilter>) => {
    const next = labelFilters.map((f, i) => (i === idx ? { ...f, ...partial } : f));
    patch({ labelFilters: next }, false);
  };
  const addLabelFilter = () => patch({ labelFilters: [...labelFilters, { key: '', op: '=', value: '' }] }, false);
  const removeLabelFilter = (idx: number) =>
    patch({ labelFilters: labelFilters.filter((_, i) => i !== idx) });

  // Lazy value loader per label-filter row.
  const [valueCache, setValueCache] = useState<Record<string, Array<SelectableValue<string>>>>({});
  const loadValues = (key: string) => {
    if (!key || valueCache[key]) {
      return;
    }
    datasource
      .getLabelValues(category, key, discoveryTenant)
      .then((vals) => setValueCache((c) => ({ ...c, [key]: vals.map((v) => ({ label: v, value: v })) })))
      .catch((e) => console.error('label-values load failed', e));
  };

  // ---- Render --------------------------------------------------------------
  return (
    <div className="gf-form-group">
      <InlineFieldRow>
        <InlineField label="Category" labelWidth={18} tooltip="Metrics API endpoint">
          <Select width={28} options={CATEGORY_OPTIONS} value={category} onChange={onCategoryChange} />
        </InlineField>
        <InlineField label="Metric" labelWidth={12} grow tooltip="Which metrics to return (blank = all). Each has its own unit.">
          <MultiSelect
            placeholder="all metrics"
            options={metricOpts.map((m) => ({ label: `${m.label}${m.unit ? ` (${m.unit})` : ''}`, value: m.value }))}
            value={(query.metricIds ?? []).map((v) => ({ label: v, value: v }))}
            onChange={(opts) => patch({ metricIds: opts.map((o) => o.value as string) })}
          />
        </InlineField>
      </InlineFieldRow>

      {pushDown.length > 0 && (
        <Field
          label="Server filters"
          description="Sent to the Metrics API (validated enum). Reduce data at the source and drill down into finer series."
        >
          <InlineFieldRow>{pushDown.map(renderPushDownFilter)}</InlineFieldRow>
        </Field>
      )}

      <Field label="Label filters" description="Applied after fetch on enriched dimensions (metricId, statusClass, cacheStatus, host, …).">
        <div>
          {labelFilters.map((f, idx) => (
            <InlineFieldRow key={idx}>
              <InlineField label="key" labelWidth={8}>
                <Select
                  width={22}
                  options={labelKeyOptions}
                  allowCustomValue
                  value={f.key ? { label: f.key, value: f.key } : null}
                  onChange={(opt) => {
                    updateLabelFilter(idx, { key: opt?.value || '' });
                    loadValues(opt?.value || '');
                  }}
                />
              </InlineField>
              <InlineField label="op" labelWidth={5}>
                <Select
                  width={10}
                  options={OP_OPTIONS}
                  value={{ label: f.op, value: f.op }}
                  onChange={(opt) => updateLabelFilter(idx, { op: (opt?.value as '=' | '!=') || '=' })}
                />
              </InlineField>
              <InlineField label="value" labelWidth={8}>
                <Select
                  width={24}
                  allowCustomValue
                  placeholder="value"
                  options={valueCache[f.key] ?? []}
                  value={f.value ? { label: f.value, value: f.value } : null}
                  onOpenMenu={() => loadValues(f.key)}
                  onChange={(opt) => updateLabelFilter(idx, { value: opt?.value || '' })}
                />
              </InlineField>
              <InlineField label="" labelWidth={1}>
                <Button variant="secondary" fill="text" icon="trash-alt" onClick={() => removeLabelFilter(idx)} aria-label="remove filter" />
              </InlineField>
            </InlineFieldRow>
          ))}
          <Button variant="secondary" size="sm" icon="plus" onClick={addLabelFilter}>
            Add filter
          </Button>
        </div>
      </Field>

      <Field label="Group by" description="Label keys that build the series legend (e.g. apiFamily, statusClass).">
        <MultiSelect
          placeholder="auto (all dimensions)"
          options={labelKeyOptions}
          value={(query.groupBy ?? []).map((v) => ({ label: v, value: v }))}
          onChange={(opts) => patch({ groupBy: opts.map((o) => o.value as string) })}
        />
      </Field>
    </div>
  );
}
