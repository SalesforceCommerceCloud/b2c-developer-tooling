/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as vscode from 'vscode';
import {
  isJobsDefinitionXml,
  parseJobsXml,
  parseStepTypesJson,
  type ParsedJobDefinition,
  type ParsedJobStep,
  type ParsedStepType,
} from './job-definitions-parser.js';

// jobs.xml is the conventional name, but the site-import job recognizes job
// definitions by content, not filename. The discovery globs are therefore
// configurable (b2c-dx.jobs.definitionGlobs); whatever they match is then
// content-filtered via isJobsDefinitionXml so non-job XML can't pollute the view.
const DEFAULT_JOBS_GLOBS = ['**/jobs.xml'];
const STEPTYPES_GLOB = '**/steptypes.json';
const EXCLUDE_GLOB = '**/{node_modules,.git,dist,out,coverage}/**';
const MAX_FILES = 200;

function getJobsDefinitionGlobs(): string[] {
  const configured = vscode.workspace
    .getConfiguration('b2c-dx')
    .get<string[]>('jobs.definitionGlobs', DEFAULT_JOBS_GLOBS);
  if (!Array.isArray(configured)) return DEFAULT_JOBS_GLOBS;
  const cleaned = configured.map((glob) => glob.trim()).filter((glob) => glob.length > 0);
  return cleaned.length > 0 ? [...new Set(cleaned)] : DEFAULT_JOBS_GLOBS;
}

export type JobDefinitionsNode =
  | JobDefinitionsGroupItem
  | JobDefinitionItem
  | JobDefinitionStepItem
  | StepTypeItem
  | DefinitionsEmptyItem;

/** Top-level grouping node ("Defined Jobs" / "Custom Step Types"). */
export class JobDefinitionsGroupItem extends vscode.TreeItem {
  readonly nodeType = 'group' as const;

  constructor(
    readonly group: 'jobs' | 'stepTypes',
    label: string,
    count: number,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.id = `jobDefGroup:${group}`;
    this.contextValue = `jobDefGroup-${group}`;
    this.description = `${count}`;
    this.iconPath = new vscode.ThemeIcon(group === 'jobs' ? 'briefcase' : 'symbol-method');
  }
}

/** A job parsed from a local jobs.xml. */
export class JobDefinitionItem extends vscode.TreeItem {
  readonly nodeType = 'jobDefinition' as const;

  constructor(
    readonly jobId: string,
    readonly sourceFile: vscode.Uri,
    readonly definition: ParsedJobDefinition,
  ) {
    const collapsible =
      definition.steps.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
    super(jobId, collapsible);
    this.id = `jobDef:${sourceFile.fsPath}:${jobId}`;
    this.contextValue = 'jobDefinition';
    this.iconPath = new vscode.ThemeIcon('briefcase');
    this.description = vscode.workspace.asRelativePath(sourceFile);
    this.resourceUri = sourceFile;
    const lines = [`Job: ${jobId}`];
    if (definition.description) lines.push(definition.description);
    lines.push(`Defined in: ${vscode.workspace.asRelativePath(sourceFile)}`);
    this.tooltip = new vscode.MarkdownString(lines.join('\n\n'));
    this.command = {
      command: 'b2c-dx.jobs.openDefinitionFile',
      title: 'Open jobs.xml',
      arguments: [this],
    };
  }
}

/** A step inside a job definition. */
export class JobDefinitionStepItem extends vscode.TreeItem {
  readonly nodeType = 'jobDefinitionStep' as const;

  constructor(
    readonly sourceFile: vscode.Uri,
    readonly step: ParsedJobStep,
  ) {
    super(step.stepId, vscode.TreeItemCollapsibleState.None);
    this.id = `jobDefStep:${sourceFile.fsPath}:${step.stepId}`;
    this.contextValue = 'jobDefinitionStep';
    this.iconPath = new vscode.ThemeIcon('debug-step-over');
    this.description = step.type;
    this.tooltip = new vscode.MarkdownString(`Step: ${step.stepId}\n\nType: ${step.type}`);
  }
}

/** A custom step type registered in a steptypes.json. */
export class StepTypeItem extends vscode.TreeItem {
  readonly nodeType = 'stepType' as const;

  constructor(
    readonly sourceFile: vscode.Uri,
    readonly stepType: ParsedStepType,
  ) {
    super(stepType.typeId, vscode.TreeItemCollapsibleState.None);
    this.id = `stepType:${sourceFile.fsPath}:${stepType.typeId}`;
    this.contextValue = 'jobStepType';
    this.iconPath = new vscode.ThemeIcon(stepType.kind === 'chunk' ? 'list-ordered' : 'symbol-method');
    this.description = stepType.kind === 'chunk' ? 'chunk' : stepType.kind === 'task' ? 'task' : '';
    this.resourceUri = sourceFile;
    const lines = [`Step type: ${stepType.typeId}`, `Kind: ${stepType.kind}`];
    if (stepType.module) lines.push(`Module: ${stepType.module}`);
    if (stepType.description) lines.push(stepType.description);
    lines.push(`Registered in: ${vscode.workspace.asRelativePath(sourceFile)}`);
    this.tooltip = new vscode.MarkdownString(lines.join('\n\n'));
    this.command = {
      command: 'b2c-dx.jobs.openDefinitionFile',
      title: 'Open steptypes.json',
      arguments: [this],
    };
  }
}

