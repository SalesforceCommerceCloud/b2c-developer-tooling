/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipClient} from '../../clients/cip.js';
import {CIP_REPORTS} from './reports.js';
import type {
  CipReportDefinition,
  CipReportExecutionOptions,
  CipReportQueryResult,
  CipReportSqlResult,
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
  CipReportDefinition,
  CipReportExecutionOptions,
  CipReportParamType,
  CipReportParamDefinition,
  CipReportQueryExecutor,
  CipReportQueryResult,
  CipReportSqlResult,
} from './types.js';

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
