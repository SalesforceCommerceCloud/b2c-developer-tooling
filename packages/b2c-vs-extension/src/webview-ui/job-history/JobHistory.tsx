/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
// Job History app. Built for the real reasons a Commerce developer opens job
// history: "did my job fail, and why?" and "is this job getting slower?".
//
// Design choices that make it useful rather than just a data dump:
// - Failures surface first (default sort puts failed runs on top).
// - System (sfcc-*) jobs are hidden by default — they're platform noise the
//   developer can't act on and they bury the custom jobs that matter.
// - Every row has actions: Open Log, Re-run, Details — so the table is a place
//   to *act*, not just look.
// - Summary chips give an at-a-glance health read (failures / running / jobs).
import * as React from 'react';
import {useMemo, useState} from 'react';
import {PageHeader} from '../shared/components/PageHeader.js';
import {EmptyState} from '../shared/components/EmptyState.js';
import {Icon} from '../shared/components/Icon.js';
import {getInitialRows, postMessage, useInboundMessages, type JobHistoryRow} from './bridge.js';

type SortKey = 'jobId' | 'executionId' | 'status' | 'startMs' | 'durationMs';

// Some sfcc-* system jobs CAN be triggered via the API, but only with specific
// inputs (a file to import, data units to export, an index to rebuild) — a blind
// re-run from history would have nothing to send. They're driven by dedicated
// commands instead, so Re-run from the table stays disabled with a clear reason.
function isInvokableSystemJob(jobId: string): boolean {
  return (
    jobId === 'sfcc-site-archive-import' ||
    jobId === 'sfcc-site-archive-export' ||
    jobId.startsWith('sfcc-search-index-')
  );
}

function systemRerunReason(jobId: string): string {
  return isInvokableSystemJob(jobId)
    ? 'This system job needs specific inputs to run (file, data units, or index) — start it from the Command Palette, not a re-run.'
    : 'This is a platform system job run by the instance scheduler — it cannot be triggered via the API.';
}

// Time-window presets a Commerce developer reaches for most: the last hour
// (frequent/hourly jobs), the overnight batch (24h — the common case), the
// past week (flakiness check), and All. Values are hours; null clears the range.
const TIME_PRESETS: ReadonlyArray<{key: string; label: string; hours: number | null}> = [
  {key: '1h', label: 'Last hour', hours: 1},
  {key: '24h', label: 'Last 24h', hours: 24},
  {key: '7d', label: 'Last 7 days', hours: 24 * 7},
  {key: 'all', label: 'All time', hours: null},
];

/** Formats a Date into the `YYYY-MM-DDTHH:mm` string an <input type=datetime-local> expects (local time). */
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Failed first, then running, then scheduled, then completed — matches what a
// developer wants to triage in order of urgency.
const STATUS_RANK: Record<JobHistoryRow['status'], number> = {failed: 0, running: 1, scheduled: 2, completed: 3};

