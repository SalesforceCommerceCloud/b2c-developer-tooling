/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {searchJobExecutions, type JobExecution} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {showThrottledError} from '../notify.js';

export type JobStatusFilter = 'active' | 'all' | 'running' | 'scheduled' | 'failed' | 'completed';
type ExecutionStatus = 'running' | 'failed' | 'completed' | 'scheduled';

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

export type JobsTreeNode = JobTreeItem | JobExecutionTreeItem | JobStepTreeItem | JobsEmptyStateTreeItem;

const JOBS_FETCH_LIMIT = 200;
const DEFAULT_DISCOVERY_SCAN_LIMIT = 2000;
const MIN_DISCOVERY_SCAN_LIMIT = 200;
const MAX_DISCOVERY_SCAN_LIMIT = 5000;
const DEFAULT_EXECUTION_HISTORY_LIMIT = 25;
const MIN_EXECUTION_HISTORY_LIMIT = 5;
const MAX_EXECUTION_HISTORY_LIMIT = 200;
const DEFAULT_POLLING_INTERVAL_SECONDS = 30;
const MIN_POLLING_INTERVAL_SECONDS = 5;
const MAX_POLLING_INTERVAL_SECONDS = 300;
const DEFAULT_STATUS_FILTER: JobStatusFilter = 'active';
const EMPTY_HISTORY_FILTERS: JobHistoryFilters = {
  jobIdContains: '',
  executedBy: '',
  startFrom: '',
  endTo: '',
};

const STATUS_FILTER_OPTIONS: JobStatusFilter[] = ['active', 'all', 'running', 'scheduled', 'failed', 'completed'];

const ALL_FILTER_STATUS_PRIORITY: Record<ExecutionStatus, number> = {
  running: 0,
  scheduled: 1,
  failed: 2,
  completed: 3,
};

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
  if (filter === 'active') return 'No active jobs right now';
  if (filter === 'running') return 'No actively running jobs';
  if (filter === 'scheduled') return 'No scheduled jobs right now';
  if (filter === 'failed') return 'No failed jobs in the current window';
  if (filter === 'completed') return 'No completed jobs in the current window';
  return 'No discovered jobs yet';
}

function emptyStateDescription(filter: JobStatusFilter): string {
  if (filter === 'all') {
    return 'No execution history yet. Run a job in Business Manager or use Run Job, then refresh.';
  }

  return `Current history filter: ${statusFilterLabel(filter)}. Use Filters or a quick preset to adjust.`;
}

function getJobDiscoveryScanLimit(): number {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<number>('jobs.discoveryExecutionScanLimit', DEFAULT_DISCOVERY_SCAN_LIMIT);
  return Math.min(MAX_DISCOVERY_SCAN_LIMIT, Math.max(MIN_DISCOVERY_SCAN_LIMIT, configured));
}

