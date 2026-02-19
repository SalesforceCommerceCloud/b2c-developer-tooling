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
