/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipClient, CipQueryOptions, CipQueryResult} from '../../clients/cip.js';

/** Supported curated report parameter types. */
export type CipReportParamType = 'string' | 'number' | 'boolean' | 'date';

/**
 * Parameter contract for a curated CIP report.
 */
export interface CipReportParamDefinition {
  name: string;
  description: string;
  type: CipReportParamType;
  required?: boolean;
  min?: number;
  max?: number;
  /**
   * Allowed values for an enum-style parameter (for example `['4xx', '5xx']`).
   * When set, {@link CipReportParamType} should be `string` and the value is
   * validated against this set before the report's SQL builder runs.
   */
  options?: string[];
  /**
   * When true, the parameter accepts multiple comma-separated values, suitable
   * for a SQL `IN (...)` clause. Each value is validated against `options` when
   * both are set.
   */
  multiple?: boolean;
  /**
   * Default value applied when the parameter is omitted. For `multiple`
   * parameters this may be a comma-separated string. Defaults are injected
   * before validation so a report can rely on the value being present.
   */
  default?: string;
}

/**
 * Curated CIP report definition.
 */
export interface CipReportDefinition {
  name: string;
  description: string;
  category: string;
  parameters: CipReportParamDefinition[];
  buildSql: (params: Record<string, string>) => string;
  /**
   * Optional list of warehouse tables the report reads, for discoverability in
   * `--describe` output and the report listing command. Does not affect SQL.
   */
  tablesUsed?: string[];
}

/**
 * Generated SQL for a curated report execution.
 */
export interface CipReportSqlResult {
  report: CipReportDefinition;
  sql: string;
}

/**
 * Options for executing a curated report.
 */
export interface CipReportExecutionOptions extends CipQueryOptions {
  params: Record<string, string>;
}

/**
 * Result of a curated report query.
 */
export interface CipReportQueryResult extends CipQueryResult {
  reportName: string;
}

/**
 * Function signature for custom report query executors.
 */
export type CipReportQueryExecutor = (
  client: CipClient,
  options: CipReportExecutionOptions,
) => Promise<CipReportQueryResult>;

/**
 * Table metadata record from CIP metadata catalog.
 */
export interface CipTableMetadata {
  tableName: string;
  tableSchema: string;
  tableType: string;
}

/**
 * Column metadata record from CIP metadata catalog.
 */
export interface CipColumnMetadata {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  ordinalPosition: number;
  tableName: string;
  tableSchema: string;
}

/**
 * Options for listing tables from metadata catalog.
 */
export interface CipListTablesOptions extends Pick<CipQueryOptions, 'fetchSize'> {
  schema?: string;
  tableNamePattern?: string;
  tableType?: string;
}

/**
 * Result for table listing operation.
 */
export interface CipListTablesResult {
  schema?: string;
  tableCount: number;
  tables: CipTableMetadata[];
}

/**
 * Options for describing table columns from metadata catalog.
 */
export interface CipDescribeTableOptions extends Pick<CipQueryOptions, 'fetchSize'> {
  schema?: string;
}

/**
 * Result for table describe operation.
 */
export interface CipDescribeTableResult {
  columnCount: number;
  columns: CipColumnMetadata[];
  tableName: string;
  tableSchema: string;
}
