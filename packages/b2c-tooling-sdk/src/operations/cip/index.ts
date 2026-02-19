/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipClient} from '../../clients/cip.js';
import {CIP_REPORTS} from './reports.js';
import type {
  CipDescribeTableOptions,
  CipDescribeTableResult,
  CipColumnMetadata,
  CipListTablesOptions,
  CipListTablesResult,
  CipReportDefinition,
  CipReportExecutionOptions,
  CipReportQueryResult,
  CipReportSqlResult,
  CipTableMetadata,
} from './types.js';

/**
 * Curated CIP report operations.
 *
 * This module exposes report catalog discovery, SQL generation, and
 * report execution helpers on top of {@link CipClient}.
 *
 * @module operations/cip
 */

export type {
  CipColumnMetadata,
  CipDescribeTableOptions,
  CipDescribeTableResult,
  CipListTablesOptions,
  CipListTablesResult,
  CipReportDefinition,
  CipReportExecutionOptions,
  CipReportParamType,
  CipReportParamDefinition,
  CipReportQueryExecutor,
  CipReportQueryResult,
  CipReportSqlResult,
  CipTableMetadata,
} from './types.js';

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toUpperCase() === 'YES' || value.toLowerCase() === 'true';
  }

  return false;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  return Number(value ?? 0);
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

/**
 * Lists tables from the CIP metadata catalog.
 */
export async function listCipTables(
  client: CipClient,
  options: CipListTablesOptions = {},
): Promise<CipListTablesResult> {
  const whereClauses: string[] = [];

  if (options.schema) {
    whereClauses.push(`tableSchem = '${escapeSqlLiteral(options.schema)}'`);
  }

  if (options.tableNamePattern) {
    whereClauses.push(`tableName LIKE '${escapeSqlLiteral(options.tableNamePattern)}'`);
  }

  if (options.tableType) {
    whereClauses.push(`tableType = '${escapeSqlLiteral(options.tableType)}'`);
  }

  const whereClauseSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT tableSchem, tableName, tableType FROM metadata.TABLES${whereClauseSql} ORDER BY tableSchem, tableName`;
  const result = await client.query(sql, {fetchSize: options.fetchSize});

  const tables: CipTableMetadata[] = result.rows.map((row) => ({
    tableName: toStringOrEmpty(row.tableName),
    tableSchema: toStringOrEmpty(row.tableSchem),
    tableType: toStringOrEmpty(row.tableType),
  }));

  return {
    schema: options.schema,
    tableCount: tables.length,
    tables,
  };
}

/**
 * Describes table columns from the CIP metadata catalog.
 */
export async function describeCipTable(
  client: CipClient,
  tableName: string,
  options: CipDescribeTableOptions = {},
): Promise<CipDescribeTableResult> {
  const tableSchema = options.schema ?? 'warehouse';
  const sql =
    `SELECT tableSchem, tableName, columnName, typeName, isNullable, ordinalPosition FROM metadata.COLUMNS ` +
    `WHERE tableSchem = '${escapeSqlLiteral(tableSchema)}' AND tableName = '${escapeSqlLiteral(tableName)}' ` +
    `ORDER BY ordinalPosition`;

  const result = await client.query(sql, {fetchSize: options.fetchSize});

  const columns: CipColumnMetadata[] = result.rows.map((row) => ({
    columnName: toStringOrEmpty(row.columnName),
    dataType: toStringOrEmpty(row.typeName),
    isNullable: toBoolean(row.isNullable),
    ordinalPosition: toNumber(row.ordinalPosition),
    tableName: toStringOrEmpty(row.tableName),
    tableSchema: toStringOrEmpty(row.tableSchem),
  }));

  return {
    columnCount: columns.length,
    columns,
    tableName,
    tableSchema,
  };
}

/**
 * Lists all curated CIP reports.
 */
export function listCipReports(): CipReportDefinition[] {
  return [...CIP_REPORTS];
}

/**
 * Looks up a curated CIP report by name.
 */
export function getCipReportByName(name: string): CipReportDefinition | undefined {
  return CIP_REPORTS.find((report) => report.name === name);
}

function validateReportParams(report: CipReportDefinition, params: Record<string, string>): void {
  const unknownParams = Object.keys(params).filter(
    (key) => !report.parameters.some((parameter) => parameter.name === key),
  );
  if (unknownParams.length > 0) {
    throw new Error(`Unknown parameters for report "${report.name}": ${unknownParams.join(', ')}`);
  }

  for (const parameter of report.parameters) {
    if (parameter.required && !params[parameter.name]) {
      throw new Error(`Missing required parameter for report "${report.name}": ${parameter.name}`);
    }
  }
}

/**
 * Builds SQL for a curated report after validating provided parameters.
 */
export function buildCipReportSql(name: string, params: Record<string, string>): CipReportSqlResult {
  const report = getCipReportByName(name);
  if (!report) {
    throw new Error(`Unknown CIP report: ${name}`);
  }

  validateReportParams(report, params);

  return {
    report,
    sql: report.buildSql(params),
  };
}

/**
 * Executes a curated report query and returns decoded rows.
 */
export async function executeCipReport(
  client: CipClient,
  reportName: string,
  options: CipReportExecutionOptions,
): Promise<CipReportQueryResult> {
  const {report, sql} = buildCipReportSql(reportName, options.params);
  const queryResult = await client.query(sql, options);

  return {
    ...queryResult,
    reportName: report.name,
  };
}
