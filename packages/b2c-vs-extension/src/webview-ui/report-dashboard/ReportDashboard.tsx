/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Curated-report dashboard. Renders the parameter form, runs the query against
 * the host, displays results in a sortable table, and exposes CSV/JSON/Copy
 * exports.
 */
import * as React from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ConnectionBar} from '../shared/components/ConnectionBar.js';
import {Icon} from '../shared/components/Icon.js';
import {PageHeader} from '../shared/components/PageHeader.js';
import {ResultsTable} from '../shared/components/ResultsTable.js';
import {Spinner} from '../shared/components/Spinner.js';
import {getInitialConnection, getReportContext, postMessage} from '../shared/bridge/vscode.js';
import {useInboundMessages} from '../shared/bridge/useMessage.js';
import {useClipboardCopy} from '../shared/hooks/useClipboardCopy.js';
import type {ConnectionState, QueryResultData} from '../shared/types.js';
import type {DateRangeValue} from './DateRangePicker.js';
import {ReportForm} from './ReportForm.js';

type StatusKind = 'loading' | 'success' | 'error' | null;
interface StatusState {
  kind: StatusKind;
  text?: string;
  html?: string;
}

function formatCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="null-cell">—</span>;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return /^\d{4}-\d{2}-\d{2}$/.test(str) ? date.toLocaleDateString() : date.toLocaleString();
    }
  }
  if (str.length > 100) return str.substring(0, 97) + '...';
  return str;
}

function buildTableText(columns: string[], rows: Array<Record<string, unknown>>): string {
  const header = columns.join('\t');
  const dataRows = rows.map((r) => columns.map((c) => r[c] ?? '').join('\t')).join('\n');
  return header + '\n' + dataRows;
}

export function ReportDashboard() {
  const reportCtx = getReportContext();
  if (!reportCtx) {
    return <div className="status-msg error visible">Missing report definition.</div>;
  }
  return <ReportDashboardInner report={reportCtx} />;
}

