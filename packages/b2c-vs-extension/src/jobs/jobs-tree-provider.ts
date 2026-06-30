/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {searchJobExecutions, type JobExecution} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {showThrottledError} from '../notify.js';

export type JobStatusFilter = 'all' | 'active' | 'running' | 'scheduled' | 'failed' | 'completed';
type ExecutionStatus = 'running' | 'failed' | 'completed' | 'scheduled';

/**
 * Default = `chronological` (BM-style timeline). `groupByJobId` collapses
 * executions under their parent job. The grouping toggle is the only switch
 * between these two views; the underlying data fetch is identical.
 */
export type JobGroupingMode = 'chronological' | 'groupByJobId';

export interface JobHistoryFilters {
  jobIdContains: string;
  executedBy: string;
  startFrom: string;
  endTo: string;
}

export interface JobHistoryExecutionRow {
  jobId: string;
  status: 'running' | 'failed' | 'completed' | 'scheduled';
  execution: JobExecution;
}

export type JobsTreeNode = JobTreeItem | JobExecutionTreeItem | JobsEmptyStateTreeItem | JobsLoadHintTreeItem;

const JOBS_FETCH_LIMIT = 200;
const DEFAULT_DISCOVERY_SCAN_LIMIT = 2000;
const MIN_DISCOVERY_SCAN_LIMIT = 200;
const MAX_DISCOVERY_SCAN_LIMIT = 5000;
const DEFAULT_POLLING_INTERVAL_SECONDS = 30;
const MIN_POLLING_INTERVAL_SECONDS = 5;
const MAX_POLLING_INTERVAL_SECONDS = 300;
const DEFAULT_STATUS_FILTER: JobStatusFilter = 'all';
const EMPTY_HISTORY_FILTERS: JobHistoryFilters = {
  jobIdContains: '',
  executedBy: '',
  startFrom: '',
  endTo: '',
};

const STATUS_FILTER_OPTIONS: JobStatusFilter[] = ['all', 'active', 'running', 'scheduled', 'failed', 'completed'];

function getJobsPollingIntervalMs(): number {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<number>('jobs.refreshInterval', DEFAULT_POLLING_INTERVAL_SECONDS);
  const bounded = Math.min(MAX_POLLING_INTERVAL_SECONDS, Math.max(MIN_POLLING_INTERVAL_SECONDS, configured));
  return bounded * 1000;
}

function normalizeHistoryFilters(filters: Partial<JobHistoryFilters>): JobHistoryFilters {
  return {
    jobIdContains: filters.jobIdContains?.trim() ?? '',
    executedBy: filters.executedBy?.trim() ?? '',
    startFrom: filters.startFrom?.trim() ?? '',
    endTo: filters.endTo?.trim() ?? '',
  };
}

function hasHistoryFilters(filters: JobHistoryFilters): boolean {
  return Boolean(filters.jobIdContains || filters.executedBy || filters.startFrom || filters.endTo);
}

function parseTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getExecutionUsers(execution: JobExecution): string[] {
  const record = execution as Record<string, unknown>;
  return [record.created_by, record.executed_by, record.triggered_by]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
}

function matchesHistoryFilters(jobId: string, execution: JobExecution, filters: JobHistoryFilters): boolean {
  if (filters.jobIdContains && !jobId.toLowerCase().includes(filters.jobIdContains.toLowerCase())) {
    return false;
  }

  if (filters.executedBy) {
    const users = getExecutionUsers(execution);
    const needle = filters.executedBy.toLowerCase();
    if (!users.some((user) => user.toLowerCase().includes(needle))) {
      return false;
    }
  }

  if (filters.startFrom) {
    const fromMs = parseTimestamp(filters.startFrom);
    const startMs = parseTimestamp(execution.start_time);
    if (fromMs !== undefined && (startMs === undefined || startMs < fromMs)) {
      return false;
    }
  }

  if (filters.endTo) {
    const toMs = parseTimestamp(filters.endTo);
    const endMs = parseTimestamp(execution.end_time);
    if (toMs !== undefined && (endMs === undefined || endMs > toMs)) {
      return false;
    }
  }

  return true;
}

