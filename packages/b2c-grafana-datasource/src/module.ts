/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import { DataSourcePlugin } from '@grafana/data';

import { B2CMetricsDataSource } from './datasource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { B2CMetricsDataSourceOptions, B2CMetricsQuery } from './types';

/**
 * Grafana datasource plugin registration for B2C Metrics
 */
export const plugin = new DataSourcePlugin<B2CMetricsDataSource, B2CMetricsQuery, B2CMetricsDataSourceOptions>(
  B2CMetricsDataSource
)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
