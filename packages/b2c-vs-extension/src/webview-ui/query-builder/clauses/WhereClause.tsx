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
import type {ColumnInfo, FilterCondition, FilterOperator} from '../../shared/types.js';

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

            return (
              <div className={`filter-row${isDateCol ? ' filter-row--date' : ''}`} key={idx}>
                <div className="filter-row__main">
                  <select
                    className="field-select"
                    value={f.column}
                    onChange={(e) => {
                      const nextCol = e.currentTarget.value;
                      const nextIsDate = isDateLikeType(columnTypeByName.get(nextCol));
                      const patch: Partial<FilterCondition> = {column: nextCol};
                      // If the new column is a date but the current operator
                      // isn't valid for dates (e.g. user picked LIKE first),
                      // snap back to '=' so the row stays usable.
                      if (nextIsDate && !DATE_OPERATORS.includes(f.operator)) {
                        patch.operator = '=';
                      }
                      onUpdate(idx, patch);
                    }}
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
                      onChange={(e) => onUpdate(idx, {value: e.currentTarget.value})}
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
                      onChange={(e) => onUpdate(idx, {valueTo: e.currentTarget.value})}
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
                        className="btn-ghost date-preset-chip"
                        onClick={() => applyPreset(idx, f.operator, p.key, onUpdate)}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn-ghost date-preset-chip"
                      title="Set to today"
                      onClick={() => onUpdate(idx, {value: toISODate(new Date())})}
                    >
                      Today
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
 * Map a preset onto the current filter's value(s). For `BETWEEN` we fill
 * both bounds. For `<=` we put the *end* of the range in `value` (since
 * that's the natural single-bound interpretation of "events up to last
 * week"). Otherwise we fill `value` with the start of the range and clear
 * any stale `valueTo` from a previous BETWEEN selection.
 */
function applyPreset(
  index: number,
  operator: FilterOperator,
  preset: DateRangePreset,
  onUpdate: (index: number, patch: Partial<FilterCondition>) => void,
): void {
  const range = resolvePreset(preset);
  if (!range) return;
  if (operator === 'BETWEEN') {
    onUpdate(index, {value: range.from, valueTo: range.to});
  } else if (operator === '<=') {
    onUpdate(index, {value: range.to, valueTo: undefined});
  } else {
    onUpdate(index, {value: range.from, valueTo: undefined});
  }
}
