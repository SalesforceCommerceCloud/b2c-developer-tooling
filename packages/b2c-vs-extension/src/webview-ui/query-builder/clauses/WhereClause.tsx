/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react';
import {useMemo} from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Icon} from '../../shared/components/Icon.js';
import {SegmentedControl} from '../../shared/components/SegmentedControl.js';
import {isDateLikeType, resolvePreset, toISODate, type DateRangePreset} from '../../shared/dateRange.js';
import type {ColumnInfo, DateQuickPreset, FilterCondition, FilterOperator} from '../../shared/types.js';

const SCALAR_OPERATORS: FilterOperator[] = [
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'LIKE',
  'NOT LIKE',
  'IN',
  'NOT IN',
  'IS NULL',
  'IS NOT NULL',
];

/**
 * Operators that make sense on a date/timestamp column. We deliberately drop
 * the textual ones (`LIKE`/`IN`) and add `BETWEEN` so the most common report
 * pattern — `WHERE submit_date >= 'X' AND submit_date <= 'Y'` — collapses
 * into a single intuitive row.
 */
const DATE_OPERATORS: FilterOperator[] = ['=', '>=', '<=', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];

const DATE_PRESETS: Array<{key: DateRangePreset; label: string}> = [
  {key: 'last-week', label: 'Last 7 days'},
  {key: 'last-month', label: 'Last 30 days'},
  {key: 'last-6-months', label: 'Last 6 months'},
];

interface Props {
  columns: ColumnInfo[];
  filters: FilterCondition[];
  filterLogic: 'AND' | 'OR';
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<FilterCondition>) => void;
  onRemove: (index: number) => void;
  onLogicChange: (logic: 'AND' | 'OR') => void;
}

