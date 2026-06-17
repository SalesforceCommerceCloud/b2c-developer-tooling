/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  executeJob,
  getJobLog,
  siteArchiveExportToPath,
  siteArchiveImport,
  type ExportDataUnitsConfiguration,
  JobExecutionError,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import JSZip from 'jszip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {openJobLog} from '../job-log-viewer.js';
import {registerSafeCommand} from '../safety.js';
import type {
  JobExecutionTreeItem,
  JobHistoryExecutionRow,
  JobHistoryFilters,
  JobStatusFilter,
  JobTreeItem,
  JobsTreeDataProvider,
} from './jobs-tree-provider.js';

const JOB_DETAILS_SCHEME = 'b2c-job-details';
const JOB_SCAFFOLD_DIR = 'b2c-jobs';
const MODULE_PATH_ALLOWED_CHARS_REGEX = /^[A-Za-z0-9_./-]+$/;

const STATUS_FILTER_ITEMS: Array<{
  readonly filter: JobStatusFilter;
  readonly label: string;
  readonly description: string;
}> = [
  {
    filter: 'active',
    label: 'Active',
    description: 'Running and scheduled jobs only (recommended default)',
  },
  {
    filter: 'all',
    label: 'All',
    description: 'All discovered jobs, sorted with active jobs first',
  },
  {
    filter: 'running',
    label: 'Running',
    description: 'Only currently running jobs',
  },
  {
    filter: 'scheduled',
    label: 'Scheduled',
    description: 'Only pending/scheduled jobs',
  },
  {
    filter: 'failed',
    label: 'Failed',
    description: 'Only jobs with latest failed execution',
  },
  {
    filter: 'completed',
    label: 'Completed',
    description: 'Only jobs with latest successful/completed execution',
  },
];

