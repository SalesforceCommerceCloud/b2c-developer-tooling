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

export type {
  CipReportDefinition,
  CipReportExecutionOptions,
  CipReportParamDefinition,
  CipReportSqlResult,
} from './types.js';

export function listCipReports(): CipReportDefinition[] {
  return [...CIP_REPORTS];
}

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
