/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import { DataSourceInstanceSettings, MetricFindValue, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { CIPColumn, CIPDataSourceOptions, CIPQuery, CIPTable, CIPVariableQuery, DEFAULT_CIP_QUERY } from './types';

/**
 * CIP SQL datasource. Delegates query execution to the Go backend (which owns OAuth,
 * the Avatica/protobuf transport, macro expansion, and frame construction).
 */
export class CIPDataSource extends DataSourceWithBackend<CIPQuery, CIPDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<CIPDataSourceOptions>) {
    super(instanceSettings);
  }

  getDefaultQuery(): Partial<CIPQuery> {
    return DEFAULT_CIP_QUERY;
  }

  filterQuery(query: CIPQuery): boolean {
    return Boolean(query.rawSql && query.rawSql.trim());
  }

  applyTemplateVariables(query: CIPQuery, scopedVars: ScopedVars): CIPQuery {
    return {
      ...query,
      rawSql: query.rawSql ? getTemplateSrv().replace(query.rawSql, scopedVars) : query.rawSql,
    };
  }

  /** Schema browser: list catalog tables (optionally filtered by schema). */
  async getTables(schema?: string): Promise<CIPTable[]> {
    return (await this.getResource('tables', schema ? { schema } : {})) as CIPTable[];
  }

  /** Schema browser: describe a table's columns. */
  async getColumns(schema: string, table: string): Promise<CIPColumn[]> {
    return (await this.getResource('columns', { schema, table })) as CIPColumn[];
  }

  /**
   * Powers dashboard template variables. A variable query is either the canned
   * keyword `sites` (distinct storefront site ids) or raw SQL whose first column's
   * distinct values become the variable options. Template variables in the SQL are
   * interpolated first, so variables can depend on each other.
   */
  async metricFindQuery(query: CIPVariableQuery | string): Promise<MetricFindValue[]> {
    const raw = typeof query === 'string' ? query : query?.query ?? '';
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'sites') {
      const sites = (await this.getResource('sites')) as string[];
      return sites.map((s) => ({ text: s, value: s }));
    }
    const sql = getTemplateSrv().replace(trimmed);
    const values = (await this.getResource('variable', { sql })) as string[];
    return values.map((v) => ({ text: v, value: v }));
  }
}
