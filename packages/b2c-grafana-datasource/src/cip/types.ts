/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import { DataQuery, DataSourceJsonData } from '@grafana/data';

/**
 * CIP query format, matching sqlds/sqlutil FormatQueryOption (numeric enum).
 * TimeSeries (0) → sqlds reshapes long→wide for per-series charts; Table (1) → columns as-is.
 */
export enum CIPFormat {
  TimeSeries = 0,
  Table = 1,
}

/** Query model for the CIP SQL datasource. */
export interface CIPQuery extends DataQuery {
  /** Raw Calcite SQL. Supports Grafana time macros ($__timeFilter, $__timeGroup, …). */
  rawSql: string;
  /** Result shape. Numeric enum required by the sqlds backend (see {@link CIPFormat}). */
  format?: CIPFormat;
}

export const DEFAULT_CIP_QUERY: Partial<CIPQuery> = {
  rawSql:
    'SELECT $__timeGroupAlias(submit_date, $__interval),\n       SUM(num_orders) AS orders\nFROM warehouse.ccdw_aggr_sales_summary\nWHERE $__timeFilter(submit_date)\nGROUP BY 1\nORDER BY 1',
  format: CIPFormat.TimeSeries,
};

/** DataSource configuration (jsonData). */
export interface CIPDataSourceOptions extends DataSourceJsonData {
  /** CIP instance id (e.g. "bdpx_prd"). Falls back to tenantId when empty. */
  instance?: string;
  tenantId?: string;
  clientId: string;
  accountManagerHost?: string;
  /** Optional CIP Avatica host override (staging analytics). */
  cipHost?: string;
}

/** Secure configuration (secureJsonData). */
export interface CIPSecureJsonData {
  clientSecret?: string;
}

/**
 * Template-variable query. `query` is either the keyword `sites` (distinct storefront
 * site ids) or raw Calcite SQL whose first column's distinct values become the options.
 */
export interface CIPVariableQuery {
  query: string;
}

/** Table returned by the `tables` resource. */
export interface CIPTable {
  schema: string;
  name: string;
  type: string;
}

/** Column returned by the `columns` resource. */
export interface CIPColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  ordinal: number;
}