/** Placeholder shown under a group with no entries. */
export class DefinitionsEmptyItem extends vscode.TreeItem {
  readonly nodeType = 'definitionsEmpty' as const;

  constructor(group: 'jobs' | 'stepTypes') {
    super(
      group === 'jobs' ? 'No jobs.xml found in workspace' : 'No steptypes.json found in workspace',
      vscode.TreeItemCollapsibleState.None,
    );
    this.id = `jobDefEmpty:${group}`;
    this.contextValue = 'jobDefEmpty';
    this.iconPath = new vscode.ThemeIcon('info');
  }
}

interface DiscoveredDefinitions {
  jobs: Array<{item: JobDefinitionItem}>;
  stepTypes: StepTypeItem[];
}

/**
 * Tree data provider for the "Job Definitions" view.
 *
 * Lists job definitions and custom step types discovered in the open
 * workspace's cartridges. This is the only definition source the extension can
 * offer because OCAPI/SCAPI does not expose Business Manager's job definitions;
 * a toolbar action deep-links to the live BM page for the configured instance.
 */
export class JobDefinitionsTreeDataProvider implements vscode.TreeDataProvider<JobDefinitionsNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<JobDefinitionsNode | undefined | void>();
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  private cache: DiscoveredDefinitions | undefined;

  refresh(): void {
    this.cache = undefined;
    this.onDidChangeTreeDataEmitter.fire();
  }

  getTreeItem(element: JobDefinitionsNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: JobDefinitionsNode): Promise<JobDefinitionsNode[]> {
    const discovered = await this.discover();

    if (!element) {
      return [
        new JobDefinitionsGroupItem('jobs', 'Defined Jobs', discovered.jobs.length),
        new JobDefinitionsGroupItem('stepTypes', 'Custom Step Types', discovered.stepTypes.length),
      ];
    }

    if (element instanceof JobDefinitionsGroupItem) {
      if (element.group === 'jobs') {
        if (discovered.jobs.length === 0) return [new DefinitionsEmptyItem('jobs')];
        return discovered.jobs.map((entry) => entry.item);
      }
      if (discovered.stepTypes.length === 0) return [new DefinitionsEmptyItem('stepTypes')];
      return discovered.stepTypes;
    }

    if (element instanceof JobDefinitionItem) {
      return element.definition.steps.map((step) => new JobDefinitionStepItem(element.sourceFile, step));
    }

    return [];
  }

  /** Job IDs discovered in local jobs.xml files (used to seed the Run picker). */
  async getDefinedJobIds(): Promise<string[]> {
    const discovered = await this.discover();
    return [...new Set(discovered.jobs.map((entry) => entry.item.jobId))].sort((a, b) => a.localeCompare(b));
  }

  private async discover(): Promise<DiscoveredDefinitions> {
    if (this.cache) return this.cache;

    const result: DiscoveredDefinitions = {jobs: [], stepTypes: []};
    if (!vscode.workspace.workspaceFolders?.length) {
      this.cache = result;
      return result;
    }

    // Resolve job-definition files from the configured globs (de-duped across
    // patterns), then the step-type registrations.
    const jobsGlobs = getJobsDefinitionGlobs();
    const [jobsFileLists, stepTypeFiles] = await Promise.all([
      Promise.all(jobsGlobs.map((glob) => vscode.workspace.findFiles(glob, EXCLUDE_GLOB, MAX_FILES))),
      vscode.workspace.findFiles(STEPTYPES_GLOB, EXCLUDE_GLOB, MAX_FILES),
    ]);

    const jobsFiles = [...new Map(jobsFileLists.flat().map((uri) => [uri.fsPath, uri])).values()];

    for (const uri of jobsFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath))) {
      try {
        const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf-8');
        // A configurable glob may match XML that isn't a jobs document; keep
        // only files that actually contain job definitions.
        if (!isJobsDefinitionXml(content)) continue;
        for (const definition of parseJobsXml(content)) {
          result.jobs.push({item: new JobDefinitionItem(definition.jobId, uri, definition)});
        }
      } catch {
        // Skip unreadable/locked files rather than failing the whole view.
      }
    }

    for (const uri of stepTypeFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath))) {
      try {
        const content = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf-8');
        for (const stepType of parseStepTypesJson(content)) {
          result.stepTypes.push(new StepTypeItem(uri, stepType));
        }
      } catch {
        // Skip unreadable files.
      }
    }

    this.cache = result;
    return result;
  }
}
