/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import {ClauseCard} from '../../shared/components/ClauseCard.js';

interface Props {
  limit: number | null;
  onChange: (limit: number | null) => void;
}

export function LimitClause({limit, onChange}: Props) {
  return (
    <ClauseCard
      step={5}
      keyword="LIMIT"
      heading="Result Cap"
      description="Maximum number of rows to return."
      dataClause="limit"
    >
      <div className="limit-row">
        <input
          type="number"
          className="field-input limit-input"
          placeholder="100"
          min={1}
          max={10000}
          value={limit ?? ''}
          aria-label="Row limit"
          onChange={(e) => {
            const v = parseInt(e.currentTarget.value, 10);
            onChange(Number.isNaN(v) ? null : v);
          }}
        />
        <span className="limit-suffix">rows maximum</span>
        <span className="limit-hint">up to 10,000</span>
      </div>
    </ClauseCard>
  );
}
