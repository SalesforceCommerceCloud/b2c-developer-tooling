/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Read-only table used to render query results. Sortable headers are opt-in
 * (Report Dashboard uses them; Query Builder doesn't currently sort).
 */
import * as React from 'react';
import {useMemo, useState} from 'react';
import {Icon} from './Icon.js';

interface Props {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  /** Cap rendered rows. The Query Builder caps at 1000 today. */
  maxRows?: number;
  sortable?: boolean;
  /** Custom cell formatter (Report Dashboard formats numbers/dates). */
  formatCell?: (value: unknown) => React.ReactNode;
}

interface SortState {
  column: number | null;
  ascending: boolean;
}

function defaultFormat(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ResultsTable({columns, rows, maxRows, sortable, formatCell = defaultFormat}: Props) {
  const [sort, setSort] = useState<SortState>({column: null, ascending: true});

  const sortedRows = useMemo(() => {
    if (!sortable || sort.column === null) return rows;
    const col = columns[sort.column];
    const list = rows.slice();
    list.sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal));
      return sort.ascending ? cmp : -cmp;
    });
    return list;
  }, [rows, columns, sort, sortable]);

  const visibleRows = maxRows ? sortedRows.slice(0, maxRows) : sortedRows;

  function onHeaderClick(idx: number) {
    if (!sortable) return;
    setSort((cur) => (cur.column === idx ? {column: idx, ascending: !cur.ascending} : {column: idx, ascending: true}));
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="no-results">
        <div className="icon">
          <Icon name="inbox" />
        </div>
        <div>No rows returned for this query.</div>
      </div>
    );
  }

  return (
    <table className="table" id="resultsTable">
      <thead id="resultsTableHead">
        <tr>
          {columns.map((c, idx) => {
            const isSorted = sortable && sort.column === idx;
            const indicator = isSorted ? (sort.ascending ? '↑' : '↓') : '⇅';
            return (
              <th
                key={c}
                className={isSorted ? 'sorted' : ''}
                onClick={sortable ? () => onHeaderClick(idx) : undefined}
                style={sortable ? {cursor: 'pointer'} : undefined}
              >
                {c}
                {sortable ? <span className="sort"> {indicator}</span> : null}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody id="resultsTableBody">
        {visibleRows.map((row, ri) => (
          <tr key={ri}>
            {columns.map((c) => {
              const value = row[c];
              const display = formatCell(value);
              const titleText = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
              return (
                <td key={c} title={titleText}>
                  {display}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
