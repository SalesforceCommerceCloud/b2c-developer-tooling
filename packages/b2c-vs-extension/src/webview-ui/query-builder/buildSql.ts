/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Pure SQL composition extracted from query-builder.html so it can be unit
// tested without booting the webview. Logic mirrors the original buildSql()
// line-for-line.
import type {FilterCondition, OrderClause} from '../shared/types.js';

interface BuildSqlInput {
  currentTable: string | null;
  selectedFields: string[];
  filters: FilterCondition[];
  filterLogic: 'AND' | 'OR';
  orderBy: OrderClause[];
  limit: number | null;
}

export function buildSql(input: BuildSqlInput): string {
  if (!input.currentTable) return '-- Select an entity to generate query';

  const fields = input.selectedFields.length > 0 ? input.selectedFields.join(', ') : '*';
  let sql = 'SELECT ' + fields + '\nFROM ' + input.currentTable;

  const validFilters = input.filters.filter((f) => f.column);
  if (validFilters.length > 0) {
    const conditions = validFilters.map((f) => {
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        return f.column + ' ' + f.operator;
      }
      const needsQuotes = f.operator === 'LIKE' || f.operator === 'NOT LIKE' || isNaN(Number(f.value));
      if (f.operator === 'IN' || f.operator === 'NOT IN') {
        return f.column + ' ' + f.operator + ' (' + f.value + ')';
      }
      const value = needsQuotes ? "'" + (f.value || '').replace(/'/g, "''") + "'" : f.value;
      return f.column + ' ' + f.operator + ' ' + value;
    });
    sql += '\nWHERE ' + conditions.join(' ' + input.filterLogic + ' ');
  }

  const validOrder = input.orderBy.filter((o) => o.column);
  if (validOrder.length > 0) {
    sql += '\nORDER BY ' + validOrder.map((o) => o.column + ' ' + o.direction).join(', ');
  }

  if (input.limit && input.limit > 0) {
    sql += '\nLIMIT ' + input.limit;
  }

  return sql;
}
