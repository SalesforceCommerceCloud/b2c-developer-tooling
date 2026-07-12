/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Icon} from '../../shared/components/Icon.js';
import type {ColumnInfo, OrderClause} from '../../shared/types.js';

interface Props {
  columns: ColumnInfo[];
  orderBy: OrderClause[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<OrderClause>) => void;
  onRemove: (index: number) => void;
}

export function OrderByClauseView({columns, orderBy, onAdd, onUpdate, onRemove}: Props) {
  return (
    <ClauseCard
      step={4}
      keyword="ORDER BY"
      heading="Sort Results"
      description="Order rows by one or more columns."
      dataClause="order"
      actions={
        <button className="btn-ghost" onClick={onAdd}>
          <Icon name="plus" />
          <span>Add Sort</span>
        </button>
      }
    >
      {orderBy.length === 0 ? (
        <span className="placeholder">No sorting applied — results in default order.</span>
      ) : (
        orderBy.map((o, idx) => (
          <div className="order-row" key={idx}>
            <select
              className="field-select"
              value={o.column}
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
              value={o.direction}
              onChange={(e) => onUpdate(idx, {direction: e.currentTarget.value as 'ASC' | 'DESC'})}
            >
              <option value="ASC">↑ ASC</option>
              <option value="DESC">↓ DESC</option>
            </select>
            <button
              type="button"
              className="remove-btn"
              title="Remove sort"
              onClick={() => onRemove(idx)}
              aria-label="Remove sort"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </ClauseCard>
  );
}
