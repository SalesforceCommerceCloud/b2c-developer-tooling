/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import type {CipClient, CipQueryOptions, CipQueryResult} from '../../clients/cip.js';

export type CipReportParamType = 'string' | 'number' | 'boolean' | 'date';

export interface CipReportParamDefinition {
  name: string;
  description: string;
  type: CipReportParamType;
  required?: boolean;
  min?: number;
  max?: number;
}

export interface CipReportDefinition {
  name: string;
  description: string;
  category: string;
  parameters: CipReportParamDefinition[];
  buildSql: (params: Record<string, string>) => string;
}

export interface CipReportSqlResult {
  report: CipReportDefinition;
  sql: string;
}

export interface CipReportExecutionOptions extends CipQueryOptions {
  params: Record<string, string>;
}

export interface CipReportQueryResult extends CipQueryResult {
  reportName: string;
}

export type CipReportQueryExecutor = (
  client: CipClient,
  options: CipReportExecutionOptions,
) => Promise<CipReportQueryResult>;