export function WhereClause({columns, filters, filterLogic, onAdd, onUpdate, onRemove, onLogicChange}: Props) {
  const commitColumn = (index: number, filter: FilterCondition, nextCol: string) => {
    const nextIsDate = isDateLikeType(columnTypeByName.get(nextCol));
    const patch: Partial<FilterCondition> = {column: nextCol};
    if (nextIsDate && !DATE_OPERATORS.includes(filter.operator)) {
      patch.operator = '=';
    }
    patch.datePreset = undefined;
    onUpdate(index, patch);
  };

  // Cache the column → type lookup so the per-row date detection isn't an
  // O(n×m) scan of the columns array on every render.
  const columnTypeByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of columns) map.set(c.name, c.type);
    return map;
  }, [columns]);

  return (
    <ClauseCard
      step={3}
      keyword="WHERE"
      heading="Filter Results"
      description="Add conditions to narrow down your results."
      dataClause="where"
      actions={
        <button className="btn-ghost" onClick={onAdd}>
          <Icon name="plus" />
          <span>Add Filter</span>
        </button>
      }
    >
      {filters.length === 0 ? (
        <span className="placeholder">No filters applied — all rows will be returned.</span>
      ) : (
        <>
          {filters.length > 1 ? (
            <SegmentedControl
              className="logic-segment"
              value={filterLogic}
              onChange={onLogicChange}
              options={[
                {value: 'AND', label: 'AND'},
                {value: 'OR', label: 'OR'},
              ]}
              ariaLabel="Combine conditions"
            />
          ) : null}
          {filters.map((f, idx) => {
            const isDateCol = isDateLikeType(columnTypeByName.get(f.column));
            const operatorList = isDateCol ? DATE_OPERATORS : SCALAR_OPERATORS;
            const needsValue = f.operator !== 'IS NULL' && f.operator !== 'IS NOT NULL';
            const isBetween = f.operator === 'BETWEEN';
            const inputType = isDateCol ? 'date' : 'text';
            const activePreset = isDateCol && needsValue ? detectActiveDatePreset(f) : null;

            return (
              <div className={`filter-row${isDateCol ? ' filter-row--date' : ''}`} key={idx}>
                <div className="filter-row__main">
                  <select
                    className="field-select"
                    aria-label="Filter column"
                    value={f.column}
                    onChange={(e) => commitColumn(idx, f, e.currentTarget.value)}
                  >
                    <option value="">Select column...</option>
                    {columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="field-select"
                    value={f.operator}
                    onChange={(e) => {
                      const nextOp = e.currentTarget.value as FilterOperator;
                      const patch: Partial<FilterCondition> = {operator: nextOp};
                      // Drop the upper bound when leaving BETWEEN so a stale
                      // `valueTo` doesn't linger in state and confuse the SQL.
                      if (nextOp !== 'BETWEEN' && f.valueTo !== undefined) patch.valueTo = undefined;
                      patch.datePreset = undefined;
                      onUpdate(idx, patch);
                    }}
                  >
                    {operatorList.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  {needsValue ? (
                    <input
                      type={inputType}
                      className="field-input"
                      placeholder={isDateCol ? '' : 'Value'}
                      value={f.value || ''}
                      onChange={(e) => onUpdate(idx, {datePreset: undefined, value: e.currentTarget.value})}
                    />
                  ) : (
                    <span />
                  )}
                  {isBetween ? (
                    <input
                      type={inputType}
                      className="field-input"
                      placeholder={isDateCol ? '' : 'Upper bound'}
                      aria-label="Upper bound"
                      value={f.valueTo || ''}
                      onChange={(e) => onUpdate(idx, {datePreset: undefined, valueTo: e.currentTarget.value})}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="remove-btn"
                    title="Remove filter"
                    onClick={() => onRemove(idx)}
                    aria-label="Remove filter"
                  >
                    ✕
                  </button>
                </div>
                {isDateCol && needsValue ? (
                  <div className="filter-row__presets" role="group" aria-label="Date range presets">
                    {DATE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        className={`btn btn-secondary date-preset-btn${activePreset === p.key ? ' active' : ''}`}
                        aria-pressed={activePreset === p.key}
                        onClick={() => applyPreset(idx, p.key, onUpdate)}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`btn btn-secondary date-preset-btn${activePreset === 'today' ? ' active' : ''}`}
                      aria-pressed={activePreset === 'today'}
                      title="Set to today"
                      onClick={() => {
                        const today = toISODate(new Date());
                        onUpdate(idx, {datePreset: 'today', operator: '=', value: today, valueTo: undefined});
                      }}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`btn btn-secondary date-preset-btn${activePreset === 'custom' ? ' active' : ''}`}
                      aria-pressed={activePreset === 'custom'}
                      title="Use a custom date range"
                      onClick={() => applyCustomPreset(idx, f, onUpdate)}
                    >
                      Custom
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      )}
    </ClauseCard>
  );
}

/**
 * Apply a quick preset as a single-field "since X" condition.
 * We normalize to `>=` so quick presets always show one input and only
 * `Custom` owns the explicit two-bound `BETWEEN` UX.
 */
function applyPreset(
  index: number,
  preset: DateRangePreset,
  onUpdate: (index: number, patch: Partial<FilterCondition>) => void,
): void {
  const range = resolvePreset(preset);
  if (!range) return;
  onUpdate(index, {
    datePreset: preset,
    operator: '>=',
    value: range.from,
    valueTo: undefined,
  });
}

function applyCustomPreset(
  index: number,
  filter: FilterCondition,
  onUpdate: (index: number, patch: Partial<FilterCondition>) => void,
): void {
  onUpdate(index, {
    datePreset: 'custom',
    operator: 'BETWEEN',
    valueTo: filter.valueTo ?? filter.value ?? '',
  });
}

function detectActiveDatePreset(filter: FilterCondition): DateQuickPreset | null {
  if (filter.datePreset) {
    return filter.datePreset;
  }

  const today = toISODate(new Date());
  if (matchesToday(filter, today)) {
    return 'today';
  }

  for (const preset of DATE_PRESETS) {
    if (matchesPreset(filter, preset.key)) {
      return preset.key;
    }
  }

  return null;
}

function matchesToday(filter: FilterCondition, today: string): boolean {
  if (filter.operator === 'BETWEEN') {
    return filter.value === today && filter.valueTo === today;
  }

  if (filter.operator === '<=') {
    return filter.value === today;
  }

  return filter.value === today && !filter.valueTo;
}

function matchesPreset(filter: FilterCondition, preset: DateRangePreset): boolean {
  const range = resolvePreset(preset);
  if (!range) {
    return false;
  }

  if (filter.operator === 'BETWEEN') {
    return filter.value === range.from && filter.valueTo === range.to;
  }

  if (filter.operator === '<=') {
    return filter.value === range.to;
  }

  return filter.value === range.from && !filter.valueTo;
}