interface JobScaffoldSpec {
  jobId: string;
  description: string;
  stepTypeId: string;
  stepId: string;
  modulePath: string;
  functionName: string;
  siteContext: string;
  scheduleIntent: string;
  parameters: Array<{name: string; value: string}>;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getExecutionUser(execution: JobHistoryExecutionRow['execution']): string {
  const record = asRecord(execution);
  for (const key of ['executed_by', 'created_by', 'triggered_by']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '—';
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

function statusFilterLabel(filter: JobStatusFilter): string {
  if (filter === 'all') return 'All';
  if (filter === 'active') return 'Active';
  if (filter === 'running') return 'Running';
  if (filter === 'scheduled') return 'Scheduled';
  if (filter === 'failed') return 'Failed';
  return 'Completed';
}

function renderHistoryRowsAsCsv(rows: JobHistoryExecutionRow[]): string {
  const header = ['jobId', 'executionId', 'status', 'startTime', 'endTime', 'duration', 'user'];
  const lines = [header.join(',')];

  for (const row of rows) {
    lines.push(
      [
        row.jobId,
        row.execution.id ?? '',
        row.status,
        row.execution.start_time ?? '',
        row.execution.end_time ?? '',
        String(row.execution.duration ?? ''),
        getExecutionUser(row.execution),
      ]
        .map(csvCell)
        .join(','),
    );
  }

  return `${lines.join('\n')}\n`;
}

function getDefaultExportDataUnits(): Partial<ExportDataUnitsConfiguration> {
  return {global_data: {meta_data: true}};
}

function buildJobsHistoryHtml(rows: JobHistoryExecutionRow[], statusFilter: JobStatusFilter): string {
  const escapedRows = rows
    .map((row) => {
      const executionId = row.execution.id ?? 'unknown';
      const searchIndex = [
        row.jobId,
        executionId,
        row.status,
        formatDateTime(row.execution.start_time),
        formatDateTime(row.execution.end_time),
        formatDuration(row.execution.duration),
        getExecutionUser(row.execution),
      ]
        .join(' ')
        .toLowerCase();

      return [
        `<tr data-search="${escapeHtml(searchIndex)}">`,
        `<td>${escapeHtml(row.jobId)}</td>`,
        `<td>${escapeHtml(executionId)}</td>`,
        `<td>${escapeHtml(row.status)}</td>`,
        `<td>${escapeHtml(formatDateTime(row.execution.start_time))}</td>`,
        `<td>${escapeHtml(formatDateTime(row.execution.end_time))}</td>`,
        `<td>${escapeHtml(formatDuration(row.execution.duration))}</td>`,
        `<td>${escapeHtml(getExecutionUser(row.execution))}</td>`,
        '</tr>',
      ].join('');
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job History Table</title>
  <style>
    body { font-family: var(--vscode-font-family); margin: 12px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
    .meta { margin-bottom: 10px; opacity: 0.9; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
    .search { flex: 1 1 280px; min-width: 220px; max-width: 520px; padding: 7px 10px; border-radius: 6px; border: 2px solid var(--vscode-focusBorder); color: var(--vscode-input-foreground); background: var(--vscode-input-background); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-editor-background) 70%, var(--vscode-focusBorder)); }
    .search:focus { outline: none; border-color: var(--vscode-focusBorder); box-shadow: 0 0 0 2px color-mix(in srgb, var(--vscode-focusBorder) 45%, transparent); }
    .search-count { font-size: 12px; opacity: 0.9; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 6px 8px; text-align: left; font-size: 12px; }
    th { background: var(--vscode-sideBar-background); position: sticky; top: 0; }
    tbody tr:nth-child(odd) { background: color-mix(in srgb, var(--vscode-editor-background) 90%, var(--vscode-sideBar-background)); }
    #emptySearchRow td { text-align: center; opacity: 0.85; }
  </style>
</head>
<body>
  <div class="meta">Filtered execution rows: <strong>${rows.length}</strong> · Status filter: <strong>${statusFilterLabel(statusFilter)}</strong></div>
  <div class="toolbar">
    <input id="jobSearch" class="search" type="search" placeholder="Search by Job ID, execution ID, status, user, date..." autocomplete="off" />
    <span class="search-count">Visible rows: <strong id="visibleCount">${rows.length}</strong></span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Job ID</th>
        <th>Execution ID</th>
        <th>Status</th>
        <th>Start</th>
        <th>End</th>
        <th>Duration</th>
        <th>User</th>
      </tr>
    </thead>
    <tbody id="historyRows">
      ${escapedRows || '<tr><td colspan="7">No executions match current filters.</td></tr>'}
      <tr id="emptySearchRow" style="display:none;"><td colspan="7">No rows match your search.</td></tr>
    </tbody>
  </table>
  <script>
    const searchInput = document.getElementById('jobSearch');
    const visibleCount = document.getElementById('visibleCount');
    const rows = [...document.querySelectorAll('#historyRows tr[data-search]')];
    const emptySearchRow = document.getElementById('emptySearchRow');

    const applySearch = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      for (const row of rows) {
        const haystack = row.getAttribute('data-search') || '';
        const matched = !query || haystack.includes(query);
        row.style.display = matched ? '' : 'none';
        if (matched) visible += 1;
      }

      visibleCount.textContent = String(visible);
      if (emptySearchRow) {
        emptySearchRow.style.display = visible === 0 && rows.length > 0 ? '' : 'none';
      }
    };

    searchInput.addEventListener('input', applySearch);
  </script>
</body>
</html>`;
}

async function chooseUnifiedFilterAction(
  currentStatusFilter: JobStatusFilter,
): Promise<{kind: 'status'; value: JobStatusFilter} | {kind: 'advanced'} | {kind: 'clear'} | undefined> {
  const picked = await vscode.window.showQuickPick(
    [
      ...STATUS_FILTER_ITEMS.map((item) => ({
        label: item.label,
        detail: item.description,
        action: {kind: 'status', value: item.filter} as const,
        description: item.filter === currentStatusFilter ? 'Current status filter' : undefined,
      })),
      {
        label: 'Advanced Filters…',
        detail: 'Set Job ID contains, user, start from, end to',
        action: {kind: 'advanced'} as const,
      },
      {
        label: 'Clear History Filters',
        detail: 'Clear Job ID/user/date filters',
        action: {kind: 'clear'} as const,
      },
    ],
    {
      title: 'Job History Filters',
      placeHolder: 'Choose a status or advanced filter action',
      matchOnDescription: true,
      matchOnDetail: true,
    },
  );

  return picked?.action;
}

function getDefaultModulePath(jobId: string): string {
  const jobSegment = jobId.trim().replaceAll(/[^A-Za-z0-9_.-]+/g, '-');
  return `app_custom_core/cartridge/scripts/jobs/${jobSegment}`;
}

function validateModulePathInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Module path is required';
  if (trimmed.endsWith('.js')) return 'Enter module path without the .js extension';
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return 'Use a cartridge-relative path (no leading / or ./)';
  }
  if (trimmed.includes('\\')) return 'Use forward slashes (/), not backslashes';
  if (trimmed.includes(' ')) return 'Module path cannot contain spaces';
  if (!trimmed.includes('/cartridge/scripts/')) {
    return 'Expected format: <cartridge>/cartridge/scripts/<folder>/<scriptName>';
  }
  if (!MODULE_PATH_ALLOWED_CHARS_REGEX.test(trimmed)) {
    return 'Use letters, numbers, slash (/), dot (.), dash (-), and underscore (_) only';
  }

  const parts = trimmed.split('/');
  if (parts.some((part) => part.length === 0)) return 'Path cannot contain empty segments (//)';
  if (parts.some((part) => part === '..')) return 'Path cannot contain parent directory segments (..)';

  return null;
}

function modulePathToScriptRelativeFile(modulePath: string): string {
  return `${modulePath.trim()}.js`;
}

function parseMissingScope(message: string): string | undefined {
  const scopeMatch = message.match(/scope[s]?[:=]\s*([\w.-]+(?:\s+[\w.-]+)*)/i);
  if (scopeMatch?.[1]) return scopeMatch[1];

  const quotedScope = message.match(/'([a-z0-9_.-]+)'\s+scope/i);
  if (quotedScope?.[1]) return quotedScope[1];

  return undefined;
}

function validateOptionalDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number.isNaN(Date.parse(trimmed)) ? 'Enter a valid date/time (ISO format recommended).' : null;
}

async function promptForHistoryFilters(current: JobHistoryFilters): Promise<JobHistoryFilters | undefined> {
  const action = await vscode.window.showQuickPick(
    [
      {
        label: 'Set / Update Filters',
        description: 'Filter by Job ID, user, start time, and end time',
      },
      {
        label: 'Clear All Filters',
        description: 'Remove job history filters and show all matching status entries',
      },
    ],
    {
      title: 'Job History Filters',
      placeHolder: 'Choose filter action',
    },
  );

  if (!action) return undefined;
  if (action.label === 'Clear All Filters') {
    return {
      jobIdContains: '',
      executedBy: '',
      startFrom: '',
      endTo: '',
    };
  }

  const jobIdContains = await vscode.window.showInputBox({
    title: 'Job History Filters',
    prompt: 'Filter by Job ID contains (optional)',
    value: current.jobIdContains,
    placeHolder: 'e.g. sfcc-update-storefront-url',
  });
  if (jobIdContains === undefined) return undefined;

  const executedBy = await vscode.window.showInputBox({
    title: 'Job History Filters',
    prompt: 'Filter by user contains (optional)',
    value: current.executedBy,
    placeHolder: 'e.g. system or user@example.com',
  });
  if (executedBy === undefined) return undefined;

  const startFrom = await vscode.window.showInputBox({
    title: 'Job History Filters',
    prompt: 'Start time from (optional)',
    value: current.startFrom,
    placeHolder: 'e.g. 2026-06-16T00:00:00Z',
    validateInput: validateOptionalDateInput,
  });
  if (startFrom === undefined) return undefined;

  const endTo = await vscode.window.showInputBox({
    title: 'Job History Filters',
    prompt: 'End time to (optional)',
    value: current.endTo,
    placeHolder: 'e.g. 2026-06-16T23:59:59Z',
    validateInput: validateOptionalDateInput,
  });
  if (endTo === undefined) return undefined;

  return {
    jobIdContains: jobIdContains.trim(),
    executedBy: executedBy.trim(),
    startFrom: startFrom.trim(),
    endTo: endTo.trim(),
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function parseParameterInput(value: string | undefined): Array<{name: string; value: string}> {
  if (!value || !value.trim()) return [];

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const separator = line.indexOf('=');
      if (separator <= 0) {
        throw new Error(`Invalid parameter "${line}". Use one per line in key=value format.`);
      }

      const name = line.slice(0, separator).trim();
      const parameterValue = line.slice(separator + 1).trim();
      if (!name) {
        throw new Error(`Invalid parameter "${line}". Parameter name is required.`);
      }

      return {name, value: parameterValue};
    });
}

function buildJobsXml(spec: JobScaffoldSpec): string {
  const parameters = [
    {name: 'Module', value: spec.modulePath},
    {name: 'Function', value: spec.functionName},
    ...spec.parameters,
  ];

  const parametersXml = parameters
    .map((parameter) => {
      return `          <parameter name="${escapeXml(parameter.name)}">${escapeXml(parameter.value)}</parameter>`;
    })
    .join('\n');

  const contextXml = spec.siteContext ? `      <context site-id="${escapeXml(spec.siteContext)}"/>` : undefined;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">',
    `  <job job-id="${escapeXml(spec.jobId)}">`,
    `    <description>${escapeXml(spec.description)}</description>`,
    '    <triggers/>',
    '    <flow>',
    contextXml,
    `      <step step-id="${escapeXml(spec.stepId)}" type="${escapeXml(spec.stepTypeId)}">`,
    '        <parameters>',
    parametersXml,
    '        </parameters>',
    '      </step>',
    '    </flow>',
    '  </job>',
    '</jobs>',
    '',
  ].join('\n');
}

function getDefaultScaffoldRoot(): vscode.Uri | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri;
}

function getBusinessManagerJobsUrl(configProvider: B2CExtensionConfig): string | undefined {
  const hostname = configProvider.getConfig()?.values.hostname;
  if (!hostname || typeof hostname !== 'string') return undefined;

  const normalizedHost =
    hostname.startsWith('http://') || hostname.startsWith('https://') ? hostname : `https://${hostname}`;
  return `${normalizedHost.replace(/\/$/, '')}/on/demandware.store/Sites-Site/default/ViewApplication-ProcessJobs`;
}

async function promptForJobScaffoldSpec(jobIdHint?: string): Promise<JobScaffoldSpec | undefined> {
  const jobId = await vscode.window.showInputBox({
    title: 'Create Job Scaffold',
    prompt: 'Enter a unique job ID',
    value: jobIdHint ?? '',
    validateInput: (value) => {
      if (!value.trim()) return 'Job ID is required';
      return /^[A-Za-z0-9_.-]+$/.test(value.trim()) ? null : 'Use letters, numbers, dot, dash, or underscore';
    },
  });
  if (!jobId) return undefined;

  const description =
    (await vscode.window.showInputBox({
      title: 'Create Job Scaffold',
      prompt: 'Description (shown in Business Manager)',
      value: `Generated scaffold for ${jobId.trim()}`,
    })) ?? `Generated scaffold for ${jobId.trim()}`;

  const scheduleIntent = await vscode.window.showQuickPick(['Manual', 'Hourly', 'Daily', 'Weekly'], {
    title: 'Create Job Scaffold',
    placeHolder: 'Schedule intent (documentation hint in scaffold README)',
  });
  if (!scheduleIntent) return undefined;

  const stepTypeId =
    (await vscode.window.showInputBox({
      title: 'Create Job Scaffold',
      prompt: 'Step type ID (for script module steps use ExecuteScriptModule)',
      value: 'ExecuteScriptModule',
      validateInput: (value) => (value.trim() ? null : 'Step type ID is required'),
    })) ?? 'ExecuteScriptModule';

  const stepId =
    (await vscode.window.showInputBox({
      title: 'Create Job Scaffold',
      prompt: 'Step ID',
      value: `${jobId.trim()}-step`,
      validateInput: (value) => (value.trim() ? null : 'Step ID is required'),
    })) ?? `${jobId.trim()}-step`;

  const defaultModulePath = getDefaultModulePath(jobId);

  const modulePath = await vscode.window.showInputBox({
    title: 'Create Job Scaffold',
    prompt: 'Module path used by ExecuteScriptModule (without .js extension)',
    placeHolder: 'app_custom_core/cartridge/scripts/jobs/myJob',
    value: defaultModulePath,
    valueSelection: [0, defaultModulePath.length],
    validateInput: validateModulePathInput,
  });
  if (!modulePath) return undefined;

  const functionName =
    (await vscode.window.showInputBox({
      title: 'Create Job Scaffold',
      prompt: 'Script function name',
      value: 'execute',
      validateInput: (value) => (value.trim() ? null : 'Function name is required'),
    })) ?? 'execute';

  const siteContext =
    (await vscode.window.showInputBox({
      title: 'Create Job Scaffold',
      prompt: 'Site context (blank = organization scope)',
      placeHolder: 'RefArch',
      value: '',
    })) ?? '';

  const parameterInput = await vscode.window.showInputBox({
    title: 'Create Job Scaffold',
    prompt: 'Optional additional step parameters (one key=value pair per line)',
    placeHolder: 'foo=bar',
    ignoreFocusOut: true,
  });

  const parameters = parseParameterInput(parameterInput);
  return {
    jobId: jobId.trim(),
    description: description.trim() || `Generated scaffold for ${jobId.trim()}`,
    stepTypeId: stepTypeId.trim(),
    stepId: stepId.trim(),
    modulePath: modulePath.trim(),
    functionName: functionName.trim(),
    siteContext: siteContext.trim(),
    scheduleIntent,
    parameters,
  };
}

async function writeJobScaffold(spec: JobScaffoldSpec): Promise<{scaffoldDir: string; jobsXmlPath: string}> {
  const root = getDefaultScaffoldRoot();
  if (!root) {
    throw new Error('Open a workspace folder before creating a job scaffold.');
  }

  const scaffoldDir = path.join(root.fsPath, JOB_SCAFFOLD_DIR, spec.jobId);
  await fs.mkdir(scaffoldDir, {recursive: true});

  const jobsXmlPath = path.join(scaffoldDir, 'jobs.xml');
  const readmePath = path.join(scaffoldDir, 'README.md');
  const scriptStubRelativePath = modulePathToScriptRelativeFile(spec.modulePath);
  const scriptStubPath = path.join(scaffoldDir, scriptStubRelativePath);

  await fs.writeFile(jobsXmlPath, buildJobsXml(spec), 'utf-8');
  await fs.writeFile(
    readmePath,
    [
      `# Job Scaffold: ${spec.jobId}`,
      '',
      `- Schedule intent: ${spec.scheduleIntent}`,
      `- Step type ID: ${spec.stepTypeId}`,
      `- Module parameter: ${spec.modulePath}`,
      `- Function parameter: ${spec.functionName}`,
      `- Generated script stub: ${scriptStubRelativePath}`,
      '',
      'Review `jobs.xml` before deploy, then run **Deploy Job Scaffold** from the Job History view.',
      'Copy the generated script stub into the matching cartridge path in your codebase before running the job.',
      '',
      'After deploy, open Business Manager Jobs to enable/schedule the job.',
      '',
    ].join('\n'),
    'utf-8',
  );
  await fs.mkdir(path.dirname(scriptStubPath), {recursive: true});
  await fs.writeFile(
    scriptStubPath,
    [
      `'use strict';`,
      '',
      'function execute() {',
      "  return new (require('dw/system/Status'))(require('dw/system/Status').OK);",
      '}',
      '',
      'module.exports = {',
      '  execute,',
      '};',
      '',
    ].join('\n'),
    'utf-8',
  );

  return {scaffoldDir, jobsXmlPath};
}

async function selectJobsXmlForDeploy(): Promise<string | undefined> {
  const root = getDefaultScaffoldRoot();
  const picked = await vscode.window.showOpenDialog({
    title: 'Select jobs.xml to deploy',
    canSelectMany: false,
    canSelectFiles: true,
    canSelectFolders: false,
    defaultUri: root,
    filters: {XML: ['xml']},
    openLabel: 'Deploy',
  });

  if (!picked?.[0]) return undefined;
  return picked[0].fsPath;
}

function extractJobIdFromXml(xml: string): string | undefined {
  const match = xml.match(/<job\s+[^>]*job-id="([^"]+)"/i);
  return match?.[1];
}

function isActiveExecutionStatus(status: string | undefined): boolean {
  const normalized = (status ?? '').toLowerCase();
  return normalized === 'running' || normalized === 'pending';
}

function getConfiguredKnownJobIds(): string[] {
  const configured = vscode.workspace.getConfiguration('b2c-dx').get<string[]>('jobs.knownJobIds', []);
  if (!Array.isArray(configured)) return [];
  const sanitized = configured.map((id) => id.trim()).filter((id) => id.length > 0);
  return [...new Set(sanitized)].sort((a, b) => a.localeCompare(b));
}

async function promptForJobId(treeProvider: JobsTreeDataProvider): Promise<string | undefined> {
  const discovered = await treeProvider.getDiscoveredJobIds();
  const known = getConfiguredKnownJobIds();
  const options = [...new Set([...discovered, ...known])].sort((a, b) => a.localeCompare(b));

  if (options.length > 0) {
    const customLabel = '$(edit) Enter job ID manually...';
    const picked = await vscode.window.showQuickPick(
      [...options.map((jobId) => ({label: jobId})), {label: customLabel}],
      {
        title: 'Run Job',
        placeHolder: 'Select a discovered/configured job ID, or enter manually',
        matchOnDescription: true,
      },
    );

    if (!picked) return undefined;
    if (picked.label !== customLabel) return picked.label;
  }

  const typed = await vscode.window.showInputBox({
    title: 'Run Job',
    prompt:
      'Enter the job ID to run (from Business Manager > Administration > Operations > Jobs). Tip: configure b2c-dx.jobs.knownJobIds for quick picks.',
    validateInput: (value) => (value.trim() ? null : 'Job ID is required'),
  });
  return typed?.trim() || undefined;
}

function showScopeAwareError(actionLabel: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();
  const isPermissionError =
    lowered.includes('forbidden') || lowered.includes('unauthorized') || lowered.includes('access denied');

  if (!isPermissionError) {
    void vscode.window.showErrorMessage(`${actionLabel}: ${message}`);
    return;
  }

  const scope = parseMissingScope(message);
  if (scope) {
    void vscode.window.showErrorMessage(
      `${actionLabel}: Missing required OCAPI/SCAPI scope (${scope}). Update API client scopes and retry.`,
    );
    return;
  }

  void vscode.window.showErrorMessage(
    `${actionLabel}: Permission denied for current OCAPI/SCAPI scopes. Update API client scopes and retry.`,
  );
}

function getLogUnavailableMessage(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : String(error);
  const lowered = message.toLowerCase();

  if (lowered.includes('no log file path available')) {
    return 'This execution does not expose a log file path in OCAPI.';
  }

  if (lowered.includes('log file does not exist')) {
    return 'No log file exists for this execution yet.';
  }

  return undefined;
}

export function registerJobsCommands(
  configProvider: B2CExtensionConfig,
  treeProvider: JobsTreeDataProvider,
): vscode.Disposable[] {
  const details = new Map<string, string>();
  const detailsProvider = vscode.workspace.registerTextDocumentContentProvider(JOB_DETAILS_SCHEME, {
    provideTextDocumentContent(uri: vscode.Uri): string {
      return details.get(uri.toString()) ?? '';
    },
  });

  const refresh = registerSafeCommand('b2c-dx.jobs.refresh', () => {
    treeProvider.refresh();
  });

  const openExecutionDetailsDocument = async (node: JobExecutionTreeItem): Promise<void> => {
    const content = JSON.stringify(node.execution, null, 2);
    const executionId = node.execution.id ?? 'execution';
    const uri = vscode.Uri.parse(`${JOB_DETAILS_SCHEME}:${node.jobId}-${executionId}.json`);
    details.set(uri.toString(), content);

    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    const existingEditor = vscode.window.visibleTextEditors.find(
      (editor) => editor.document.uri.toString() === uri.toString(),
    );

    await vscode.window.showTextDocument(doc, {
      preview: false,
      preserveFocus: false,
      viewColumn: existingEditor?.viewColumn ?? vscode.ViewColumn.Active,
    });
  };

  const openDetailsWithLogUnavailableWarning = async (node: JobExecutionTreeItem, error: unknown): Promise<void> => {
    await openExecutionDetailsDocument(node);

    const executionId = node.execution.id ?? 'unknown';
    const reason = getLogUnavailableMessage(error);
    if (!reason) return;

    const openBm = await vscode.window.showWarningMessage(
      `Execution ${executionId}: ${reason} Opened execution details instead.`,
      'Open Business Manager Jobs',
    );

    if (openBm !== 'Open Business Manager Jobs') return;

    const bmUrl = getBusinessManagerJobsUrl(configProvider);
    if (!bmUrl) {
      void vscode.window.showWarningMessage('Unable to build Business Manager URL from current configuration.');
      return;
    }

    await vscode.env.openExternal(vscode.Uri.parse(bmUrl));
  };

  const setStatusFilter = registerSafeCommand('b2c-dx.jobs.setStatusFilter', async () => {
    const currentFilter = treeProvider.getStatusFilter();
    const picked = await vscode.window.showQuickPick(
      STATUS_FILTER_ITEMS.map((item) => ({
        ...item,
        description: item.filter === currentFilter ? `${item.description} · Current` : item.description,
      })),
      {
        title: 'Job History Status Filter',
        placeHolder: 'Choose which job history entries are shown in the Job History view',
        matchOnDescription: true,
      },
    );

    if (!picked) return;
    treeProvider.setStatusFilter(picked.filter);
  });

  const openFilters = registerSafeCommand('b2c-dx.jobs.openFilters', async () => {
    const action = await chooseUnifiedFilterAction(treeProvider.getStatusFilter());
    if (!action) return;

    if (action.kind === 'status') {
      treeProvider.setStatusFilter(action.value);
      return;
    }

    if (action.kind === 'clear') {
      treeProvider.clearHistoryFilters();
      void vscode.window.showInformationMessage('Job history filters cleared.');
      return;
    }

    const nextFilters = await promptForHistoryFilters(treeProvider.getHistoryFilters());
    if (!nextFilters) return;
    treeProvider.setHistoryFilters(nextFilters);
    void vscode.window.showInformationMessage(
      treeProvider.hasHistoryFilters() ? 'Job history filters updated.' : 'Job history filters cleared.',
    );
  });

  const setHistoryFilters = registerSafeCommand('b2c-dx.jobs.setHistoryFilters', async () => {
    const nextFilters = await promptForHistoryFilters(treeProvider.getHistoryFilters());
    if (!nextFilters) return;

    treeProvider.setHistoryFilters(nextFilters);
    if (treeProvider.hasHistoryFilters()) {
      void vscode.window.showInformationMessage('Job history filters updated.');
      return;
    }

    void vscode.window.showInformationMessage('Job history filters cleared.');
  });

  let historyTablePanel: vscode.WebviewPanel | undefined;
  const openHistoryTable = registerSafeCommand('b2c-dx.jobs.openHistoryTable', async () => {
    const rows = await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: 'Loading filtered job history...'},
      async () => treeProvider.getFilteredExecutionHistoryRows(),
    );
    if (!historyTablePanel) {
      historyTablePanel = vscode.window.createWebviewPanel(
        'b2c-dx.jobs.historyTable',
        'B2C DX · Job History Table',
        vscode.ViewColumn.Active,
        {enableScripts: true, retainContextWhenHidden: true},
      );
      historyTablePanel.onDidDispose(() => {
        historyTablePanel = undefined;
      });
    }

    historyTablePanel.webview.html = buildJobsHistoryHtml(rows, treeProvider.getStatusFilter());
    historyTablePanel.reveal(vscode.ViewColumn.Active);
  });

  const exportFilteredHistory = registerSafeCommand('b2c-dx.jobs.exportFilteredHistory', async () => {
    const format = await vscode.window.showQuickPick(['JSON', 'CSV'], {
      title: 'Export Filtered Job History',
      placeHolder: 'Choose export format',
    });
    if (!format) return;

    const ext = format === 'CSV' ? 'csv' : 'json';
    const uri = await vscode.window.showSaveDialog({
      title: 'Export Filtered Job History',
      filters: {[format]: [ext]},
      saveLabel: 'Export',
      defaultUri: vscode.Uri.file(
        path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd(), `job-history.${ext}`),
      ),
    });
    if (!uri) return;

    const rows = await vscode.window.withProgress(
      {location: vscode.ProgressLocation.Notification, title: 'Preparing filtered job history export...'},
      async () => treeProvider.getFilteredExecutionHistoryRows(),
    );

    const payload =
      format === 'CSV'
        ? renderHistoryRowsAsCsv(rows)
        : JSON.stringify(
            rows.map((row) => ({
              jobId: row.jobId,
              status: row.status,
              user: getExecutionUser(row.execution),
              execution: row.execution,
            })),
            null,
            2,
          );
    await fs.writeFile(uri.fsPath, payload, 'utf-8');
    void vscode.window.showInformationMessage(`Exported ${rows.length} rows to ${uri.fsPath}`);
  });

