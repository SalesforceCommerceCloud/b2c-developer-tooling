/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Serializable subset of CipReportDefinition the webview needs. The host injects
// this as `window.__REPORT__` so the React app can render the dynamic form.

export type ReportParamType = 'string' | 'number' | 'boolean' | 'date';

export interface ReportParamDefinition {
  name: string;
  description: string;
  type: ReportParamType;
  required?: boolean;
  min?: number;
  max?: number;
}

export interface ReportDefinitionLite {
  name: string;
  description: string;
  category: string;
  displayName: string;
  parameters: ReportParamDefinition[];
}