function getExecutionHistoryLimit(): number {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<number>('jobs.historyLimit', DEFAULT_EXECUTION_HISTORY_LIMIT);
  return Math.min(MAX_EXECUTION_HISTORY_LIMIT, Math.max(MIN_EXECUTION_HISTORY_LIMIT, configured));
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
  if (raw === 'running') return 'running';
  if (raw === 'pending') return 'scheduled';
  if (raw === 'aborted') return 'failed';

  const exitCode = (execution.exit_status?.code ?? '').toUpperCase();
  if (exitCode === 'ERROR') return 'failed';
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

export class JobTreeItem extends vscode.TreeItem {
  readonly nodeType = 'job' as const;

  constructor(
    readonly jobId: string,
    readonly latestExecution: JobExecution,
  ) {
    super(jobId, vscode.TreeItemCollapsibleState.Collapsed);
    const status = normalizeExecutionStatus(latestExecution);

    this.id = `job:${jobId}`;
    this.contextValue = `job-${status}`;
    this.iconPath = jobStatusIcon(status);
    this.description = `${status} · last ${formatDateTime(latestExecution.start_time)} · ${formatDuration(latestExecution.duration)}`;

    const lines: string[] = [
      `Job: ${jobId}`,
      `Status: ${status}`,
      `Last execution: ${latestExecution.id ?? 'unknown'}`,
      `Last started: ${formatDateTime(latestExecution.start_time)}`,
      `Last duration: ${formatDuration(latestExecution.duration)}`,
    ];

    if (latestExecution.exit_status?.message) {
      lines.push(`Last message: ${latestExecution.exit_status.message}`);
    }

    this.tooltip = new vscode.MarkdownString(lines.join('\n\n'));
  }
}

export class JobExecutionTreeItem extends vscode.TreeItem {
  readonly nodeType = 'execution' as const;

  constructor(
    readonly jobId: string,
    readonly execution: JobExecution,
  ) {
    const executionId = execution.id ?? 'unknown';
    const status = normalizeExecutionStatus(execution);
    super(executionId, vscode.TreeItemCollapsibleState.Collapsed);

    this.id = `execution:${jobId}:${executionId}`;
    this.contextValue = `jobExecution-${status}`;
    this.iconPath = jobStatusIcon(status);
    this.description = `${status} · ${formatDateTime(execution.start_time)} · ${formatDuration(execution.duration)}`;
    this.tooltip = buildExecutionTooltip(execution);
  }
}

export class JobStepTreeItem extends vscode.TreeItem {
  readonly nodeType = 'step' as const;

  constructor(
    readonly jobId: string,
    readonly executionId: string,
    readonly step: NonNullable<JobExecution['step_executions']>[number],
  ) {
    const stepId = step.step_id ?? 'step';
    const status = (step.exit_status?.code ?? 'UNKNOWN').toUpperCase();
    super(stepId, vscode.TreeItemCollapsibleState.None);

    const failed = status === 'ERROR';
    this.id = `step:${jobId}:${executionId}:${stepId}`;
    this.contextValue = failed ? 'jobStep-failed' : 'jobStep';
    this.iconPath = failed
      ? new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'))
      : new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed'));
    this.description = `${status} · ${formatDuration(step.duration)}`;

    const lines: string[] = [`Step: ${stepId}`, `Status: ${status}`, `Duration: ${formatDuration(step.duration)}`];
    if (step.exit_status?.message) lines.push(`Message: ${step.exit_status.message}`);
    this.tooltip = new vscode.MarkdownString(lines.join('\n\n'));
  }
}

export class JobsEmptyStateTreeItem extends vscode.TreeItem {
  readonly nodeType = 'emptyState' as const;

  constructor(filter: JobStatusFilter, filtersApplied: boolean) {
    super(emptyStateTitle(filter), vscode.TreeItemCollapsibleState.None);
    this.id = `jobs-empty-state:${filter}`;
    this.contextValue = 'jobs-empty-state';
    this.iconPath = new vscode.ThemeIcon('filter');
    this.description = filtersApplied
      ? `${emptyStateDescription(filter)} Additional filters are active.`
      : emptyStateDescription(filter);
    this.tooltip = new vscode.MarkdownString(
      `No job history entries match **${statusFilterLabel(filter)}** right now.\n\nUse **Filters** (funnel action in the Job History view title bar) to adjust status, presets, or advanced filters.`,
    );
  }
}

export class JobsTreeDataProvider implements vscode.TreeDataProvider<JobsTreeNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<JobsTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private jobCache: Map<string, JobExecution> | undefined;
  private discoveryExecutionCache: JobExecution[] | undefined;
  private executionCache = new Map<string, JobExecution[]>();
  private pollingTimer: ReturnType<typeof setInterval> | undefined;
  private statusFilter: JobStatusFilter;
  private historyFilters: JobHistoryFilters = EMPTY_HISTORY_FILTERS;
  private lastSuccessfulRefreshAt: Date | undefined;

  constructor(private readonly configProvider: B2CExtensionConfig) {
    this.statusFilter = getDefaultJobsStatusFilter();
    this.updateStatusFilterContext();
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

  isPollingEnabled(): boolean {
    return Boolean(this.pollingTimer);
  }

  getPollingIntervalSeconds(): number {
    return Math.round(getJobsPollingIntervalMs() / 1000);
  }

  async getFilteredExecutionHistoryRows(): Promise<JobHistoryExecutionRow[]> {
    await this.getJobNodes(true);
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

  setStatusFilter(filter: JobStatusFilter): void {
    if (this.statusFilter === filter) return;
    this.statusFilter = filter;
    this.updateStatusFilterContext();
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: JobsTreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: JobsTreeNode): Promise<JobsTreeNode[]> {
    if (!element) return this.getJobNodes();
    if (element instanceof JobTreeItem) return this.getExecutionNodes(element.jobId);
    if (element instanceof JobExecutionTreeItem) return this.getStepNodes(element);
    return [];
  }

  refresh(): void {
    this.jobCache = undefined;
    this.discoveryExecutionCache = undefined;
    this.executionCache.clear();
    this.onDidChangeTreeDataEmitter.fire();
  }

  async getDiscoveredJobIds(): Promise<string[]> {
    const nodes = await this.getJobNodes(true);
    return nodes.filter((node): node is JobTreeItem => node instanceof JobTreeItem).map((node) => node.jobId);
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

  private updateStatusFilterContext(): void {
    void vscode.commands.executeCommand('setContext', 'b2c-dx.jobs.statusFilter', this.statusFilter);
  }

  private async getJobNodes(ignoreFilter = false): Promise<JobsTreeNode[]> {
    const instance = this.configProvider.getInstance();
    if (!instance) return [];

    if (!this.jobCache) {
      try {
        const grouped = new Map<string, JobExecution>();
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
            const jobId = execution.job_id;
            if (!jobId) continue;
            if (!grouped.has(jobId)) grouped.set(jobId, execution);
          }

          const fetchedCount = result.hits.length;
          if (fetchedCount === 0) break;

          start += fetchedCount;
          if (start >= result.total) break;
        }

        this.jobCache = grouped;
        this.discoveryExecutionCache = discoveredExecutions;
        this.lastSuccessfulRefreshAt = new Date();
      } catch (error) {
        showThrottledError(`Jobs: ${formatJobsFetchError(error)}`, 'jobs:root');
        return [];
      }
    }

    const entries = [...this.jobCache.entries()].map(([jobId, latestExecution]) => ({
      jobId,
      latestExecution,
      status: normalizeExecutionStatus(latestExecution),
    }));

    const filteredEntries = ignoreFilter
      ? entries
      : entries.filter(
          (entry) =>
            matchesStatusFilter(entry.status, this.statusFilter) &&
            matchesHistoryFilters(entry.jobId, entry.latestExecution, this.historyFilters),
        );

    if (filteredEntries.length === 0 && !ignoreFilter && entries.length > 0) {
      return [new JobsEmptyStateTreeItem(this.statusFilter, this.hasHistoryFilters())];
    }

    return filteredEntries
      .sort((left, right) => {
        if (this.statusFilter === 'all') {
          const statusDiff = ALL_FILTER_STATUS_PRIORITY[left.status] - ALL_FILTER_STATUS_PRIORITY[right.status];
          if (statusDiff !== 0) return statusDiff;
        }
        return left.jobId.localeCompare(right.jobId);
      })
      .map((entry) => new JobTreeItem(entry.jobId, entry.latestExecution));
  }

  private async getExecutionNodes(jobId: string): Promise<JobExecutionTreeItem[]> {
    const instance = this.configProvider.getInstance();
    if (!instance) return [];

    let executions = this.executionCache.get(jobId);
    if (!executions) {
      try {
        const result = await searchJobExecutions(instance, {
          jobId,
          count: getExecutionHistoryLimit(),
          sortBy: 'start_time',
          sortOrder: 'desc',
        });
        executions = result.hits;
        this.executionCache.set(jobId, executions);
      } catch (error) {
        showThrottledError(`Jobs (${jobId}): ${formatJobsFetchError(error)}`, `jobs:${jobId}`);
        return [];
      }
    }

    return executions
      .filter((execution) => matchesHistoryFilters(jobId, execution, this.historyFilters))
      .map((execution) => new JobExecutionTreeItem(jobId, execution));
  }

  private getStepNodes(executionNode: JobExecutionTreeItem): JobStepTreeItem[] {
    const steps = executionNode.execution.step_executions ?? [];
    const executionId = executionNode.execution.id ?? 'unknown';

    return steps.map((step) => new JobStepTreeItem(executionNode.jobId, executionId, step));
  }
}
