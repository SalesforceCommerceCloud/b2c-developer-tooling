/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Typed bridge to the VS Code webview API. Wraps `acquireVsCodeApi()` so callers
// post structured messages instead of raw objects, and centralizes the contract
// with the extension host (cip-webview-manager.ts) in one place.
import type {ConnectionState, QueryResultData, SavedQuery, SchemaInfo} from '../types.js';

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/** Serializable subset of CipReportDefinition the host injects for the Report Dashboard. */
export interface ReportContext {
  name: string;
  description: string;
  category: string;
  displayName: string;
  parameters: Array<{
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required?: boolean;
    min?: number;
    max?: number;
  }>;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
    __INITIAL_CONNECTION__?: ConnectionState;
    __REPORT__?: ReportContext;
  }
}

export type OutboundMessage =
  | {command: 'loadTables'}
  | {command: 'describeTable'; params: {tableName: string}}
  | {command: 'executeRawQuery'; params: {sql: string; fetchSize: number}}
  | {command: 'executeQuery'; reportName: string; params: Record<string, string>}
  | {command: 'loadSites'}
  | {command: 'configureConnection'}
  | {command: 'exportCsv'; params: {data: QueryResultData}}
  | {command: 'exportJson'; params: {data: QueryResultData}}
  | {command: 'copyToClipboard'; params: {text: string}}
  | {command: 'showWarning'; params: {message: string}}
  | {command: 'log'; params: {message: string}}
  | {command: 'listSavedQueries'}
  | {command: 'saveQuery'; params: {name: string; description?: string; sql: string}}
  | {command: 'updateQuery'; params: {id: string; name: string; description?: string; sql: string}}
  | {command: 'deleteQuery'; params: {id: string}};

export type InboundMessage =
  | {command: 'connectionState'; connection: ConnectionState}
  | {command: 'tablesLoading'}
  | {command: 'tablesLoaded'; tables: string[]; tableCount: number}
  | {command: 'tablesLoadError'; error: string; headline?: string; details?: string}
  | {command: 'tableDescribing'; tableName: string}
  | {command: 'tableDescribed'; tableName?: string; schema: SchemaInfo}
  | {command: 'tableDescribeError'; tableName?: string; error: string; headline?: string; details?: string}
  | {command: 'queryExecuting'}
  | {command: 'queryResult'; data: QueryResultData}
  | {command: 'queryResults'; data: QueryResultData}
  | {command: 'queryError'; error: string; headline?: string; details?: string}
  | {command: 'sitesLoaded'; sites: string[]}
  | {command: 'savedQueries'; queries: SavedQuery[]; activeTenantId: string}
  | {command: 'savedQuerySaved'}
  | {command: 'savedQueryUpdated'}
  | {command: 'savedQueryDeleted'}
  | {command: 'savedQueryError'; error: string};

let cached: VsCodeApi | null = null;

function getVsCode(): VsCodeApi {
  if (cached) return cached;
  if (typeof window === 'undefined' || !window.acquireVsCodeApi) {
    // Headless fallback for unit tests — swallow messages.
    cached = {postMessage: () => {}, getState: () => undefined, setState: () => {}};
    return cached;
  }
  cached = window.acquireVsCodeApi();
  return cached;
}

export function postMessage(message: OutboundMessage): void {
  getVsCode().postMessage(message);
}

export function getInitialConnection(): ConnectionState {
  if (typeof window !== 'undefined' && window.__INITIAL_CONNECTION__) {
    return window.__INITIAL_CONNECTION__;
  }
  return {status: 'disconnected'};
}

export function getReportContext(): ReportContext | null {
  if (typeof window === 'undefined' || !window.__REPORT__) return null;
  return window.__REPORT__;
}
