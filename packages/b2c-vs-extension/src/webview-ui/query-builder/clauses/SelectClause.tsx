/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Icon} from '../../shared/components/Icon.js';
import type {AggregateFn, ColumnInfo} from '../../shared/types.js';

const AGG_OPTIONS: Array<{value: '' | AggregateFn; label: string}> = [
  {value: '', label: 'none'},
  {value: 'COUNT', label: 'COUNT'},
  {value: 'SUM', label: 'SUM'},
  {value: 'AVG', label: 'AVG'},
  {value: 'MIN', label: 'MIN'},
  {value: 'MAX', label: 'MAX'},
];

interface Props {
  columns: ColumnInfo[];
  selectedFields: string[];
  /** Per-field aggregate function. Missing entry → no aggregate. */
  aggregates: Record<string, AggregateFn | undefined>;
  onToggle: (field: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onSetAggregate: (field: string, agg: AggregateFn | undefined) => void;
}

export function SelectClause({
  columns,
  selectedFields,
  aggregates,
  onToggle,
  onSelectAll,
  onClear,
  onSetAggregate,
}: Props) {
  const allSelected = selectedFields.length > 0 && selectedFields.length === columns.length;
  const noColumns = columns.length === 0;

  return (
    <ClauseCard
      step={1}
      keyword="SELECT"
      heading="Choose Columns"
      description="Pick which fields to retrieve — defaults to all columns (*)."
      dataClause="select"
      actions={
        <>
          <button className="btn-ghost" onClick={onSelectAll} disabled={noColumns || allSelected}>
            <Icon name="check" />
            <span>Select All</span>
          </button>
          <button className="btn-ghost" onClick={onClear} disabled={selectedFields.length === 0}>
            <Icon name="close" />
            <span>Clear</span>
          </button>
        </>
      }
    >
      {selectedFields.length === 0 ? (
        <span className="placeholder">No columns selected — will use SELECT * (all columns).</span>
      ) : (
        <div className="chips">
          {selectedFields.map((f) => {
            const agg = aggregates[f];
            return (
              <div className={`chip select-chip${agg ? ' has-agg' : ''}`} key={f}>
                <span className="select-chip__name" title={f}>
                  {f}
                </span>
                <select
                  className="select-chip__agg"
                  aria-label={`Aggregate for ${f}`}
                  title="Aggregate function"
                  value={agg ?? ''}
                  onChange={(e) => {
                    const v = e.currentTarget.value as '' | AggregateFn;
                    onSetAggregate(f, v === '' ? undefined : v);
                  }}
                >
                  {AGG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="remove" role="button" aria-label={`Remove ${f}`} onClick={() => onToggle(f)}>
                  ✕
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ClauseCard>
  );
}