  const openExecutionInBusinessManager = registerSafeCommand(
    'b2c-dx.jobs.openExecutionInBM',
    async (node: JobExecutionTreeItem) => {
      if (!node) return;
      const bmUrl = getBusinessManagerJobsUrl(configProvider);
      if (!bmUrl) {
        void vscode.window.showWarningMessage('Unable to build Business Manager URL from current configuration.');
        return;
      }

      await vscode.env.openExternal(vscode.Uri.parse(bmUrl));
      void vscode.window.showInformationMessage(
        `Opened Business Manager Jobs. Execution ID: ${node.execution.id ?? 'unknown'} for job ${node.jobId}`,
      );
    },
  );

  const importSiteArchive = registerSafeCommand('b2c-dx.jobs.importSiteArchive', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    const selected = await vscode.window.showOpenDialog({
      title: 'Select Site Archive To Import',
      canSelectMany: false,
      canSelectFiles: true,
      canSelectFolders: true,
      openLabel: 'Import',
      filters: {Archive: ['zip']},
    });
    if (!selected?.[0]) return;

    const keepArchive =
      (await vscode.window.showQuickPick(['No', 'Yes'], {
        title: 'Keep uploaded archive on instance after import?',
        placeHolder: 'Choose keep-archive behavior',
      })) === 'Yes';

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: 'Importing site archive...'},
        async () => {
          await siteArchiveImport(instance, selected[0].fsPath, {keepArchive});
        },
      );
      void vscode.window.showInformationMessage('Site archive import completed.');
      treeProvider.refresh();
    } catch (error) {
      showScopeAwareError('Failed to import site archive', error);
    }
  });

  const exportSiteArchive = registerSafeCommand('b2c-dx.jobs.exportSiteArchive', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    const outputDir = await vscode.window.showOpenDialog({
      title: 'Select Local Output Folder For Site Export',
      canSelectMany: false,
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: 'Select Output Folder',
    });
    if (!outputDir?.[0]) return;

    const dataUnitsInput = await vscode.window.showInputBox({
      title: 'Site Export Data Units JSON',
      prompt: 'Provide export data units JSON',
      value: JSON.stringify(getDefaultExportDataUnits()),
      validateInput: (value) => {
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === 'object' ? null : 'Must be a JSON object';
        } catch {
          return 'Enter valid JSON';
        }
      },
    });
    if (!dataUnitsInput) return;

    const dataUnits = JSON.parse(dataUnitsInput) as Partial<ExportDataUnitsConfiguration>;

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: 'Exporting site archive...'},
        async () => {
          await siteArchiveExportToPath(instance, dataUnits, outputDir[0].fsPath, {extractZip: false});
        },
      );
      void vscode.window.showInformationMessage(`Site archive export completed to ${outputDir[0].fsPath}`);
      treeProvider.refresh();
    } catch (error) {
      showScopeAwareError('Failed to export site archive', error);
    }
  });

  const runJob = registerSafeCommand('b2c-dx.jobs.run', async (node?: JobTreeItem | JobExecutionTreeItem) => {
    const jobId = node instanceof Object && 'jobId' in node ? node.jobId : undefined;
    const chosenJobId = jobId ?? (await promptForJobId(treeProvider));

    if (!chosenJobId) return;

    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Running job ${chosenJobId}...`},
        async () => {
          await executeJob(instance, chosenJobId);
        },
      );
      void vscode.window.showInformationMessage(`Job ${chosenJobId} triggered.`);
      treeProvider.refresh();
    } catch (error) {
      showScopeAwareError(`Failed to run job ${chosenJobId}`, error);
    }
  });

  const createScaffold = registerSafeCommand('b2c-dx.jobs.createScaffold', async (node?: JobTreeItem) => {
    try {
      const spec = await promptForJobScaffoldSpec(node?.jobId);
      if (!spec) return;

      const {scaffoldDir, jobsXmlPath} = await writeJobScaffold(spec);
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const displayPath = workspaceRoot ? path.relative(workspaceRoot, scaffoldDir) : scaffoldDir;
      const open = await vscode.window.showInformationMessage(
        `Job scaffold created at ${displayPath}.`,
        'Open jobs.xml',
        'Reveal Folder',
      );

      if (open === 'Open jobs.xml') {
        const doc = await vscode.workspace.openTextDocument(jobsXmlPath);
        await vscode.window.showTextDocument(doc, {preview: false});
      } else if (open === 'Reveal Folder') {
        await vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(scaffoldDir));
      }
    } catch (error) {
      void vscode.window.showErrorMessage(
        `Failed to create job scaffold: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  const deployScaffold = registerSafeCommand('b2c-dx.jobs.deployScaffold', async () => {
    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    const jobsXmlPath = await selectJobsXmlForDeploy();
    if (!jobsXmlPath) return;

    let jobsXmlContent = '';
    try {
      jobsXmlContent = await fs.readFile(jobsXmlPath, 'utf-8');
    } catch (error) {
      void vscode.window.showErrorMessage(
        `Failed to read jobs.xml: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    if (!jobsXmlContent.includes('<jobs') || !jobsXmlContent.includes('<job')) {
      void vscode.window.showErrorMessage('Selected file does not look like a valid jobs.xml definition.');
      return;
    }

    const jobId = extractJobIdFromXml(jobsXmlContent) ?? 'unknown';
    const hostname = configProvider.getConfig()?.values.hostname ?? 'configured instance';
    const confirm = await vscode.window.showWarningMessage(
      `Deploy job scaffold (${jobId}) to ${hostname}?`,
      {modal: true},
      'Deploy',
      'Cancel',
    );
    if (confirm !== 'Deploy') return;

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Deploying job scaffold ${jobId}...`},
        async () => {
          const zip = new JSZip();
          zip.file('jobs.xml', jobsXmlContent);
          const archiveBuffer = await zip.generateAsync({type: 'nodebuffer'});
          await siteArchiveImport(instance, archiveBuffer);
        },
      );

      const openBm = await vscode.window.showInformationMessage(
        `Job scaffold ${jobId} deployed successfully.`,
        'Open Business Manager Jobs',
      );
      if (openBm === 'Open Business Manager Jobs') {
        const bmUrl = getBusinessManagerJobsUrl(configProvider);
        if (!bmUrl) {
          void vscode.window.showWarningMessage('Unable to build Business Manager URL from current configuration.');
          return;
        }

        await vscode.env.openExternal(vscode.Uri.parse(bmUrl));
      }

      treeProvider.refresh();
    } catch (error) {
      if (error instanceof JobExecutionError && error.execution.is_log_file_existing) {
        try {
          const log = await getJobLog(instance, error.execution);
          await openJobLog(error.execution.id ?? 'job', log);
        } catch {
          // no-op
        }
      }
      showScopeAwareError(`Failed to deploy job scaffold ${jobId}`, error);
    }
  });

  const rerunExecution = registerSafeCommand('b2c-dx.jobs.rerun', async (node: JobExecutionTreeItem) => {
    if (!node) return;

    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Re-running job ${node.jobId}...`},
        async () => {
          await executeJob(instance, node.jobId);
        },
      );
      void vscode.window.showInformationMessage(`Job ${node.jobId} triggered again.`);
      treeProvider.refresh();
    } catch (error) {
      showScopeAwareError(`Failed to re-run job ${node.jobId}`, error);
    }
  });

  const stopExecution = registerSafeCommand('b2c-dx.jobs.stop', async (node: JobExecutionTreeItem) => {
    if (!node) return;

    if (!isActiveExecutionStatus(node.execution.execution_status)) {
      void vscode.window.showWarningMessage(
        `Execution ${node.execution.id ?? 'unknown'} is not running. Only running/pending executions can be stopped.`,
      );
      return;
    }

    const executionId = node.execution.id;
    if (!executionId) {
      void vscode.window.showErrorMessage(`Cannot stop ${node.jobId}: missing execution ID.`);
      return;
    }

    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    const choice = await vscode.window.showWarningMessage(
      `Stop execution ${executionId} for job ${node.jobId}?`,
      {modal: true},
      'Stop',
      'Cancel',
    );
    if (choice !== 'Stop') return;

    try {
      await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Stopping execution ${executionId}...`},
        async () => {
          const {error, response} = await instance.ocapi.DELETE('/jobs/{job_id}/executions/{id}', {
            params: {path: {job_id: node.jobId, id: executionId}},
          });
          if (error) {
            throw new Error(getApiErrorMessage(error, response));
          }
        },
      );

      void vscode.window.showInformationMessage(`Stop request sent for ${node.jobId} (${executionId}).`);
      treeProvider.refresh();
    } catch (error) {
      showScopeAwareError(`Failed to stop execution ${executionId}`, error);
    }
  });

  const viewExecutionDetails = registerSafeCommand(
    'b2c-dx.jobs.viewExecutionDetails',
    async (node: JobExecutionTreeItem) => {
      if (!node) return;

      await openExecutionDetailsDocument(node);
    },
  );

  const openExecutionLog = registerSafeCommand('b2c-dx.jobs.openExecutionLog', async (node: JobExecutionTreeItem) => {
    if (!node) return;

    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    try {
      const log = await getJobLog(instance, node.execution);
      await openJobLog(node.execution.id ?? 'job', log);
    } catch (error) {
      if (getLogUnavailableMessage(error)) {
        await openDetailsWithLogUnavailableWarning(node, error);
        return;
      }
      showScopeAwareError(`Failed to fetch log for execution ${node.execution.id ?? 'unknown'}`, error);
    }
  });

  const openFailureLog = registerSafeCommand('b2c-dx.jobs.openFailureLog', async (node: JobExecutionTreeItem) => {
    if (!node) return;

    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    try {
      const log = await getJobLog(instance, node.execution);
      await openJobLog(node.execution.id ?? 'job', log);

      const errorCandidates = [
        node.execution.exit_status?.message?.trim(),
        ...(node.execution.step_executions ?? [])
          .map((step) => step.exit_status?.message?.trim())
          .filter((value): value is string => Boolean(value)),
      ].filter((value): value is string => Boolean(value));
      if (errorCandidates.length === 0) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const fullText = editor.document.getText();
      for (const candidate of errorCandidates) {
        const index = fullText.indexOf(candidate);
        if (index < 0) continue;

        const start = editor.document.positionAt(index);
        const end = editor.document.positionAt(index + candidate.length);
        editor.selection = new vscode.Selection(start, end);
        editor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
        return;
      }
    } catch (error) {
      if (getLogUnavailableMessage(error)) {
        await openDetailsWithLogUnavailableWarning(node, error);
        return;
      }
      showScopeAwareError(`Failed to open error log for execution ${node.execution.id ?? 'unknown'}`, error);
    }
  });

  return [
    detailsProvider,
    refresh,
    openFilters,
    setStatusFilter,
    setHistoryFilters,
    openHistoryTable,
    exportFilteredHistory,
    runJob,
    importSiteArchive,
    exportSiteArchive,
    createScaffold,
    deployScaffold,
    rerunExecution,
    stopExecution,
    viewExecutionDetails,
    openExecutionInBusinessManager,
    openExecutionLog,
    openFailureLog,
  ];
}
