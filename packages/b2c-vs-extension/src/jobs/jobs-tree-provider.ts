/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {searchJobExecutions, type JobExecution} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {showThrottledError} from '../notify.js';

export type JobsTreeNode = JobTreeItem | JobExecutionTreeItem | JobStepTreeItem;

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

function getJobsPollingIntervalMs(): number {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<number>('jobs.refreshInterval', DEFAULT_POLLING_INTERVAL_SECONDS);
  const bounded = Math.min(MAX_POLLING_INTERVAL_SECONDS, Math.max(MIN_POLLING_INTERVAL_SECONDS, configured));
  return bounded * 1000;
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

function formatJobsFetchError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();

  if (lowered.includes('fetch failed') || lowered.includes('network') || lowered.includes('enotfound')) {
    return 'Unable to fetch jobs from the configured instance. Verify dw.json host, network/VPN access, and OAuth credentials.';
  }

  if (lowered.includes('forbidden') || lowered.includes('unauthorized') || lowered.includes('access denied')) {
    return 'Unable to fetch jobs due to missing OCAPI scopes. Ensure API client access to /job_execution_search and /jobs/*/executions*.';
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

function normalizeExecutionStatus(execution: JobExecution): 'running' | 'failed' | 'completed' | 'scheduled' {
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

    this.command = {
      command: 'b2c-dx.jobs.viewExecutionDetails',
      title: 'View Execution Details',
      arguments: [this],
    };
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

export class JobsTreeDataProvider implements vscode.TreeDataProvider<JobsTreeNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<JobsTreeNode | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private jobCache: Map<string, JobExecution> | undefined;
  private executionCache = new Map<string, JobExecution[]>();
  private pollingTimer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly configProvider: B2CExtensionConfig) {}

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
    this.executionCache.clear();
    this.onDidChangeTreeDataEmitter.fire();
  }

  async getDiscoveredJobIds(): Promise<string[]> {
    const nodes = await this.getJobNodes();
    return nodes.map((node) => node.jobId);
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

  private async getJobNodes(): Promise<JobTreeItem[]> {
    const instance = this.configProvider.getInstance();
    if (!instance) return [];

    if (!this.jobCache) {
      try {
        const grouped = new Map<string, JobExecution>();
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
      } catch (error) {
        showThrottledError(`Jobs: ${formatJobsFetchError(error)}`, 'jobs:root');
        return [];
      }
    }

    return [...this.jobCache.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jobId, latestExecution]) => new JobTreeItem(jobId, latestExecution));
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

    return executions.map((execution) => new JobExecutionTreeItem(jobId, execution));
  }

  private getStepNodes(executionNode: JobExecutionTreeItem): JobStepTreeItem[] {
    const steps = executionNode.execution.step_executions ?? [];
    const executionId = executionNode.execution.id ?? 'unknown';

    return steps.map((step) => new JobStepTreeItem(executionNode.jobId, executionId, step));
  }
}
