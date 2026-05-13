/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';
import {Chip} from '../../shared/components/Chip.js';
import {Icon} from '../../shared/components/Icon.js';
import type {ColumnInfo} from '../../shared/types.js';

interface Props {
  columns: ColumnInfo[];
  selectedFields: string[];
  onToggle: (field: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export function SelectClause({columns, selectedFields, onToggle, onSelectAll, onClear}: Props) {
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
          {selectedFields.map((f) => (
            <Chip key={f} label={f} onRemove={() => onToggle(f)} />
          ))}
        </div>
      )}
    </ClauseCard>
  );
}