function matchesStatusFilter(status: ExecutionStatus, filter: JobStatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return status === 'running' || status === 'scheduled';
  return status === filter;
}

function statusFilterLabel(filter: JobStatusFilter): string {
  if (filter === 'all') return 'All';
  if (filter === 'active') return 'Active';
  if (filter === 'running') return 'Running';
  if (filter === 'scheduled') return 'Scheduled';
  if (filter === 'failed') return 'Failed';
  return 'Completed';
}

function emptyStateTitle(filter: JobStatusFilter): string {
  if (filter === 'active') return 'No jobs running';
  if (filter === 'running') return 'No jobs running';
  if (filter === 'scheduled') return 'No scheduled jobs';
  if (filter === 'failed') return 'No failed jobs';
  if (filter === 'completed') return 'No completed jobs';
  return 'No jobs found';
}

function emptyStateDescription(filter: JobStatusFilter, filtersApplied: boolean): string {
  if (filtersApplied) return 'Adjust or clear filters to see more.';
  if (filter === 'all') return 'Run a job to populate history.';
  return 'Change the status filter to see other entries.';
}

function getJobDiscoveryScanLimit(): number {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<number>('jobs.discoveryExecutionScanLimit', DEFAULT_DISCOVERY_SCAN_LIMIT);
  return Math.min(MAX_DISCOVERY_SCAN_LIMIT, Math.max(MIN_DISCOVERY_SCAN_LIMIT, configured));
}

function getDefaultJobsStatusFilter(): JobStatusFilter {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<string>('jobs.defaultStatusFilter', DEFAULT_STATUS_FILTER)
    .toLowerCase();

  if (STATUS_FILTER_OPTIONS.includes(configured as JobStatusFilter)) {
    return configured as JobStatusFilter;
  }

  return DEFAULT_STATUS_FILTER;
}

const GROUPING_MODE_OPTIONS: JobGroupingMode[] = ['chronological', 'groupByJobId'];
const DEFAULT_GROUPING_MODE: JobGroupingMode = 'chronological';

function getDefaultGroupingMode(): JobGroupingMode {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<string>('jobs.defaultGrouping', DEFAULT_GROUPING_MODE);
  return GROUPING_MODE_OPTIONS.includes(configured as JobGroupingMode)
    ? (configured as JobGroupingMode)
    : DEFAULT_GROUPING_MODE;
}

function formatJobsFetchError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();

  if (
    lowered.includes('forbidden') ||
    lowered.includes('unauthorized') ||
    lowered.includes('access denied') ||
    lowered.includes('http 401') ||
    lowered.includes('http 403')
  ) {
    return 'Unable to fetch jobs due to missing OCAPI scopes or client permissions. Ensure API client access to /job_execution_search and /jobs/*/executions*.';
  }

  if (
    lowered.includes('fetch failed') ||
    lowered.includes('network') ||
    lowered.includes('enotfound') ||
    lowered.includes('econnrefused') ||
    lowered.includes('econnreset') ||
    lowered.includes('certificate') ||
    lowered.includes('self-signed')
  ) {
    return `Unable to fetch jobs from the configured instance. Verify dw.json host, network/VPN access, TLS settings (selfsigned), and OAuth credentials. Details: ${message}`;
  }

  return message;
}

