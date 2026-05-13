/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Icon} from '../../shared/components/Icon.js';
import {SegmentedControl} from '../../shared/components/SegmentedControl.js';
import type {ColumnInfo, FilterCondition, FilterOperator} from '../../shared/types.js';

const OPERATORS: FilterOperator[] = [
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
            const needsValue = f.operator !== 'IS NULL' && f.operator !== 'IS NOT NULL';
            return (
              <div className="filter-row" key={idx}>
                <select
                  className="field-select"
                  value={f.column}
                  onChange={(e) => onUpdate(idx, {column: e.currentTarget.value})}
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
                  onChange={(e) => onUpdate(idx, {operator: e.currentTarget.value as FilterOperator})}
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                {needsValue ? (
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Value"
                    value={f.value || ''}
                    onChange={(e) => onUpdate(idx, {value: e.currentTarget.value})}
                  />
                ) : (
                  <span />
                )}
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
            );
          })}
        </>
      )}
    </ClauseCard>
  );
}