function ReportDashboardInner({report}: {report: NonNullable<ReturnType<typeof getReportContext>>}) {
  const [connection, setConnection] = useState<ConnectionState>(getInitialConnection());
  const [values, setValues] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);
  const [siteOptions, setSiteOptions] = useState<string[] | null>(null);
  const [status, setStatus] = useState<StatusState>({kind: null});
  const [results, setResults] = useState<QueryResultData | null>(null);
  const queryStart = useRef(0);
  const {copied, copy} = useClipboardCopy(2000);

  // Success banners shouldn't linger — they're a confirmation, not a setting.
  // Mirrors the auto-hide already used by the Tables Browser status strip.
  useEffect(() => {
    if (status.kind !== 'success') return;
    const timer = window.setTimeout(() => {
      setStatus((cur) => (cur.kind === 'success' ? {kind: null} : cur));
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  const hasDateRange = useMemo(
    () =>
      report.parameters.some((p) => p.name === 'from' && p.type === 'date') &&
      report.parameters.some((p) => p.name === 'to' && p.type === 'date'),
    [report.parameters],
  );

  const onMessage = useCallback((msg: import('../shared/bridge/vscode.js').InboundMessage) => {
    switch (msg.command) {
      case 'connectionState':
        setConnection(msg.connection);
        break;
      case 'sitesLoaded':
        setSiteOptions(msg.sites || []);
        break;
      case 'queryResults': {
        const elapsed = Date.now() - queryStart.current;
        const data: QueryResultData = {
          ...msg.data,
          executionTime: msg.data.executionTime ?? elapsed,
          rowCount: msg.data.rowCount ?? msg.data.rows?.length ?? 0,
        };
        setResults(data);
        setStatus({kind: 'success', text: 'Query completed successfully'});
        break;
      }
      case 'queryError':
        setStatus({kind: 'error', text: String(msg.error)});
        break;
      default:
        break;
    }
  }, []);
  useInboundMessages(onMessage);

  // Ask for sites when connection comes up — site-id reports need them to populate the dropdown.
  useEffect(() => {
    if (connection.status === 'connected') {
      const needsSites = report.parameters.some((p) => p.name === 'siteId');
      if (needsSites) postMessage({command: 'loadSites'});
    } else {
      setSiteOptions(null);
    }
  }, [connection.status, report.parameters]);

  // Cmd/Ctrl + Enter runs the report.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (connection.status === 'connected') runQuery();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [connection.status, values, dateRange]);

  function runQuery() {
    if (!connection.tenantId) {
      setStatus({kind: 'error', text: 'Configure CIP connection first'});
      postMessage({command: 'configureConnection'});
      return;
    }
    if (hasDateRange) {
      if (!dateRange || !dateRange.from || !dateRange.to) {
        setStatus({kind: 'error', text: 'Please select a date range.'});
        return;
      }
    }
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v) params[k] = v;
    }
    if (hasDateRange && dateRange) {
      params['from'] = dateRange.from;
      params['to'] = dateRange.to;
    }
    setStatus({kind: 'loading', text: 'Executing query...'});
    setResults(null);
    queryStart.current = Date.now();
    postMessage({command: 'executeQuery', reportName: report.name, params});
  }

  const isConnected = connection.status === 'connected';
  const fetchSize = values['fetchSize'] || '1000';

  return (
    <div className="page">
      <PageHeader
        eyebrow="B2C-DX Analytics"
        title={report.displayName}
        meta={
          <>
            <ConnectionBar connection={connection} />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => postMessage({command: 'configureConnection'})}
            >
              Configure
            </button>
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runQuery();
        }}
      >
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title">Fetch Size</div>
              <div className="card-subtitle">Rows per batch — higher is faster for large results.</div>
            </div>
          </div>
          <div className="card-body">
            <select
              id="fetchSize"
              name="fetchSize"
              className="select"
              style={{maxWidth: 280}}
              value={fetchSize}
              onChange={(e) => setValues((v) => ({...v, fetchSize: e.currentTarget.value}))}
            >
              <option value="100">100 rows · Fast, small datasets</option>
              <option value="500">500 rows · Balanced</option>
              <option value="1000">1,000 rows · Default</option>
              <option value="5000">5,000 rows · Large datasets</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title">Report Parameters</div>
              <div className="card-subtitle">Customize the report inputs.</div>
            </div>
          </div>
          <div className="card-body">
            <ReportForm
              parameters={report.parameters}
              values={values}
              onChange={(name, value) => setValues((v) => ({...v, [name]: value}))}
              siteOptions={siteOptions}
              hasDateRange={hasDateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>

        <div className="action-bar">
          <div className="info">
            <kbd>⌘</kbd> + <kbd>Enter</kbd> to run query
          </div>
          <button type="submit" className="btn btn-run" disabled={!isConnected || status.kind === 'loading'}>
            <Icon name="play" />
            <span>Run Query</span>
          </button>
        </div>

        <div className={`status-msg${status.kind ? ' ' + status.kind + ' visible' : ''}`}>
          {status.kind === 'loading' ? <Spinner /> : null}
          {status.html ? (
            <span dangerouslySetInnerHTML={{__html: status.html}} />
          ) : status.text ? (
            <span>{status.text}</span>
          ) : null}
        </div>
      </form>

      <div className={`card results${results ? ' visible' : ''}`} style={{marginTop: 16}}>
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-title">Query Results</div>
            <div className="card-subtitle">
              {results ? `${results.rowCount} row${results.rowCount === 1 ? '' : 's'} returned` : '—'}
            </div>
          </div>
        </div>
        <div className="results-toolbar">
          <div className="results-meta">
            {results ? <span className="badge">{(results.rowCount || 0).toLocaleString()} rows</span> : null}
          </div>
          <div className="results-actions">
            <button
              className="btn btn-secondary"
              disabled={!results || (results.rows?.length ?? 0) === 0}
              onClick={() => results && postMessage({command: 'exportCsv', params: {data: results}})}
            >
              <Icon name="download" />
              <span>CSV</span>
            </button>
            <button
              className="btn btn-secondary"
              disabled={!results || (results.rows?.length ?? 0) === 0}
              onClick={() => results && postMessage({command: 'exportJson', params: {data: results}})}
            >
              <Icon name="code" />
              <span>JSON</span>
            </button>
            <button
              className="btn btn-secondary"
              disabled={!results || (results.rows?.length ?? 0) === 0}
              onClick={() => results && copy(buildTableText(results.columns, results.rows))}
            >
              <Icon name={copied ? 'check' : 'check'} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
        <div className="results-scroll">
          {results ? (
            <ResultsTable columns={results.columns} rows={results.rows} sortable formatCell={formatCell} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
