/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {
  executeJob,
  getJobErrorMessage,
  getJobLog,
  siteArchiveExportToPath,
  siteArchiveImport,
  waitForJob,
  type ExportDataUnitsConfiguration,
  type JobExecution,
  type JobExecutionParameter,
  JobExecutionError,
} from '@salesforce/b2c-tooling-sdk/operations/jobs';
import {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk';
import {createScaffoldRegistry, generateFromScaffold} from '@salesforce/b2c-tooling-sdk/scaffold';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type {B2CExtensionConfig} from '../config-provider.js';
import {openJobLog} from '../job-log-viewer.js';
import {registerSafeCommand} from '../safety.js';
import type {
  JobExecutionTreeItem,
  JobHistoryFilters,
  JobStatusFilter,
  JobTreeItem,
  JobsTreeDataProvider,
} from './jobs-tree-provider.js';

const JOB_DETAILS_SCHEME = 'b2c-job-details';
/** Built-in SDK scaffold that generates a custom job step + steptypes.json registration. */
const JOB_STEP_SCAFFOLD_ID = 'job-step';

const STATUS_FILTER_ITEMS: Array<{
  readonly filter: JobStatusFilter;
  readonly label: string;
  readonly description: string;
}> = [
  {
    filter: 'all',
    label: 'All',
    description: 'Show all discovered executions (default)',
  },
  {
    filter: 'active',
    label: 'Active',
    description: 'Running and scheduled jobs only',
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
    description: 'Only failed executions',
  },
  {
    filter: 'completed',
    label: 'Completed',
    description: 'Only successful/completed executions',
  },
];

interface JobScaffoldSpec {
  /** Unique job-id written to jobs.xml and shown in Business Manager. */
  jobId: string;
  description: string;
  /** Registered custom step type id (e.g. `custom.MyStep`). */
  stepTypeId: string;
  /** Step instance id within the job flow. */
  stepId: string;
  /** Optional site-id; blank = organization scope. */
  siteContext: string;
  /** Execution model of the generated cartridge step. */
  stepKind: 'task' | 'chunk';
  /** Cartridge that will own the step code and steptypes.json registration. */
  cartridgeName: string;
}

function getDefaultExportDataUnits(): Partial<ExportDataUnitsConfiguration> {
  return {global_data: {meta_data: true}};
}

/** System jobs are platform housekeeping (sfcc-*) that developers rarely act on. */
function isSystemJobId(jobId: string): boolean {
  return jobId.startsWith('sfcc-');
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
        label: 'Clear All Filters',
        // "Clear History Filters" was misleading: it only wiped the advanced
        // fields, leaving the status filter set. Users expected one "clear"
        // action to reset everything, so the option now resets status + all
        // advanced fields together (see JobsTreeDataProvider.clearAllFilters).
        detail: 'Reset status to All and clear Job ID / user / date filters',
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
        label: 'Set / Update Advanced Filters',
        description: 'Filter by Job ID, user, start time, and end time',
      },
      {
        // Scoped to advanced fields only — status is intentionally left alone
        // here because the caller entered this dialog specifically to edit
        // advanced filters. Users who want a full reset should pick "Clear All
        // Filters" from the outer Job History Filters picker.
        label: 'Clear Advanced Filters',
        description: 'Remove Job ID / user / date filters (leaves the status filter as-is)',
      },
    ],
    {
      title: 'Job History Filters',
      placeHolder: 'Choose filter action',
    },
  );

  if (!action) return undefined;
  if (action.label === 'Clear Advanced Filters') {
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

/**
 * Prompts for optional job execution parameters (one `key=value` per line).
 *
 * Returns the parsed parameters, an empty array when the user submits nothing,
 * or `undefined` when the user cancels (Escape). Invalid input is re-validated
 * inline so the user can correct it without losing the dialog.
 */
async function promptForJobParameters(jobId: string): Promise<JobExecutionParameter[] | undefined> {
  const input = await vscode.window.showInputBox({
    title: `Run Job: ${jobId}`,
    prompt: 'Optional execution parameters (one key=value per line). Leave blank for none.',
    placeHolder: 'SiteScope={"all_storefront_sites":true}',
    ignoreFocusOut: true,
    validateInput: (value) => {
      try {
        parseParameterInput(value);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
  });
  if (input === undefined) return undefined;

  return parseParameterInput(input).map(({name, value}) => ({name, value}));
}

/**
 * Reveals the first matching error message from a failed execution in the
 * active editor (assumed to be the just-opened job log) so the user lands on
 * the relevant line. No-op when nothing matches.
 */
function revealExecutionErrorInActiveEditor(execution: JobExecution): void {
  const candidates = [
    getJobErrorMessage(execution),
    execution.exit_status?.message?.trim(),
    ...(execution.step_executions ?? [])
      .map((step) => step.exit_status?.message?.trim())
      .filter((value): value is string => Boolean(value)),
  ].filter((value): value is string => Boolean(value));
  if (candidates.length === 0) return;

  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const fullText = editor.document.getText();
  for (const candidate of candidates) {
    const index = fullText.indexOf(candidate);
    if (index < 0) continue;

    const start = editor.document.positionAt(index);
    const end = editor.document.positionAt(index + candidate.length);
    editor.selection = new vscode.Selection(start, end);
    editor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
    return;
  }
}

/**
 * Builds a `jobs.xml` document that validates against `resources/xsd/jobs.xsd`.
 *
 * Element order is mandated by the schema: `description` → `flow` (with optional
 * `context` then `step`) → `triggers` (required, last). The step references the
 * custom step type registered in `steptypes.json`; custom steps source their
 * parameters from that registration, so no `Module`/`Function` parameters are
 * emitted here (that was the cause of the previous "invalid job" deploys).
 */
/** Builds just the `<job>…</job>` block (no document wrapper), indented for jobs.xml. */
function buildJobBlockXml(spec: JobScaffoldSpec): string {
  const contextXml = spec.siteContext ? `      <context site-id="${escapeXml(spec.siteContext)}"/>` : undefined;

  return [
    `  <job job-id="${escapeXml(spec.jobId)}">`,
    `    <description>${escapeXml(spec.description)}</description>`,
    '    <flow>',
    contextXml,
    `      <step step-id="${escapeXml(spec.stepId)}" type="${escapeXml(spec.stepTypeId)}"/>`,
    '    </flow>',
    '    <triggers/>',
    '  </job>',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

function buildJobsXml(spec: JobScaffoldSpec): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">',
    buildJobBlockXml(spec),
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
  // BM deep-link to the modern Jobs page. The route has three load-bearing
  // pieces and BM rejects shortcuts on any of them:
  //   1. `;app=__bm_admin` (matrix param on the path segment) — selects the BM
  //      admin pipeline application. Without it BM routes the request against
  //      the storefront pipeline app, and a browser already authenticated on
  //      another BM tab for the same host yields the "Start node not found
  //      (DisplayMenuItem) for pipeline (ViewApplication)" error. We send the
  //      separator URL-encoded (`%3b`/`%3d`) to match the exact form BM emits
  //      itself — some BM versions preserve encoded matrix params more
  //      reliably than literal `;` through proxies/redirects.
  //   2. `ViewApplication-BM?SelectedMenuItem=jobschedules` — the modern BM
  //      pipeline + query param that selects the Jobs menu item.
  //   3. `#/?job` — the SPA fragment that focuses the jobs subview after the
  //      page loads.
  //
  // We deliberately omit `site=` (BM picks the user's last-selected site) and
  // `csrf_token=` (regenerated server-side on every request).
  //
  // Known limitation: when the browser is NOT yet logged into BM, the BM login
  // pipeline forwards to the BM home page after authentication instead of
  // preserving the original query/fragment. A subsequent open of the same URL
  // (now authenticated) lands on Jobs correctly. This is BM behavior; nothing
  // the extension emits can stop it from dropping the SelectedMenuItem param
  // through its login redirect.
  return `${normalizedHost.replace(/\/$/, '')}/on/demandware.store/Sites-Site/default%3bapp%3d__bm_admin/ViewApplication-BM?SelectedMenuItem=jobschedules#/?job`;
}

/**
 * Result of the cartridge discovery + prompt phase of job scaffolding.
 */
interface JobScaffoldPlan {
  spec: JobScaffoldSpec;
  /** Absolute path to the chosen cartridge directory (the `.project` folder). */
  cartridgeDir: string;
  /** Bare step id without the `custom.` prefix, used for the script filename. */
  stepIdBare: string;
}

const STEP_ID_REGEX = /^[a-z][a-zA-Z0-9.]*$/;
const JOB_ID_REGEX = /^[A-Za-z0-9_.-]+$/;

/**
 * Prompts for everything needed to scaffold a real custom job step plus a
 * matching `jobs.xml`. Returns `undefined` if the user cancels at any step or
 * if the workspace has no cartridges to host the step.
 */
async function promptForJobScaffoldPlan(
  jobIdHint?: string,
  cartridgeHint?: {name: string; src: string},
): Promise<JobScaffoldPlan | undefined> {
  const root = getDefaultScaffoldRoot();
  if (!root) {
    void vscode.window.showWarningMessage('Open a workspace folder before creating a job scaffold.');
    return undefined;
  }

  const cartridges = findCartridges(root.fsPath);
  if (cartridges.length === 0) {
    const choice = await vscode.window.showWarningMessage(
      'No cartridges found in this workspace. A custom job step must live in a cartridge. Create one first?',
      'Create Cartridge',
    );
    if (choice === 'Create Cartridge') {
      await vscode.commands.executeCommand('b2c-dx.scaffold.generate');
    }
    return undefined;
  }

  // Right-click from a Cartridges-tree node hands us the target cartridge —
  // skip the cartridge picker so the flow starts with the job-id prompt instead.
  const preselected = cartridgeHint
    ? cartridges.find((c) => c.src === cartridgeHint.src || c.name === cartridgeHint.name)
    : undefined;
  let cartridgePick: {label: string; description: string; cartridge: (typeof cartridges)[number]} | undefined;
  if (preselected) {
    cartridgePick = {
      label: preselected.name,
      description: vscode.workspace.asRelativePath(preselected.src),
      cartridge: preselected,
    };
  } else {
    cartridgePick = await vscode.window.showQuickPick(
      cartridges.map((c) => ({label: c.name, description: vscode.workspace.asRelativePath(c.src), cartridge: c})),
      {
        title: 'Create Job Scaffold (1/5)',
        placeHolder: 'Select the cartridge that will own the job step',
        matchOnDescription: true,
        ignoreFocusOut: true,
      },
    );
  }
  if (!cartridgePick) return undefined;

  const jobId = await vscode.window.showInputBox({
    title: 'Create Job Scaffold (2/5)',
    prompt: 'Unique job ID (shown in Business Manager > Jobs)',
    value: jobIdHint ?? '',
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value.trim()) return 'Job ID is required';
      return JOB_ID_REGEX.test(value.trim()) ? null : 'Use letters, numbers, dot, dash, or underscore';
    },
  });
  if (!jobId) return undefined;

  const stepKindPick = await vscode.window.showQuickPick(
    [
      {
        label: 'Task-oriented',
        detail: 'Single execution (FTP, file generation, import/export)',
        stepKind: 'task' as const,
      },
      {
        label: 'Chunk-oriented',
        detail: 'Bulk processing with read/process/write and progress tracking',
        stepKind: 'chunk' as const,
      },
    ],
    {
      title: 'Create Job Scaffold (3/5)',
      placeHolder: 'Choose the execution model for the custom step',
      ignoreFocusOut: true,
    },
  );
  if (!stepKindPick) return undefined;

  const stepIdBareInput = await vscode.window.showInputBox({
    title: 'Create Job Scaffold (4/5)',
    prompt: 'Step ID (a "custom." prefix is added automatically)',
    value: 'MyStep',
    ignoreFocusOut: true,
    validateInput: (value) => {
      const trimmed = value.trim().replace(/^custom\./, '');
      if (!trimmed) return 'Step ID is required';
      return STEP_ID_REGEX.test(trimmed) ? null : 'Start with a lowercase letter; letters, numbers, and dots only';
    },
  });
  if (stepIdBareInput === undefined) return undefined;
  const stepIdBare = stepIdBareInput.trim().replace(/^custom\./, '');
  const stepTypeId = `custom.${stepIdBare}`;

  const siteContextInput = await vscode.window.showInputBox({
    title: 'Create Job Scaffold (5/5)',
    prompt: 'Site context (blank = organization scope)',
    placeHolder: 'RefArch',
    value: '',
    ignoreFocusOut: true,
  });
  if (siteContextInput === undefined) return undefined;

  const descriptionInput = await vscode.window.showInputBox({
    title: 'Create Job Scaffold',
    prompt: 'Description (shown in Business Manager)',
    value: `Custom job ${jobId.trim()}`,
    ignoreFocusOut: true,
  });
  if (descriptionInput === undefined) return undefined;

  return {
    cartridgeDir: cartridgePick.cartridge.src,
    stepIdBare,
    spec: {
      jobId: jobId.trim(),
      description: descriptionInput.trim() || `Custom job ${jobId.trim()}`,
      stepTypeId,
      stepId: `${jobId.trim()}-step`,
      siteContext: siteContextInput.trim(),
      stepKind: stepKindPick.stepKind,
      cartridgeName: cartridgePick.cartridge.name,
    },
  };
}

/**
 * Generates the custom step (script + steptypes.json registration) via the SDK
 * `job-step` scaffold, then writes a matching `jobs.xml` at the cartridge root.
 *
 * Returns the created/updated paths for follow-up actions (open, reveal).
 */
async function writeJobScaffold(
  plan: JobScaffoldPlan,
  builtInScaffoldsDir: string,
): Promise<{jobsXmlPath: string; stepTypesPath: string; scriptPaths: string[]}> {
  const root = getDefaultScaffoldRoot();
  if (!root) {
    throw new Error('Open a workspace folder before creating a job scaffold.');
  }

  const registry = createScaffoldRegistry({builtInScaffoldsDir});
  const scaffold = await registry.getScaffold(JOB_STEP_SCAFFOLD_ID, {projectRoot: root.fsPath});
  if (!scaffold) {
    throw new Error(`Built-in "${JOB_STEP_SCAFFOLD_ID}" scaffold not found. Reinstall or rebuild the extension.`);
  }

  // The job-step scaffold writes paths relative to {{cartridgeNamePath}}, which
  // is the cartridge directory relative to the output dir (the workspace root).
  //
  // Pass the BARE step id (e.g. "helloworld") as `stepId`, not the full
  // "custom.helloworld" type id. The scaffold derives the script filename and
  // module path from stepId via camelCase, which does NOT strip dots — so a
  // dotted type id produced "custom.helloworld.js", a module name B2C fails to
  // load ("invalid step in script module"). The "custom." prefix is restored on
  // the @type-id during normalization below.
  const cartridgeNamePath = path.relative(root.fsPath, plan.cartridgeDir);
  const result = await generateFromScaffold(scaffold, {
    outputDir: root.fsPath,
    variables: {
      stepId: plan.stepIdBare,
      stepType: plan.spec.stepKind,
      stepDescription: plan.spec.description,
      cartridgeName: plan.spec.cartridgeName,
      cartridgeNamePath,
    },
  });

  const scriptPaths = result.files.filter((file) => file.absolutePath.endsWith('.js')).map((file) => file.absolutePath);
  const stepTypesPath = path.join(plan.cartridgeDir, 'steptypes.json');

  // Normalize the generated steptypes.json into the exact shape B2C requires:
  // keyed `step-types` object, context flags matching the job scope, a
  // cartridge-prefixed module path, and the `custom.` type-id prefix restored.
  await normalizeStepTypesJson(
    stepTypesPath,
    plan.spec.stepKind,
    plan.spec.siteContext,
    plan.spec.cartridgeName,
    plan.stepIdBare,
    plan.spec.stepTypeId,
  );

  // Merge the matching job into jobs.xml at the cartridge root. A cartridge can
  // define many jobs, so we append (or replace by job-id) rather than overwrite
  // the whole file — otherwise scaffolding a second job would delete the first.
  const jobsXmlPath = path.join(plan.cartridgeDir, 'jobs.xml');
  await mergeJobIntoJobsXml(jobsXmlPath, plan.spec);

  return {jobsXmlPath, stepTypesPath, scriptPaths};
}

/**
 * Adds (or replaces) a single `<job>` in a cartridge's jobs.xml.
 *
 * If the file doesn't exist, a fresh document with just this job is written. If
 * it exists, the job block for this job-id is replaced in place (re-scaffold),
 * or appended before `</jobs>` (new job-id) — preserving every other job already
 * defined in the cartridge.
 */
async function mergeJobIntoJobsXml(jobsXmlPath: string, spec: JobScaffoldSpec): Promise<void> {
  let existing: string | undefined;
  try {
    existing = await fs.readFile(jobsXmlPath, 'utf-8');
  } catch {
    existing = undefined;
  }

  // No existing file (or unreadable) → write a complete document.
  if (!existing || !existing.includes('<jobs')) {
    await fs.writeFile(jobsXmlPath, buildJobsXml(spec), 'utf-8');
    return;
  }

  const jobBlock = buildJobBlockXml(spec);
  const jobIdPattern = escapeRegExp(spec.jobId);
  // Match an existing <job job-id="<this id>"> … </job> block (any attribute order).
  const existingJobRegex = new RegExp(`[ \\t]*<job\\b[^>]*\\bjob-id="${jobIdPattern}"[\\s\\S]*?</job>\\n?`, 'i');

  let updated: string;
  if (existingJobRegex.test(existing)) {
    // Re-scaffold of the same job-id → replace that block in place.
    updated = existing.replace(existingJobRegex, `${jobBlock}\n`);
  } else {
    // New job-id → insert before the closing </jobs>.
    updated = existing.replace(/<\/jobs>\s*$/, `${jobBlock}\n</jobs>\n`);
  }

  await fs.writeFile(jobsXmlPath, updated, 'utf-8');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrites a generated steptypes.json into the structure B2C actually loads.
 *
 * B2C requires `step-types` to be an object keyed by step category
 * (`script-module-step` for task steps, `chunk-script-module-step` for chunk
 * steps) — not a flat array. It also requires exactly one of site/organization
 * context to be true (a site-only step can't be used by an org-scoped job), and
 * the `module` path must be prefixed with the cartridge name
 * (`<cartridge>/cartridge/scripts/...`) so it resolves at runtime. Existing step
 * categories in the file are preserved.
 */
async function normalizeStepTypesJson(
  stepTypesPath: string,
  stepKind: 'task' | 'chunk',
  siteContext: string,
  cartridgeName: string,
  stepIdBare: string,
  stepTypeId: string,
): Promise<void> {
  const raw = JSON.parse(await fs.readFile(stepTypesPath, 'utf-8')) as Record<string, unknown>;
  const categoryKey = stepKind === 'chunk' ? 'chunk-script-module-step' : 'script-module-step';
  const stepTypes = raw['step-types'];

  // Collect step entries from whichever shape the scaffold produced.
  let entries: Array<Record<string, unknown>> = [];
  let existingCategories: Record<string, unknown> = {};
  if (Array.isArray(stepTypes)) {
    entries = stepTypes as Array<Record<string, unknown>>;
  } else if (stepTypes && typeof stepTypes === 'object') {
    existingCategories = stepTypes as Record<string, unknown>;
    const current = existingCategories[categoryKey];
    entries = Array.isArray(current) ? (current as Array<Record<string, unknown>>) : [];
  }

  // Align context flags with the job scope: blank site context = org-scoped.
  const orgScoped = siteContext.trim().length === 0;
  for (const entry of entries) {
    // Restore the custom. type-id prefix. The scaffold was given the BARE id
    // (so the script filename/module stay dot-free), but the registered type id
    // must be "custom.<id>" to be a valid custom step type.
    if (entry['@type-id'] === stepIdBare) {
      entry['@type-id'] = stepTypeId;
    }

    entry['@supports-site-context'] = orgScoped ? 'false' : 'true';
    entry['@supports-organization-context'] = orgScoped ? 'true' : 'false';

    // The module path must be cartridge-relative *including* the cartridge name,
    // e.g. "app_custom_core/cartridge/scripts/jobsteps/myStep.js". The template
    // emits it without the cartridge prefix, which fails module resolution.
    const moduleValue = entry.module;
    if (typeof moduleValue === 'string' && moduleValue.startsWith('cartridge/')) {
      entry.module = `${cartridgeName}/${moduleValue}`;
    }
  }

  // De-duplicate by @type-id (last write wins). The SDK's array merge dedupes by
  // deep object equality, so re-scaffolding the same step id appends a second
  // entry once our normalization changes its shape — yielding two registrations
  // for one type id, which is invalid. Collapse to one entry per type id.
  const byTypeId = new Map<string, Record<string, unknown>>();
  for (const entry of entries) {
    const typeId = String(entry['@type-id'] ?? '');
    byTypeId.set(typeId, entry);
  }
  const deduped = [...byTypeId.values()];

  const merged = {...existingCategories, [categoryKey]: deduped};
  await fs.writeFile(stepTypesPath, `${JSON.stringify({...raw, 'step-types': merged}, null, 2)}\n`, 'utf-8');
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

async function promptForJobId(treeProvider: JobsTreeDataProvider, hintedJobId?: string): Promise<string | undefined> {
  const discovered = await treeProvider.getDiscoveredJobIds();
  const known = getConfiguredKnownJobIds();
  const hint = hintedJobId?.trim();
  const options = [...new Set([...(hint ? [hint] : []), ...discovered, ...known])].sort((a, b) => a.localeCompare(b));

  if (options.length > 0) {
    const customLabel = '$(edit) Enter job ID manually...';
    const picked = await vscode.window.showQuickPick(
      [
        ...options.map((jobId) => ({
          label: jobId,
          description: jobId === hint ? 'Selected job' : undefined,
          picked: jobId === hint,
        })),
        {label: customLabel, description: undefined, picked: false},
      ],
      {
        title: 'Run Job',
        placeHolder: hint
          ? `Confirm the job to run (default: ${hint}), or enter another`
          : 'Select a discovered/configured job ID, or enter manually',
        matchOnDescription: true,
      },
    );

    if (!picked) return undefined;
    if (picked.label !== customLabel) return picked.label;
  }

  const typed = await vscode.window.showInputBox({
    title: 'Run Job',
    value: hint ?? '',
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

/** True when OCAPI rejects a run because the job id isn't a runnable/defined job. */
function isJobNotRunnableError(error: unknown): boolean {
  const lowered = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    (lowered.includes('no job with id') && lowered.includes('could be found')) ||
    lowered.includes('jobnotfound') ||
    (lowered.includes('job') && lowered.includes('not found'))
  );
}

export function registerJobsCommands(
  configProvider: B2CExtensionConfig,
  treeProvider: JobsTreeDataProvider,
  options: {
    builtInScaffoldsDir: string;
    extensionUri?: vscode.Uri;
    /** Called when the user toggles auto-refresh from the title bar. */
    onAutoRefreshChanged?: (enabled: boolean) => void;
  } = {
    builtInScaffoldsDir: '',
  },
): vscode.Disposable[] {
  const {builtInScaffoldsDir, onAutoRefreshChanged} = options;
  void options.extensionUri; // reserved for future webview reactivation; webview removed in W-23195590.
  const details = new Map<string, string>();
  const detailsProvider = vscode.workspace.registerTextDocumentContentProvider(JOB_DETAILS_SCHEME, {
    provideTextDocumentContent(uri: vscode.Uri): string {
      return details.get(uri.toString()) ?? '';
    },
  });

  const refresh = registerSafeCommand('b2c-dx.jobs.refresh', () => {
    treeProvider.refresh();
  });

  const openExecutionDetails = async (
    jobId: string,
    execution: JobExecution,
    viewColumn?: vscode.ViewColumn,
  ): Promise<void> => {
    const content = JSON.stringify(execution, null, 2);
    const executionId = execution.id ?? 'execution';
    const uri = vscode.Uri.parse(`${JOB_DETAILS_SCHEME}:${jobId}-${executionId}.json`);
    details.set(uri.toString(), content);

    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json');
    const existingEditor = vscode.window.visibleTextEditors.find(
      (editor) => editor.document.uri.toString() === uri.toString(),
    );

    await vscode.window.showTextDocument(doc, {
      preview: false,
      preserveFocus: false,
      // Prefer the caller-requested column (e.g. Beside the History Table so it
      // isn't replaced), then any existing editor for this doc, else Active.
      viewColumn: viewColumn ?? existingEditor?.viewColumn ?? vscode.ViewColumn.Active,
    });
  };

  const openExecutionDetailsDocument = (node: JobExecutionTreeItem): Promise<void> =>
    openExecutionDetails(node.jobId, node.execution);

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

  /**
   * Triggers a job, polls it to completion, and tails the resulting log.
   *
   * Shared by Run Job and Re-Run so both flows behave identically: trigger →
   * progress with live status → auto-open the execution log on completion. On
   * failure the log is opened and the editor jumps to the error message. The
   * history view is always refreshed afterwards.
   */
  const runJobAndTail = async (jobId: string, parameters: JobExecutionParameter[]): Promise<void> => {
    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    try {
      const finished = await vscode.window.withProgress(
        {location: vscode.ProgressLocation.Notification, title: `Running job ${jobId}...`, cancellable: false},
        async (progress) => {
          const execution = await executeJob(instance, jobId, {parameters});
          const executionId = execution.id;
          if (!executionId) return execution;

          progress.report({message: `Execution ${executionId} started`});
          // Surface the running execution in the views immediately (jobs can
          // finish in <1s, so without this the "running" state is never seen).
          treeProvider.refresh();
          return waitForJob(instance, jobId, executionId, {
            onPoll: (info) => progress.report({message: `${info.status} · ${info.elapsedSeconds}s elapsed`}),
          });
        },
      );

      try {
        const log = await getJobLog(instance, finished);
        await openJobLog(finished.id ?? jobId, log);
      } catch {
        // Log may not be available yet; the success notification still applies.
      }
      void vscode.window.showInformationMessage(`Job ${jobId} finished successfully.`);
    } catch (error) {
      if (error instanceof JobExecutionError) {
        try {
          const log = await getJobLog(instance, error.execution);
          await openJobLog(error.execution.id ?? jobId, log);
          revealExecutionErrorInActiveEditor(error.execution);
        } catch {
          // Fall through to the generic error toast when the log is unavailable.
        }
        const detail = getJobErrorMessage(error.execution) ?? error.execution.exit_status?.message;
        void vscode.window.showErrorMessage(`Job ${jobId} failed${detail ? `: ${detail}` : '.'}`);
      } else if (isJobNotRunnableError(error)) {
        // System (sfcc-*) jobs appear in execution history but aren't exposed as
        // runnable definitions via OCAPI. Explain rather than surface the raw fault.
        void vscode.window.showWarningMessage(
          `"${jobId}" can't be run from here. ${isSystemJobId(jobId) ? 'It is a platform system job that runs on the instance scheduler' : 'No runnable job with this ID is defined in Business Manager'} — only custom/BM-defined jobs can be triggered via the API.`,
        );
      } else {
        showScopeAwareError(`Failed to run job ${jobId}`, error);
      }
    } finally {
      treeProvider.refresh();
    }
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
      // "Clear All Filters" resets status AND advanced fields — matches user
      // mental model (one "clear" wipes everything). The previous behavior
      // only cleared advanced fields, so the toast lied when a status filter
      // was still narrowing the tree.
      treeProvider.clearAllFilters();
      void vscode.window.showInformationMessage('All job history filters cleared.');
      return;
    }

    const nextFilters = await promptForHistoryFilters(treeProvider.getHistoryFilters());
    if (!nextFilters) return;
    treeProvider.setHistoryFilters(nextFilters);
    void vscode.window.showInformationMessage(
      treeProvider.hasHistoryFilters() ? 'Job history filters updated.' : 'Advanced job history filters cleared.',
    );
  });

  // Alias command bound to the filled-filter title-bar icon. VS Code doesn't
  // support conditional icons on a single command, so the "filters are active"
  // state is expressed by swapping to a second command entry with the same
  // handler but a different icon (see `contributes.commands` + `menus.view/title`
  // in package.json). Hidden from the command palette.
  const openFiltersActive = registerSafeCommand('b2c-dx.jobs.openFiltersActive', async () => {
    await vscode.commands.executeCommand('b2c-dx.jobs.openFilters');
  });

  // One-shot "reset everything" — wired to the empty-state row's click when
  // filters are hiding results, and exposed as a first-class command for
  // keyboard/palette use. Silent no-op when nothing is set.
  const clearAllFilters = registerSafeCommand('b2c-dx.jobs.clearAllFilters', () => {
    const hadAny = treeProvider.hasAnyActiveFilter();
    treeProvider.clearAllFilters();
    if (hadAny) {
      void vscode.window.showInformationMessage('All job history filters cleared.');
    }
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
        `Opened Business Manager Jobs page. If you had to log in, BM may have landed on the home page — click the link again to jump to Jobs. Look for execution ${node.execution.id ?? 'unknown'} for job ${node.jobId}.`,
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

  const runJob = registerSafeCommand('b2c-dx.jobs.run', async (node?: JobTreeItem | JobExecutionTreeItem | string) => {
    const instance = configProvider.getInstance();
    if (!instance) {
      void vscode.window.showErrorMessage('B2C DX: No B2C Commerce instance configured. Configure dw.json first.');
      return;
    }

    // Accept a job id from an execution tree node, a string arg, or nothing
    // (toolbar). When invoked from a specific execution we already know which
    // job to run, so skip the picker (showing 60 sfcc-* alternatives is noise)
    // and go straight to params + confirm. The picker is only for the toolbar
    // entry point where no job is known.
    const hintedJobId =
      typeof node === 'string' ? node : node && typeof node === 'object' && 'jobId' in node ? node.jobId : undefined;
    const chosenJobId = hintedJobId?.trim() || (await promptForJobId(treeProvider));
    if (!chosenJobId) return;

    const parameters = await promptForJobParameters(chosenJobId);
    if (parameters === undefined) return;

    const hostname = configProvider.getConfig()?.values.hostname ?? 'the configured instance';
    const paramSummary =
      parameters.length > 0 ? `\n\nParameters:\n${parameters.map((p) => `  ${p.name}=${p.value}`).join('\n')}` : '';
    const confirm = await vscode.window.showWarningMessage(
      `Run job "${chosenJobId}" on ${hostname}?${paramSummary}`,
      {modal: true},
      'Run',
    );
    if (confirm !== 'Run') return;

    await runJobAndTail(chosenJobId, parameters);
  });

  const createScaffold = registerSafeCommand(
    'b2c-dx.jobs.createScaffold',
    async (node?: {cartridge?: {name: string; src: string}}) => {
      try {
        // Cartridges tree right-click: node has `cartridge`, used to pre-select
        // which cartridge owns the scaffolded step.
        const cartridgeHint = node && 'cartridge' in node ? node.cartridge : undefined;
        const plan = await promptForJobScaffoldPlan(undefined, cartridgeHint);
        if (!plan) return;

        const {jobsXmlPath, stepTypesPath, scriptPaths} = await vscode.window.withProgress(
          {location: vscode.ProgressLocation.Notification, title: `Scaffolding job ${plan.spec.jobId}...`},
          () => writeJobScaffold(plan, builtInScaffoldsDir),
        );

        const openTarget = scriptPaths[0] ?? jobsXmlPath;
        const choice = await vscode.window.showInformationMessage(
          `Created custom step "${plan.spec.stepTypeId}" in ${plan.spec.cartridgeName} (script, steptypes.json) and ${vscode.workspace.asRelativePath(jobsXmlPath)}. ` +
            'Deploy the cartridge first, then Deploy Definition to register the job.',
          'Open Step Script',
          'Open jobs.xml',
          'Deploy Cartridge',
        );

        if (choice === 'Open Step Script') {
          const doc = await vscode.workspace.openTextDocument(openTarget);
          await vscode.window.showTextDocument(doc, {preview: false});
        } else if (choice === 'Open jobs.xml') {
          const doc = await vscode.workspace.openTextDocument(jobsXmlPath);
          await vscode.window.showTextDocument(doc, {preview: false});
        } else if (choice === 'Deploy Cartridge') {
          await vscode.commands.executeCommand('b2c-dx.codeSync.deploy');
        }

        // steptypes.json reference kept for clarity in tooltips/logs.
        void stepTypesPath;
      } catch (error) {
        void vscode.window.showErrorMessage(
          `Failed to create job scaffold: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  );

  /**
   * Deploys a single `jobs.xml` to the configured instance via the
   * site-archive-import system job. Shared by the Deploy Job Scaffold command
   * (file picker) and Deploy Definition (Job Definitions view).
   *
   * Performs a pre-flight check: if the job references a `custom.*` step type,
   * that step's cartridge code must already be deployed or the import will land
   * an "invalid" job. We warn and offer to deploy the cartridge first.
   */
  const openBmDefinitions = registerSafeCommand('b2c-dx.jobs.openBmDefinitions', async () => {
    const bmUrl = getBusinessManagerJobsUrl(configProvider);
    if (!bmUrl) {
      void vscode.window.showWarningMessage('Unable to build Business Manager URL from current configuration.');
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(bmUrl));
    // Set expectations: BM lists every server-side job, so the user will likely
    // see more there than in the local-only Job Definitions view.
    void vscode.window.showInformationMessage(
      'Opened Business Manager (Administration > Operations > Jobs). It lists all jobs on the server, including ones not in your workspace.',
    );
  });

  const rerunExecution = registerSafeCommand('b2c-dx.jobs.rerun', async (node: JobExecutionTreeItem) => {
    if (!node) return;

    const reusedParameters = (node.execution.parameters ?? [])
      .map((parameter) => ({name: parameter.name ?? '', value: parameter.value ?? ''}))
      .filter((parameter): parameter is JobExecutionParameter => Boolean(parameter.name));

    const confirm = await vscode.window.showWarningMessage(
      `Re-run job "${node.jobId}"${reusedParameters.length > 0 ? ' with the same parameters' : ''}?`,
      {modal: true},
      'Run',
    );
    if (confirm !== 'Run') return;

    await runJobAndTail(node.jobId, reusedParameters);
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

  /**
   * Toggle auto-refresh polling on/off. The title-bar slot binds two distinct
   * commands (`enableAutoRefresh` / `disableAutoRefresh`) gated by the
   * `b2c-dx.jobs.autoRefreshEnabled` context so the icon and tooltip both reflect
   * the current state. `toggleAutoRefresh` remains the palette-facing entry and
   * shares the same handler.
   */
  const handleAutoRefreshToggle = (): void => {
    if (treeProvider.isPollingEnabled()) {
      treeProvider.stopPolling();
      onAutoRefreshChanged?.(false);
      void vscode.window.showInformationMessage('Job history auto-refresh disabled.');
      return;
    }

    treeProvider.startPolling();
    // Starting auto-refresh implies "load now" — otherwise the panel still reads
    // "Not loaded" until the first scheduled tick (up to 30s of empty silence).
    treeProvider.refresh();
    onAutoRefreshChanged?.(true);
    void vscode.window.showInformationMessage(
      `Job history auto-refresh enabled (every ${treeProvider.getPollingIntervalSeconds()}s).`,
    );
  };
  const toggleAutoRefresh = registerSafeCommand('b2c-dx.jobs.toggleAutoRefresh', handleAutoRefreshToggle);
  const enableAutoRefresh = registerSafeCommand('b2c-dx.jobs.enableAutoRefresh', handleAutoRefreshToggle);
  const disableAutoRefresh = registerSafeCommand('b2c-dx.jobs.disableAutoRefresh', handleAutoRefreshToggle);

  /**
   * Cycles the root grouping between BM-style chronological and group-by-job-id.
   * No refetch — the provider just re-renders the same cached executions.
   */
  const toggleGrouping = registerSafeCommand('b2c-dx.jobs.toggleGrouping', () => {
    const next = treeProvider.toggleGroupingMode();
    void vscode.window.showInformationMessage(
      next === 'groupByJobId' ? 'Job history grouped by Job ID.' : 'Job history shown as chronological timeline.',
    );
  });

  /**
   * Inline name filter, modeled after Business Manager's job-name search box.
   * Re-uses the existing `jobIdContains` filter so the grouped + chronological
   * views and underlying data both pick it up without a new code path.
   */
  const setNameFilter = registerSafeCommand('b2c-dx.jobs.setNameFilter', async () => {
    const current = treeProvider.getHistoryFilters();
    const input = await vscode.window.showInputBox({
      title: 'Filter Job History by Name',
      prompt: 'Substring match against the job ID. Leave blank to clear.',
      placeHolder: 'e.g. sfcc-product or my-import',
      value: current.jobIdContains,
    });
    if (input === undefined) return;

    treeProvider.setHistoryFilters({...current, jobIdContains: input.trim()});
  });

  return [
    detailsProvider,
    refresh,
    openFilters,
    openFiltersActive,
    clearAllFilters,
    setStatusFilter,
    setHistoryFilters,
    setNameFilter,
    toggleAutoRefresh,
    enableAutoRefresh,
    disableAutoRefresh,
    toggleGrouping,
    runJob,
    importSiteArchive,
    exportSiteArchive,
    createScaffold,
    openBmDefinitions,
    rerunExecution,
    stopExecution,
    viewExecutionDetails,
    openExecutionInBusinessManager,
    openExecutionLog,
    openFailureLog,
  ];
}