function formatDateTime(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDuration(durationMs: number | undefined): string {
  if (durationMs === undefined || durationMs < 0) return '—';
  if (durationMs < 1000) return `${durationMs}ms`;

  const totalSeconds = Math.floor(durationMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function normalizeExecutionStatus(execution: JobExecution): ExecutionStatus {
  const raw = (execution.execution_status ?? '').toLowerCase();
  // Active states.
  if (raw === 'running' || raw === 'pausing' || raw === 'resuming' || raw === 'restarting' || raw === 'retrying') {
    return 'running';
  }
  if (raw === 'pending') return 'scheduled';
  if (raw === 'aborted' || raw === 'aborting') return 'failed';

  // Terminal: a run is "completed" ONLY on a clean OK exit. Anything else that
  // isn't actively running is a failure — including invalid jobs, which finish
  // with no exit code but a non-OK top-level `status` (e.g. "invalid"). Treating
  // the fall-through as "completed" previously made invalid/failed runs look green.
  const exitCode = (execution.exit_status?.code ?? '').toUpperCase();
  if (exitCode === 'OK') return 'completed';
  if (exitCode === 'ERROR') return 'failed';

  // No exit code yet (e.g. just started, or invalid). If it's still finishing,
  // show running; otherwise the top-level status decides — OK ⇒ completed, else failed.
  const topStatus = ((execution as Record<string, unknown>).status as string | undefined)?.toUpperCase() ?? '';
  if (topStatus === 'OK') return 'completed';
  if (raw === 'finished' || topStatus) return 'failed';
  return 'completed';
}

function jobStatusIcon(status: 'running' | 'failed' | 'completed' | 'scheduled'): vscode.ThemeIcon {
  if (status === 'running') return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.yellow'));
  if (status === 'failed') return new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
  if (status === 'scheduled') return new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.foreground'));
  return new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
}

function buildExecutionTooltip(execution: JobExecution): vscode.MarkdownString {
  const lines: string[] = [
    `Execution: ${execution.id ?? 'unknown'}`,
    `Status: ${normalizeExecutionStatus(execution)}`,
    `Started: ${formatDateTime(execution.start_time)}`,
    `Duration: ${formatDuration(execution.duration)}`,
  ];
  if (execution.end_time) lines.push(`Ended: ${formatDateTime(execution.end_time)}`);
  if (execution.exit_status?.code) lines.push(`Exit: ${execution.exit_status.code}`);
  if (execution.exit_status?.message) lines.push(`Message: ${execution.exit_status.message}`);
  return new vscode.MarkdownString(lines.join('\n\n'));
}

/**
 * Job-id parent shown in groupByJobId mode. Holds one or more
 * JobExecutionTreeItem children. The label is the job id; description shows
 * the run count and the latest run's status so the row is informative even
 * collapsed.
 */
export class JobTreeItem extends vscode.TreeItem {
  readonly nodeType = 'job' as const;

  constructor(
    readonly jobId: string,
    readonly executions: JobExecution[],
  ) {
    super(jobId, vscode.TreeItemCollapsibleState.Collapsed);

    const latest = executions[0];
    const latestStatus = latest ? normalizeExecutionStatus(latest) : 'completed';
    const runCount = executions.length;

    this.id = `job:${jobId}`;
    this.contextValue = `job-${latestStatus}`;
    this.iconPath = jobStatusIcon(latestStatus);
    this.description = `${runCount} run${runCount === 1 ? '' : 's'} · last: ${latestStatus}`;
    this.tooltip = new vscode.MarkdownString(
      `Job: ${jobId}\n\nRuns shown: ${runCount}\n\nLatest run: ${latestStatus} · ${formatDateTime(latest?.start_time)}`,
    );
  }
}

export class JobExecutionTreeItem extends vscode.TreeItem {
  readonly nodeType = 'execution' as const;

  constructor(
    readonly jobId: string,
    readonly execution: JobExecution,
    /**
     * When true (the default, used by the chronological view) the row label is
     * the job id so users can scan the timeline by job. Under a JobTreeItem
     * grouping parent the parent already shows the job id, so callers pass
     * `false` to surface the start timestamp as the label instead.
     */
    showJobIdAsLabel = true,
  ) {
    const executionId = execution.id ?? 'unknown';
    const status = normalizeExecutionStatus(execution);
    const label = showJobIdAsLabel ? jobId : (formatDateTime(execution.start_time) ?? executionId);
    // Leaf — step-level drill-down lives in **View Execution Details** and the
    // BM deep-link, so giving each execution a chevron would just open into
    // nothing. The collapsible affordance now only appears on grouping parents
    // (JobTreeItem) where it actually represents children.
    super(label, vscode.TreeItemCollapsibleState.None);

    this.id = `execution:${jobId}:${executionId}`;
    this.contextValue = `jobExecution-${status}`;
    this.iconPath = jobStatusIcon(status);
    this.description = showJobIdAsLabel
      ? `${status} · ${formatDateTime(execution.start_time)} · ${formatDuration(execution.duration)}`
      : `${status} · ${formatDuration(execution.duration)}`;
    this.tooltip = buildExecutionTooltip(execution);
  }
}

export class JobsEmptyStateTreeItem extends vscode.TreeItem {
  readonly nodeType = 'emptyState' as const;

  constructor(filter: JobStatusFilter, filtersApplied: boolean) {
    super(emptyStateTitle(filter), vscode.TreeItemCollapsibleState.None);
    this.id = `jobs-empty-state:${filter}`;
    this.contextValue = 'jobs-empty-state';
    this.iconPath = new vscode.ThemeIcon('info');
    this.description = filtersApplied
      ? `${emptyStateDescription(filter, filtersApplied)} (filters active)`
      : emptyStateDescription(filter, filtersApplied);
    this.tooltip = new vscode.MarkdownString(
      `No job history entries match **${statusFilterLabel(filter)}** right now.\n\nUse the title-bar actions to change the status filter or clear name/advanced filters.`,
    );
  }
}

/** Shown before the user has explicitly loaded job history (or after a config reset). */
export class JobsLoadHintTreeItem extends vscode.TreeItem {
  readonly nodeType = 'loadHint' as const;

  constructor() {
    super('Load job history', vscode.TreeItemCollapsibleState.None);
    this.id = 'jobs-load-hint';
    this.contextValue = 'jobs-load-hint';
    this.iconPath = new vscode.ThemeIcon('cloud-download');
    this.description = 'Click to fetch from the configured instance';
    this.tooltip = new vscode.MarkdownString(
      'Job History is not loaded by default to avoid unwanted OCAPI traffic.\n\nClick to load, or enable **Auto-Refresh** in the title bar to load automatically and refresh on a schedule.',
    );
    this.command = {
      command: 'b2c-dx.jobs.refresh',
      title: 'Load Job History',
    };
  }
}

export class JobsTreeDataProvider implements vscode.TreeDataProvider<JobsTreeNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<JobsTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  /**
   * Fires the moment a fetch settles (success or failure), so subscribers can
   * update derived UI immediately. Without this the title-bar timestamp would
   * stay stale for up to the next 5s timer tick, making "Updated —" linger
   * after the data already arrived.
   */
  private readonly onDidLoadEmitter = new vscode.EventEmitter<void>();
  readonly onDidLoad = this.onDidLoadEmitter.event;

  private discoveryExecutionCache: JobExecution[] | undefined;
  private pollingTimer: ReturnType<typeof setInterval> | undefined;
  private statusFilter: JobStatusFilter;
  private groupingMode: JobGroupingMode;
  private historyFilters: JobHistoryFilters = EMPTY_HISTORY_FILTERS;
  private lastSuccessfulRefreshAt: Date | undefined;
  /** Whether the user has explicitly loaded the view at least once. */
  private loadedOnce = false;

  constructor(private readonly configProvider: B2CExtensionConfig) {
    this.statusFilter = getDefaultJobsStatusFilter();
    this.groupingMode = getDefaultGroupingMode();
    this.updateStatusFilterContext();
    this.updateGroupingModeContext();
  }

  getStatusFilter(): JobStatusFilter {
    return this.statusFilter;
  }

  getHistoryFilters(): JobHistoryFilters {
    return {...this.historyFilters};
  }

  setHistoryFilters(filters: Partial<JobHistoryFilters>): void {
    const normalized = normalizeHistoryFilters(filters);
    const unchanged =
      this.historyFilters.jobIdContains === normalized.jobIdContains &&
      this.historyFilters.executedBy === normalized.executedBy &&
      this.historyFilters.startFrom === normalized.startFrom &&
      this.historyFilters.endTo === normalized.endTo;
    if (unchanged) return;

    this.historyFilters = normalized;
    this.onDidChangeTreeDataEmitter.fire();
  }

  clearHistoryFilters(): void {
    this.setHistoryFilters(EMPTY_HISTORY_FILTERS);
  }

  hasHistoryFilters(): boolean {
    return hasHistoryFilters(this.historyFilters);
  }

  getLastSuccessfulRefreshAt(): Date | undefined {
    return this.lastSuccessfulRefreshAt;
  }

  isLoaded(): boolean {
    return this.loadedOnce;
  }

  isPollingEnabled(): boolean {
    return Boolean(this.pollingTimer);
  }

  getPollingIntervalSeconds(): number {
    return Math.round(getJobsPollingIntervalMs() / 1000);
  }

  setStatusFilter(filter: JobStatusFilter): void {
    if (this.statusFilter === filter) return;
    this.statusFilter = filter;
    this.updateStatusFilterContext();
    this.onDidChangeTreeDataEmitter.fire();
  }

  getGroupingMode(): JobGroupingMode {
    return this.groupingMode;
  }

  /**
   * Flips between the BM-style timeline and the by-job grouped view. Cycling
   * is a one-shot mutation that re-renders the tree without re-fetching — the
   * underlying executions list is the same in both modes.
   */
  toggleGroupingMode(): JobGroupingMode {
    this.groupingMode = this.groupingMode === 'chronological' ? 'groupByJobId' : 'chronological';
    this.updateGroupingModeContext();
    this.onDidChangeTreeDataEmitter.fire();
    return this.groupingMode;
  }

  getTreeItem(element: JobsTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: JobsTreeNode): Promise<JobsTreeNode[]> {
    if (!element) return this.getRootNodes();
    if (element instanceof JobTreeItem) {
      // Grouped view: each child execution renders as a leaf labeled by its
      // start timestamp — the job id is already on the parent row.
      return element.executions.map((execution) => new JobExecutionTreeItem(element.jobId, execution, false));
    }
    // Executions are leaves; step-level drill-down lives in **View Execution
    // Details** (and the BM deep-link).
    return [];
  }

  /**
   * Marks the view as loaded and re-fetches. Called from the explicit Refresh action
   * (and by the polling timer when auto-refresh is on).
   */
  refresh(): void {
    this.loadedOnce = true;
    this.discoveryExecutionCache = undefined;
    this.onDidChangeTreeDataEmitter.fire();
  }

  /** Soft refresh: re-renders the tree without dropping caches (e.g. filter changes). */
  rerender(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  /** Reset to the unloaded state — used on config reset (e.g. instance switch). */
  resetLoaded(): void {
    this.loadedOnce = false;
    this.discoveryExecutionCache = undefined;
    this.onDidChangeTreeDataEmitter.fire();
  }

  async getDiscoveredJobIds(): Promise<string[]> {
    if (!this.loadedOnce) return [];
    await this.loadJobs();
    const ids = new Set<string>();
    for (const execution of this.discoveryExecutionCache ?? []) {
      if (execution.job_id) ids.add(execution.job_id);
    }
    return [...ids].sort((a, b) => a.localeCompare(b));
  }

  startPolling(): void {
    if (this.pollingTimer) return;

    const intervalMs = getJobsPollingIntervalMs();
    this.pollingTimer = setInterval(() => {
      this.refresh();
    }, intervalMs);
  }

  stopPolling(): void {
    if (!this.pollingTimer) return;
    clearInterval(this.pollingTimer);
    this.pollingTimer = undefined;
  }

  async getFilteredExecutionHistoryRows(): Promise<JobHistoryExecutionRow[]> {
    if (!this.loadedOnce) return [];
    await this.loadJobs();
    const executions = this.discoveryExecutionCache ?? [];

    return executions
      .map((execution) => {
        const jobId = execution.job_id;
        if (!jobId) return undefined;
        const status = normalizeExecutionStatus(execution);
        return {jobId, status, execution};
      })
      .filter((row): row is JobHistoryExecutionRow => Boolean(row))
      .filter(
        (row) =>
          matchesStatusFilter(row.status, this.statusFilter) &&
          matchesHistoryFilters(row.jobId, row.execution, this.historyFilters),
      );
  }

  async getAllExecutionHistoryRows(): Promise<JobHistoryExecutionRow[]> {
    if (!this.loadedOnce) return [];
    await this.loadJobs();
    const executions = this.discoveryExecutionCache ?? [];

    return executions
      .map((execution) => {
        const jobId = execution.job_id;
        if (!jobId) return undefined;
        const status = normalizeExecutionStatus(execution);
        return {jobId, status, execution};
      })
      .filter((row): row is JobHistoryExecutionRow => Boolean(row));
  }

  private updateStatusFilterContext(): void {
    void vscode.commands.executeCommand('setContext', 'b2c-dx.jobs.statusFilter', this.statusFilter);
  }

  /**
   * Mirrors the grouping mode into VS Code context so package.json can swap the
   * title-bar icon between `list-flat` (timeline) and `list-tree` (grouped).
   */
  private updateGroupingModeContext(): void {
    void vscode.commands.executeCommand('setContext', 'b2c-dx.jobs.groupingMode', this.groupingMode);
  }

  private async getRootNodes(): Promise<JobsTreeNode[]> {
    const instance = this.configProvider.getInstance();
    if (!instance) return [];

    if (!this.loadedOnce) {
      return [new JobsLoadHintTreeItem()];
    }

    await this.loadJobs();
    if (!this.discoveryExecutionCache) return [];

    const executions = this.discoveryExecutionCache;
    const rows = executions
      .map((execution) => {
        const jobId = execution.job_id;
        if (!jobId) return undefined;
        return {jobId, status: normalizeExecutionStatus(execution), execution};
      })
      .filter((row): row is JobHistoryExecutionRow => Boolean(row))
      .filter(
        (row) =>
          matchesStatusFilter(row.status, this.statusFilter) &&
          matchesHistoryFilters(row.jobId, row.execution, this.historyFilters),
      );

    if (rows.length === 0) {
      return [new JobsEmptyStateTreeItem(this.statusFilter, this.hasHistoryFilters())];
    }

    if (this.groupingMode === 'groupByJobId') {
      // Bucket executions per job, preserving the SDK's start_time-desc order
      // inside each bucket. Jobs are then sorted by their most-recent run so the
      // currently-active / most-recently-touched jobs float to the top — the
      // same order BM's Job Definitions sidebar uses.
      const byJob = new Map<string, JobExecution[]>();
      for (const row of rows) {
        const existing = byJob.get(row.jobId);
        if (existing) existing.push(row.execution);
        else byJob.set(row.jobId, [row.execution]);
      }

      const groupNodes = [...byJob.entries()]
        .sort(([, aRuns], [, bRuns]) => {
          const aLatest = parseTimestamp(aRuns[0]?.start_time) ?? 0;
          const bLatest = parseTimestamp(bRuns[0]?.start_time) ?? 0;
          return bLatest - aLatest;
        })
        .map(([jobId, runs]) => new JobTreeItem(jobId, runs));

      return groupNodes;
    }

    // Chronological view: SDK already returns by start_time desc; preserve that order.
    return rows.map((row) => new JobExecutionTreeItem(row.jobId, row.execution));
  }

  /** Single fetch path used by both root rendering and lookup APIs. */
  private async loadJobs(): Promise<void> {
    const instance = this.configProvider.getInstance();
    if (!instance) return;
    if (this.discoveryExecutionCache) return;

    try {
      const discoveredExecutions: JobExecution[] = [];
      const scanLimit = getJobDiscoveryScanLimit();
      let start = 0;

      while (start < scanLimit) {
        const count = Math.min(JOBS_FETCH_LIMIT, scanLimit - start);
        const result = await searchJobExecutions(instance, {
          count,
          start,
          sortBy: 'start_time',
          sortOrder: 'desc',
        });

        for (const execution of result.hits) {
          discoveredExecutions.push(execution);
        }

        const fetchedCount = result.hits.length;
        if (fetchedCount === 0) break;

        start += fetchedCount;
        if (start >= result.total) break;
      }

      this.discoveryExecutionCache = discoveredExecutions;
      this.lastSuccessfulRefreshAt = new Date();
    } catch (error) {
      showThrottledError(`Jobs: ${formatJobsFetchError(error)}`, 'jobs:root');
    } finally {
      // Notify the index.ts message updater that the fetch settled — it
      // re-renders "Updated <time>" immediately instead of waiting for the
      // next 5s tick of the title-bar interval.
      this.onDidLoadEmitter.fire();
    }
  }
}
