/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import React, { useState } from 'react';
import { InlineField, Input } from '@grafana/ui';

import { CIPVariableQuery } from './types';

interface Props {
  query: CIPVariableQuery;
  onChange: (query: CIPVariableQuery, definition: string) => void;
}

/**
 * Editor for CIP template-variable queries. Enter the keyword `sites` for the
 * distinct storefront site ids, or raw Calcite SQL whose first column's distinct
 * values populate the variable (e.g.
 * `SELECT DISTINCT device_class_code FROM warehouse.ccdw_aggr_sales_summary`).
 */
export function VariableQueryEditor({ query, onChange }: Props) {
  const [value, setValue] = useState(query?.query ?? 'sites');

  const onBlur = () => onChange({ query: value }, value);

  return (
    <InlineField
      label="Query"
      labelWidth={16}
      grow
      tooltip="`sites` for storefront ids, or raw Calcite SQL (first column's distinct values are used)"
    >
      <Input
        value={value}
        placeholder="sites  — or —  SELECT DISTINCT col FROM warehouse.table"
        onChange={(e) => setValue(e.currentTarget.value)}
        onBlur={onBlur}
      />
    </InlineField>
  );
}
