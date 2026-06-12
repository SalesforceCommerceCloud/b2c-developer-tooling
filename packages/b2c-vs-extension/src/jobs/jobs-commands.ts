/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {executeJob, getJobLog, siteArchiveImport, JobExecutionError} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import JSZip from 'jszip';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {openJobLog} from '../job-log-viewer.js';
import {registerSafeCommand} from '../safety.js';
import type {JobExecutionTreeItem, JobTreeItem, JobsTreeDataProvider} from './jobs-tree-provider.js';

const JOB_DETAILS_SCHEME = 'b2c-job-details';
const JOB_SCAFFOLD_DIR = 'b2c-jobs';

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

function parseMissingScope(message: string): string | undefined {
  const scopeMatch = message.match(/scope[s]?[:=]\s*([\w.-]+(?:\s+[\w.-]+)*)/i);
  if (scopeMatch?.[1]) return scopeMatch[1];

  const quotedScope = message.match(/'([a-z0-9_.-]+)'\s+scope/i);
  if (quotedScope?.[1]) return quotedScope[1];

  return undefined;
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

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2007-03-31">',
    `  <job job-id="${escapeXml(spec.jobId)}">`,
    `    <description>${escapeXml(spec.description)}</description>`,
    '    <enabled>false</enabled>',
    '    <triggers/>',
    '    <flow>',
    `      <context site-id="${escapeXml(spec.siteContext)}"/>`,
    `      <step step-id="${escapeXml(spec.stepId)}" type-id="${escapeXml(spec.stepTypeId)}">`,
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

  const modulePath = await vscode.window.showInputBox({
    title: 'Create Job Scaffold',
    prompt: 'Script module path (stored as Module parameter)',
    placeHolder: 'app_custom_core/cartridge/scripts/jobs/myJob',
    validateInput: (value) => (value.trim() ? null : 'Module path is required'),
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
  const scriptStubPath = path.join(scaffoldDir, `${spec.jobId}.js`);

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
      '',
      'Review `jobs.xml` before deploy, then run **Deploy Job Scaffold** from the Jobs view.',
      '',
      'After deploy, open Business Manager Jobs to enable/schedule the job.',
      '',
    ].join('\n'),
    'utf-8',
  );
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

      const content = JSON.stringify(node.execution, null, 2);
      const executionId = node.execution.id ?? 'execution';
      const uri = vscode.Uri.parse(`${JOB_DETAILS_SCHEME}:${node.jobId}-${executionId}.json`);
      details.set(uri.toString(), content);

      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.languages.setTextDocumentLanguage(doc, 'json');
      await vscode.window.showTextDocument(doc, {preview: true});
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
      showScopeAwareError(`Failed to open error log for execution ${node.execution.id ?? 'unknown'}`, error);
    }
  });

  return [
    detailsProvider,
    refresh,
    runJob,
    createScaffold,
    deployScaffold,
    rerunExecution,
    stopExecution,
    viewExecutionDetails,
    openExecutionLog,
    openFailureLog,
  ];
}
