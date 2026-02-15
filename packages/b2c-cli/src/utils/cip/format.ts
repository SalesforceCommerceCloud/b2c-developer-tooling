/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {createTable, type ColumnDef} from '@salesforce/b2c-tooling-sdk/cli';

export type CipOutputFormat = 'csv' | 'json' | 'table';

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function toCsv(columns: string[], rows: Array<Record<string, unknown>>): string {
  const lines: string[] = [];
  lines.push(columns.map((column) => escapeCsv(column)).join(','));

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsv(toDisplayValue(row[column]))).join(','));
  }

  return lines.join('\n');
}

export function renderTable(columns: string[], rows: Array<Record<string, unknown>>): void {
  if (columns.length === 0) {
    ux.stdout('No columns returned.');
    return;
  }

  const columnKeys = columns.map((_, index) => `column_${index + 1}`);
  const tableColumns: Record<string, ColumnDef<Record<string, unknown>>> = {};

  for (const [index, key] of columnKeys.entries()) {
    const columnName = columns[index];
    tableColumns[key] = {
      header: columnName,
      get: (row) => toDisplayValue(row[key]),
    };
  }

  const tableRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [index, key] of columnKeys.entries()) {
      mapped[key] = row[columns[index]];
    }

    return mapped;
  });

  createTable(tableColumns).render(tableRows, columnKeys);
}
