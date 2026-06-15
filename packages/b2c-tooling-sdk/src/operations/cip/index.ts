/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipClient} from '../../clients/cip.js';
import {CIP_REPORTS} from './reports.js';
import {escapeSqlString} from './sql.js';
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

export {
  booleanLiteral,
  dateLiteral,
  escapeSqlString,
  integerLiteral,
  isReservedIdentifier,
  quoteIdentifierIfReserved,
  stringInList,
  stringLiteral,
} from './sql.js';

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Resolves a value from a metadata row by matching candidate column patterns
 * case-insensitively (ignoring underscores).
 *
 * CIP's Avatica metadata results are keyed by the column *labels* the JDBC
 * driver emits. Depending on the tenant/driver these can be the camelCase
 * aliases from our SELECT (`tableName`) or the standard uppercase JDBC metadata
 * names (`TABLE_NAME`). Hard-coding a single casing makes the mapping silently
 * yield empty strings for the other variant — so match tolerantly instead.
 */
function pickRowValue(row: Record<string, unknown>, ...patterns: RegExp[]): unknown {
  for (const key of Object.keys(row)) {
    const normalizedKey = key.replaceAll('_', '').toLowerCase();
    if (patterns.some((pattern) => pattern.test(normalizedKey))) {
      return row[key];
    }
  }

  return undefined;
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

/**
 * Lists tables from the CIP metadata catalog.
 *
 * @param client - CIP client instance for executing metadata queries
 * @param options - Optional filtering and pagination options (schema, table name pattern, table type, fetch size)
 * @returns Promise resolving to a list of table metadata records with schema information and table count
 */
export async function listCipTables(
  client: CipClient,
  options: CipListTablesOptions = {},
): Promise<CipListTablesResult> {
  const whereClauses: string[] = [];

  if (options.schema) {
    whereClauses.push(`tableSchem = '${escapeSqlString(options.schema)}'`);
  }

  if (options.tableNamePattern) {
    whereClauses.push(`tableName LIKE '${escapeSqlString(options.tableNamePattern)}'`);
  }

  if (options.tableType) {
    whereClauses.push(`tableType = '${escapeSqlString(options.tableType)}'`);
  }

  const whereClauseSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT tableSchem, tableName, tableType FROM metadata.TABLES${whereClauseSql} ORDER BY tableSchem, tableName`;
  const result = await client.query(sql, {fetchSize: options.fetchSize});

  const tables: CipTableMetadata[] = result.rows.map((row) => ({
    tableName: toStringOrEmpty(pickRowValue(row, /^tablename$/)),
    tableSchema: toStringOrEmpty(pickRowValue(row, /^tableschem(a)?$/)),
    tableType: toStringOrEmpty(pickRowValue(row, /^tabletype$/)),
  }));

  return {
    schema: options.schema,
    tableCount: tables.length,
    tables,
  };
}

/**
 * Describes table columns from the CIP metadata catalog.
 *
 * @param client - CIP client instance for metadata queries
 * @param tableName - Name of the table to describe
 * @param options - Optional schema selection and pagination options
 * @returns Promise resolving to table column descriptions and metadata
 */
export async function describeCipTable(
  client: CipClient,
  tableName: string,
  options: CipDescribeTableOptions = {},
): Promise<CipDescribeTableResult> {
  const tableSchema = options.schema ?? 'warehouse';
  const sql =
    `SELECT tableSchem, tableName, columnName, typeName, isNullable, ordinalPosition FROM metadata.COLUMNS ` +
    `WHERE tableSchem = '${escapeSqlString(tableSchema)}' AND tableName = '${escapeSqlString(tableName)}' ` +
    `ORDER BY ordinalPosition`;

  const result = await client.query(sql, {fetchSize: options.fetchSize});

  const columns: CipColumnMetadata[] = result.rows.map((row) => ({
    columnName: toStringOrEmpty(pickRowValue(row, /^columnname$/)),
    dataType: toStringOrEmpty(pickRowValue(row, /^(typename|datatype)$/)),
    isNullable: toBoolean(pickRowValue(row, /^isnullable$/)),
    ordinalPosition: toNumber(pickRowValue(row, /^ordinalposition$/)),
    tableName: toStringOrEmpty(pickRowValue(row, /^tablename$/)),
    tableSchema: toStringOrEmpty(pickRowValue(row, /^tableschem(a)?$/)),
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
 *
 * @returns Array of all available curated CIP report definitions
 */
export function listCipReports(): CipReportDefinition[] {
  return [...CIP_REPORTS];
}

/**
 * Looks up a curated CIP report by name.
 *
 * @param name - The report name to look up
 * @returns The report definition if found, undefined if no report matches the provided name
 */
export function getCipReportByName(name: string): CipReportDefinition | undefined {
  return CIP_REPORTS.find((report) => report.name === name);
}

/**
 * Validates supplied params against the report contract and returns a normalized
 * copy with defaults applied. Enforces required params and, where declared,
 * enum `options` (including per-value checks for `multiple` parameters).
 */
function validateReportParams(report: CipReportDefinition, params: Record<string, string>): Record<string, string> {
  const unknownParams = Object.keys(params).filter(
    (key) => !report.parameters.some((parameter) => parameter.name === key),
  );
  if (unknownParams.length > 0) {
    throw new Error(`Unknown parameters for report "${report.name}": ${unknownParams.join(', ')}`);
  }

  const normalized: Record<string, string> = {...params};

  for (const parameter of report.parameters) {
    if (!normalized[parameter.name] && parameter.default !== undefined) {
      normalized[parameter.name] = parameter.default;
    }

    const value = normalized[parameter.name];

    if (parameter.required && !value) {
      throw new Error(`Missing required parameter for report "${report.name}": ${parameter.name}`);
    }

    if (value && parameter.options && parameter.options.length > 0) {
      const candidates = parameter.multiple ? value.split(',').map((item) => item.trim()) : [value];
      const invalid = candidates.filter((candidate) => !parameter.options?.includes(candidate));
      if (invalid.length > 0) {
        throw new Error(
          `Invalid value(s) for parameter "${parameter.name}" in report "${report.name}": ${invalid.join(', ')}. ` +
            `Allowed: ${parameter.options.join(', ')}`,
        );
      }
    }
  }

  return normalized;
}

/**
 * Builds SQL for a curated report after validating provided parameters.
 *
 * @param name - The name of the report to build SQL for
 * @param params - Parameter values to substitute into the report template, keyed by parameter name
 * @returns The report definition and generated SQL string ready for execution
 * @throws {Error} If the report name is not found in the catalog or required parameters are missing
 */
export function buildCipReportSql(name: string, params: Record<string, string>): CipReportSqlResult {
  const report = getCipReportByName(name);
  if (!report) {
    throw new Error(`Unknown CIP report: ${name}`);
  }

  const normalizedParams = validateReportParams(report, params);

  return {
    report,
    sql: report.buildSql(normalizedParams),
  };
}

/**
 * Executes a curated report query and returns decoded rows.
 *
 * @param client - The CIP client instance to execute the query with
 * @param reportName - The name of the curated report to execute
 * @param options - Report execution options including params and fetch size
 * @returns Promise resolving to the query result containing decoded rows and report metadata
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
