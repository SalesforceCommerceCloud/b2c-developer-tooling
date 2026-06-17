/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Pure WHERE-clause validation for the visual builder. Lives outside
// QueryBuilder.tsx so tests can import it without dragging in React.

interface FilterShape {
  column: string;
  operator: string;
  value: string;
  valueTo?: string;
}

/**
 * Look at every WHERE filter row and surface the first one that's missing a
 * value the operator actually needs. Returns a user-facing message ready
 * for the status bar, or null if all rows look fine.
 *
 * Rows whose column is still on the placeholder ("Select column...") are
 * silently dropped by `buildSql`, so we ignore them here too.
 *
 * Operators that don't need a value at all (`IS NULL`, `IS NOT NULL`) skip
 * the value check. `BETWEEN` requires both bounds. Everything else just
 * needs `value` to be non-empty.
 *
 * Why this exists: without this gate, `WHERE col = ''` gets shipped to CIP,
 * which against a boolean / numeric / date column responds with a 400
 * "invalid input syntax for type X". The user can't easily tell that
 * means "you forgot a value".
 */
export function findIncompleteFilter(filters: ReadonlyArray<FilterShape>): string | null {
  for (const f of filters) {
    if (!f.column) continue;
    if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') continue;
    if (f.operator === 'BETWEEN') {
      if (!f.value || !f.valueTo) {
        return `Filter on "${f.column}" needs both a from and to value for BETWEEN.`;
      }
      continue;
    }
    if (f.value === '' || f.value === undefined || f.value === null) {
      return `Filter on "${f.column}" is missing a value.`;
    }
  }
  return null;
}