export function JobHistory() {
  const [rows, setRows] = useState<JobHistoryRow[]>(getInitialRows());
  const [search, setSearch] = useState('');
  // Default to all statuses; the user filters down (Failed/Running/Completed
  // chips) as needed rather than starting pre-filtered.
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [userVisibleOnly, setUserVisibleOnly] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [timePreset, setTimePreset] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('startMs');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  useInboundMessages((msg) => {
    if (msg.command === 'data') setRows(msg.rows);
  });

  const jobIds = useMemo(() => [...new Set(rows.map((r) => r.jobId))].sort((a, b) => a.localeCompare(b)), [rows]);
  const statuses = useMemo(() => [...new Set(rows.map((r) => r.status))].sort((a, b) => a.localeCompare(b)), [rows]);

  const summary = useMemo(() => {
    const scope = userVisibleOnly ? rows.filter((r) => !r.isSystem) : rows;
    return {
      total: scope.length,
      failed: scope.filter((r) => r.status === 'failed').length,
      running: scope.filter((r) => r.status === 'running').length,
      completed: scope.filter((r) => r.status === 'completed').length,
      jobs: new Set(scope.map((r) => r.jobId)).size,
      systemHidden: userVisibleOnly ? rows.filter((r) => r.isSystem).length : 0,
    };
  }, [rows, userVisibleOnly]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = from ? Date.parse(from) : NaN;
    const toMs = to ? Date.parse(to) : NaN;

    const filtered = rows.filter((r) => {
      if (userVisibleOnly && r.isSystem) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (jobFilter && r.jobId !== jobFilter) return false;
      if (!Number.isNaN(fromMs) && (r.startMs == null || r.startMs < fromMs)) return false;
      if (!Number.isNaN(toMs) && (r.startMs == null || r.startMs > toMs)) return false;
      if (q) {
        const hay = `${r.jobId} ${r.executionId} ${r.status} ${r.start} ${r.duration} ${r.message}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = filtered.slice().sort((a, b) => {
      let cmp: number;
      if (sortKey === 'status') {
        cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      } else if (sortKey === 'startMs' || sortKey === 'durationMs') {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        cmp = av - bv;
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return cmp * sortDir;
    });
    return sorted;
  }, [rows, search, statusFilter, jobFilter, userVisibleOnly, from, to, sortKey, sortDir]);

  // Clicking a status stat chip toggles that status as the active filter, and
  // stays in sync with the Status dropdown (both write statusFilter).
  const toggleStatusFilter = (status: JobHistoryRow['status']) =>
    setStatusFilter((cur) => (cur === status ? '' : status));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === 'startMs' || key === 'durationMs' ? -1 : 1);
    }
  }

  // Apply a relative time window: set `from` to now − N hours (and clear `to`),
  // or clear the range entirely for "All time". Marks the preset active so the
  // chip highlights; picking a manual date below deselects the preset.
  function applyTimePreset(preset: (typeof TIME_PRESETS)[number]) {
    setTimePreset(preset.key);
    if (preset.hours == null) {
      setFrom('');
      setTo('');
      return;
    }
    setFrom(toDatetimeLocal(new Date(Date.now() - preset.hours * 60 * 60 * 1000)));
    setTo('');
  }

  function setFromManual(value: string) {
    setFrom(value);
    setTimePreset('');
  }

  function setToManual(value: string) {
    setTo(value);
    setTimePreset('');
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setJobFilter('');
    setFrom('');
    setTo('');
    setTimePreset('all');
  }

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 1 ? '↑' : '↓') : '⇅');

  return (
    <>
      <PageHeader
        flat
        eyebrow="B2C-DX Operations"
        title="Job History"
        subtitle="Execution history from the connected instance. Filter, sort, and act on runs here."
        meta={
          <button type="button" className="btn btn-secondary" onClick={() => postMessage({command: 'refresh'})}>
            <Icon name="refresh" />
            <span>Refresh</span>
          </button>
        }
      />

      <main className="jh-page">
        <div className="jh-summary">
          {/* Failed / Running are clickable status filters (toggle on/off). */}
          <button
            type="button"
            className={`jh-stat jh-stat--filter${statusFilter === 'failed' ? ' jh-stat--active' : ''}${
              summary.failed ? ' jh-stat--alert' : ''
            }`}
            onClick={() => toggleStatusFilter('failed')}
            aria-pressed={statusFilter === 'failed'}
            title="Filter to failed executions (click again to clear)"
          >
            <span className="jh-stat__value">{summary.failed}</span>
            <span className="jh-stat__label">Failed</span>
          </button>
          <button
            type="button"
            className={`jh-stat jh-stat--filter${statusFilter === 'running' ? ' jh-stat--active' : ''}`}
            onClick={() => toggleStatusFilter('running')}
            aria-pressed={statusFilter === 'running'}
            title="Filter to running executions (click again to clear)"
          >
            <span className="jh-stat__value">{summary.running}</span>
            <span className="jh-stat__label">Running</span>
          </button>
          <button
            type="button"
            className={`jh-stat jh-stat--filter${statusFilter === 'completed' ? ' jh-stat--active' : ''}`}
            onClick={() => toggleStatusFilter('completed')}
            aria-pressed={statusFilter === 'completed'}
            title="Filter to completed executions (click again to clear)"
          >
            <span className="jh-stat__value">{summary.completed}</span>
            <span className="jh-stat__label">Completed</span>
          </button>
          {/* Jobs / Executions are counts, not filters — rendered as plain stats. */}
          <div className="jh-stat jh-stat--readonly" title="Distinct job IDs in the loaded history">
            <span className="jh-stat__value">{summary.jobs}</span>
            <span className="jh-stat__label">Jobs</span>
          </div>
          <div className="jh-stat jh-stat--readonly" title="Total execution runs loaded from the instance">
            <span className="jh-stat__value">{summary.total}</span>
            <span className="jh-stat__label">Executions</span>
          </div>
        </div>

        <div className="jh-toolbar">
          <div className="jh-search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search job, execution, status, error message…"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.currentTarget.value)} aria-label="Status">
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select value={jobFilter} onChange={(e) => setJobFilter(e.currentTarget.value)} aria-label="Job">
            <option value="">All jobs</option>
            {jobIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <div className="jh-presets" role="group" aria-label="Time range presets">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`jh-preset${timePreset === p.key ? ' jh-preset--active' : ''}`}
                onClick={() => applyTimePreset(p)}
                title={`Show executions started within the ${p.label.toLowerCase()}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFromManual(e.currentTarget.value)}
            aria-label="Start from"
            title="Custom start (from)"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setToManual(e.currentTarget.value)}
            aria-label="Start to"
            title="Custom start (to)"
          />

          {/* Second row within the same toolbar container: toggle + Clear on the
              left, Export on the right. flex-basis:100% forces it onto its own line. */}
          <div className="jh-toolbar__row2">
            <label
              className="jh-toggle"
              title="System (sfcc-*) jobs are platform housekeeping you usually can't act on"
            >
              <input
                type="checkbox"
                checked={userVisibleOnly}
                onChange={(e) => setUserVisibleOnly(e.currentTarget.checked)}
              />
              <span>Hide system jobs</span>
            </label>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear
            </button>
            {/* Export acts on exactly what's shown — the current filtered/sorted rows. */}
            <div className="jh-export">
              <span className="jh-export__label">Export {visibleRows.length} shown:</span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={visibleRows.length === 0}
                onClick={() => postMessage({command: 'export', format: 'csv', rows: visibleRows})}
              >
                <Icon name="download" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={visibleRows.length === 0}
                onClick={() => postMessage({command: 'export', format: 'json', rows: visibleRows})}
              >
                <Icon name="download" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="jh-meta" aria-live="polite">
          Showing <strong>{visibleRows.length}</strong> of {summary.total}
          {summary.systemHidden > 0 ? ` · ${summary.systemHidden} system runs hidden` : ''}
        </div>

        {visibleRows.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No executions match the current filters"
            hint={
              summary.systemHidden > 0
                ? 'All matching runs are system jobs. Uncheck "Hide system jobs" to include them.'
                : 'Adjust the filters above, or run a job to populate history.'
            }
          />
        ) : (
          <div className="jh-table-wrap">
            <table className="jh-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('jobId')}>
                    Job ID <span className="jh-sort">{sortIndicator('jobId')}</span>
                  </th>
                  <th onClick={() => toggleSort('status')}>
                    Status <span className="jh-sort">{sortIndicator('status')}</span>
                  </th>
                  <th onClick={() => toggleSort('startMs')}>
                    Started <span className="jh-sort">{sortIndicator('startMs')}</span>
                  </th>
                  <th onClick={() => toggleSort('durationMs')}>
                    Duration <span className="jh-sort">{sortIndicator('durationMs')}</span>
                  </th>
                  <th>Message</th>
                  <th className="jh-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={`${r.jobId}:${r.executionId}`} className={r.status === 'failed' ? 'jh-row--failed' : ''}>
                    <td>
                      <span className="jh-jobid" title={r.jobId}>
                        {r.jobId}
                      </span>
                    </td>
                    <td>
                      <span className={`jh-badge jh-badge--${r.status}`}>{r.status}</span>
                    </td>
                    <td className="jh-num" title={r.start}>
                      {r.start}
                    </td>
                    <td className="jh-num">{r.duration}</td>
                    <td className="jh-message" title={r.message}>
                      {r.message || '—'}
                    </td>
                    <td className="jh-actions">
                      <button
                        type="button"
                        className="jh-action jh-action--log"
                        disabled={!r.hasLog}
                        title={
                          r.hasLog
                            ? 'Open the execution log (opens beside this table)'
                            : 'No log file for this execution (common for system jobs)'
                        }
                        onClick={() => postMessage({command: 'openLog', jobId: r.jobId, executionId: r.executionId})}
                      >
                        <Icon name="output" />
                        <span>Log</span>
                      </button>
                      <button
                        type="button"
                        className="jh-action jh-action--rerun"
                        disabled={r.isSystem}
                        title={r.isSystem ? systemRerunReason(r.jobId) : `Re-run ${r.jobId}`}
                        onClick={() => postMessage({command: 'rerun', jobId: r.jobId})}
                      >
                        <Icon name="debug-restart" />
                        <span>Re-run</span>
                      </button>
                      <button
                        type="button"
                        className="jh-action jh-action--details"
                        title="View execution details JSON (opens beside this table)"
                        onClick={() =>
                          postMessage({command: 'viewDetails', jobId: r.jobId, executionId: r.executionId})
                        }
                      >
                        <Icon name="info" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
