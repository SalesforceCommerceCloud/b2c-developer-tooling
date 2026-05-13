/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Shared types used across CIP Analytics webviews. Mirrors the message contract
// implemented on the extension-host side in cip-webview-manager.ts.

export type ConnectionStatus = 'connected' | 'disconnected' | 'testing';

export interface ConnectionState {
  id?: string;
  label?: string;
  tenantId?: string;
  env?: string;
  host?: string;
  status: ConnectionStatus;
  message?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface SchemaInfo {
  columns: ColumnInfo[];
}

export interface QueryResultData {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount?: number;
  executionTime?: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  sql: string;
  tenantId: string;
  createdAt?: number;
  updatedAt?: number;
}

/** Filter operator strings supported by the visual builder. */
export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'NOT LIKE'
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL';

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface OrderClause {
  column: string;
  direction: 'ASC' | 'DESC';
}
