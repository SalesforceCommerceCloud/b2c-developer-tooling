/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// GROUP BY clause — mirrors OrderByClause's row pattern but without the
// direction toggle. Used together with the aggregate dropdowns on
// SelectClause chips to reproduce the curated CIP report SQL shape, e.g.
// `SELECT site_id, SUM(revenue) FROM ... GROUP BY site_id`.
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Icon} from '../../shared/components/Icon.js';
import type {ColumnInfo} from '../../shared/types.js';

interface Props {
  columns: ColumnInfo[];
  groupBy: string[];
  onAdd: () => void;
  onUpdate: (index: number, column: string) => void;
  onRemove: (index: number) => void;
}

export function GroupByClause({columns, groupBy, onAdd, onUpdate, onRemove}: Props) {
  return (
    <ClauseCard
      step={5}
      keyword="GROUP BY"
      heading="Group Results"
      description="Aggregate rows that share values in the listed columns."
      dataClause="group"
      actions={
        <button className="btn-ghost" onClick={onAdd}>
          <Icon name="plus" />
          <span>Add Group</span>
        </button>
      }
    >
      {groupBy.length === 0 ? (
        <span className="placeholder">No grouping applied — every row is returned as-is.</span>
      ) : (
        groupBy.map((col, idx) => (
          <div className="order-row" key={idx}>
            <select className="field-select" value={col} onChange={(e) => onUpdate(idx, e.currentTarget.value)}>
              <option value="">Select column...</option>
              {columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <span />
            <button
              type="button"
              className="remove-btn"
              title="Remove group"
              onClick={() => onRemove(idx)}
              aria-label="Remove group"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </ClauseCard>
  );
}
