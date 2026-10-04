/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {ConfigSourceInfo, ConfigWarning, InstanceInfo, NormalizedConfig} from '@salesforce/b2c-tooling-sdk/config';
import * as path from 'path';

export interface WorkspaceInstanceSelection {
  name: string;
  location: string;
}

export type InstanceConfigurationScope = 'project' | 'global';

export interface InstancePickerEntry {
  kind: 'envFile' | 'follow' | 'inspect' | 'none' | 'separator' | 'instance';
  /** Section of an `instance` entry or a `separator`; env file rows use `envFile`. */
  scope?: InstanceConfigurationScope | 'envFile';
  instance?: InstanceInfo;
  envFile?: EnvFilePickerEntry;
  selected?: boolean;
  default?: boolean;
  description?: string;
}

export interface InstancePickerSelection {
  action?: 'follow' | 'inspect' | 'none';
  instance?: InstanceInfo;
  envFile?: EnvFilePickerEntry;
}

export interface InstancePickerSelectionActions {
  followDefault(): Promise<void>;
  inspect(): Promise<void>;
  selectEnvFile(selection: EnvFileSelection): Promise<void>;
  selectForWorkspace(selection: WorkspaceInstanceSelection): Promise<void>;
  selectNone(): Promise<void>;
}

/** Env file choice saved for a workspace: a path, `null` for none, or `undefined` for the default `.env`. */
export type EnvFileSelection = string | null | undefined;

export interface EnvFilePickerEntry {
  kind: 'default' | 'file' | 'none';
  /** Absolute file path (`default` and `file` entries). */
  path?: string;
  label: string;
  selected: boolean;
}

export interface InstanceStatusOptions {
  /** Env file applied to this resolution, if any. */
  envFile?: string;
  /** The workspace's env file choice. */
  envFileSelection: EnvFileSelection;
  /** Why the selected env file could not be used, if it could not. */
  envFileProblem?: string;
  /** Whether the workspace selected no dw.json instance. */
  instanceDisabled: boolean;
  /** Whether the workspace selected an instance instead of following the default. */
  workspaceSelected: boolean;
}

export interface InstanceStatusPresentation {
  /** Status bar label for the connection in use. */
  label: string;
  /** Status bar text (codicons included). */
  text: string;
  /** Tooltip lines. */
  tooltip: string[];
  /** Whether environment variables override or replace the selected dw.json instance. */
  warning: boolean;
}

/** Template env files that are never offered as candidates. */
const ENV_FILE_TEMPLATES = new Set(['.env.default', '.env.example', '.env.sample']);

/** Whether a file name is a selectable env file (`.env` or `.env.*`, excluding templates). */
export function isEnvFileCandidate(fileName: string): boolean {
  return (fileName === '.env' || fileName.startsWith('.env.')) && !ENV_FILE_TEMPLATES.has(fileName);
}

export type InstancePickerButtonAction = 'setDefault' | 'openConfiguration';

export interface InstancePickerButtonActions {
  openConfiguration(instance: InstanceInfo): Promise<void>;
  setDefault(instance: InstanceInfo): Promise<boolean>;
}

export interface TextOffsetRange {
  start: number;
  end: number;
}

/** Create the stable file-and-name identity persisted for a VS Code workspace. */
export function createWorkspaceInstanceSelection(instance: InstanceInfo): WorkspaceInstanceSelection | undefined {
  if (!instance.location) return undefined;
  return {name: instance.name, location: path.resolve(instance.location)};
}

export function isWorkspaceInstanceSelected(
  instance: InstanceInfo,
  selection: WorkspaceInstanceSelection | undefined,
): boolean {
  return Boolean(
    selection &&
    instance.location &&
    instance.name === selection.name &&
    path.resolve(instance.location) === path.resolve(selection.location),
  );
}

export function getInstanceConfigurationScope(
  instance: InstanceInfo,
  defaultConfigPath: string | undefined,
): InstanceConfigurationScope {
  return instance.location && defaultConfigPath && path.resolve(instance.location) === path.resolve(defaultConfigPath)
    ? 'global'
    : 'project';
}

/** Build the picker state independently from VS Code rendering and event wiring. */
export function buildInstancePickerEntries(
  instances: InstanceInfo[],
  workspaceSelection: WorkspaceInstanceSelection | undefined,
  defaultSelection: WorkspaceInstanceSelection | undefined,
  defaultConfigPath: string | undefined,
  /** Pass `envFiles` to add the env file section; omit it when the project has no env files. */
  options: {envFiles?: EnvFilePickerEntry[]; instanceDisabled?: boolean} = {},
): InstancePickerEntry[] {
  const currentSelection = options.instanceDisabled ? undefined : (workspaceSelection ?? defaultSelection);
  const following = !workspaceSelection && !options.instanceDisabled;
  const entries: InstancePickerEntry[] = [
    {kind: 'inspect', description: 'Show where each setting comes from'},
    {
      kind: 'follow',
      description: following
        ? 'Currently following the default'
        : defaultSelection
          ? `Use ${defaultSelection.name || 'the unnamed default'}`
          : 'Use the default configuration',
    },
    {
      kind: 'none',
      selected: Boolean(options.instanceDisabled),
      description: 'Use no dw.json instance (env file and shell variables only)',
    },
  ];

  for (const scope of ['project', 'global'] as const) {
    const scopedInstances = instances.filter(
      (instance) => getInstanceConfigurationScope(instance, defaultConfigPath) === scope,
    );
    if (scopedInstances.length === 0) continue;

    entries.push({kind: 'separator', scope});
    for (const instance of scopedInstances) {
      entries.push({
        kind: 'instance',
        scope,
        instance,
        selected: isWorkspaceInstanceSelected(instance, currentSelection),
        default: isWorkspaceInstanceSelected(instance, defaultSelection),
      });
    }
  }

  if (options.envFiles?.length) {
    entries.push({kind: 'separator', scope: 'envFile'});
    for (const envFile of options.envFiles) {
      entries.push({kind: 'envFile', scope: 'envFile', envFile, selected: envFile.selected});
    }
  }

  return entries;
}

/** Map an env file picker row to the saved workspace selection. */
export function toEnvFileSelection(entry: EnvFilePickerEntry): EnvFileSelection {
  if (entry.kind === 'none') return null;
  if (entry.kind === 'default') return undefined;
  return entry.path;
}

/** Apply an accepted picker row. Opening or changing the default are separate button actions. */
export async function acceptInstancePickerSelection(
  picked: InstancePickerSelection,
  actions: InstancePickerSelectionActions,
): Promise<void> {
  if (picked.envFile) {
    await actions.selectEnvFile(toEnvFileSelection(picked.envFile));
    return;
  }
  if (picked.action === 'inspect') {
    await actions.inspect();
    return;
  }
  if (picked.action === 'follow') {
    await actions.followDefault();
    return;
  }
  if (picked.action === 'none') {
    await actions.selectNone();
    return;
  }
  if (!picked.instance) return;
  // An unnamed entry can only be reached as the default, so selecting it follows the default.
  if (!picked.instance.name) {
    await actions.followDefault();
    return;
  }

  const selection = createWorkspaceInstanceSelection(picked.instance);
  if (!selection) throw new Error(`Could not select "${picked.instance.name}" for this workspace.`);
  await actions.selectForWorkspace(selection);
}

/** Apply an instance-row button without conflating it with row selection. */
export async function triggerInstancePickerButton(
  action: InstancePickerButtonAction,
  instance: InstanceInfo,
  actions: InstancePickerButtonActions,
): Promise<boolean> {
  if (action === 'setDefault') return actions.setDefault(instance);

  await actions.openConfiguration(instance);
  return true;
}

/** Find the exact named entry to select after opening a multi-instance configuration. */
export function findInstanceNameRange(text: string, name: string): TextOffsetRange | undefined {
  const literal = JSON.stringify(name);
  const escapedLiteral = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`"name"\\s*:\\s*(${escapedLiteral})`).exec(text);
  if (!match) return undefined;

  const literalOffset = match[0].lastIndexOf(literal);
  const start = match.index + literalOffset;
  return {start, end: start + literal.length};
}

/** Build env file picker entries: the default `.env`, other candidates, and None. */
export function buildEnvFilePickerEntries(
  candidates: string[],
  selection: EnvFileSelection,
  projectDirectory: string,
): EnvFilePickerEntry[] {
  const defaultPath = projectDirectory ? path.join(projectDirectory, '.env') : undefined;
  const selectedPath = typeof selection === 'string' ? path.resolve(selection) : undefined;
  const entries: EnvFilePickerEntry[] = [];
  const hasDefault = Boolean(defaultPath && candidates.some((candidate) => path.resolve(candidate) === defaultPath));

  entries.push({
    kind: 'default',
    path: hasDefault ? defaultPath : undefined,
    label: hasDefault ? '.env (default)' : 'Default (.env, not found)',
    selected: selection === undefined || (hasDefault && selectedPath === defaultPath),
  });
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved === defaultPath) continue;
    entries.push({
      kind: 'file',
      path: resolved,
      label: projectDirectory ? path.relative(projectDirectory, resolved) : path.basename(resolved),
      selected: selectedPath === resolved,
    });
  }
  if (selectedPath && selectedPath !== defaultPath && !entries.some((entry) => entry.path === selectedPath)) {
    entries.push({kind: 'file', path: selectedPath, label: `${path.basename(selectedPath)} (missing)`, selected: true});
  }
  entries.push({kind: 'none', label: 'None', selected: selection === null});
  return entries;
}

/** Human-readable label for a config source in status text and tooltips. */
export function describeSource(source: ConfigSourceInfo): string {
  switch (source.name) {
    case 'DotenvFile':
    case 'StorefrontNextEnvSource':
      return source.location && path.isAbsolute(source.location) ? path.basename(source.location) : 'environment';
    case 'DwJsonSource':
      return source.scope === 'global' ? 'global dw.json' : 'dw.json';
    case 'EnvSource':
      return 'environment variables';
    case 'SandboxHostname':
      return 'hostname';
    default:
      return source.name;
  }
}

/** Fields a source supplied that were actually used (not shadowed by a higher-priority source). */
export function usedFields(source: ConfigSourceInfo): (keyof NormalizedConfig)[] {
  return source.fields.filter((field) => !source.fieldsIgnored?.includes(field));
}

const ENV_SOURCE_NAMES = new Set(['DotenvFile', 'EnvSource']);

/**
 * Describe the connection actually in use from resolved configuration sources.
 *
 * The label never comes from the default/active entry of another file: it is
 * the resolved instance name, an honest "unnamed" label for the dw.json entry
 * that supplied the connection, or the env file / hostname when no dw.json
 * entry is used.
 */
export function describeInstanceStatus(
  config: {sources: ConfigSourceInfo[]; values: NormalizedConfig; warnings: ConfigWarning[]},
  options: InstanceStatusOptions,
): InstanceStatusPresentation {
  const {sources, values} = config;
  const dwJson = sources.find((source) => source.name === 'DwJsonSource');
  const dwJsonUsed = dwJson && usedFields(dwJson).length > 0 ? dwJson : undefined;
  const hostSource = sources.find((source) => usedFields(source).includes('hostname'));
  const host = values.hostname ?? '';
  const truncatedHost = host.length > 40 ? host.slice(0, 37) + '...' : host;
  const envFileName = options.envFile ? path.basename(options.envFile) : undefined;
  const envFileExplicit = typeof options.envFileSelection === 'string';

  let label: string;
  if (dwJsonUsed && values.instanceName) {
    label = values.instanceName;
  } else if (dwJsonUsed) {
    label = `${dwJsonUsed.scope === 'global' ? 'global' : 'project'} dw.json (unnamed)`;
  } else if (hostSource?.name === 'DotenvFile' && envFileName) {
    label = envFileName;
  } else {
    label = truncatedHost || 'unnamed';
  }

  const tooltip = [`B2C Instance: ${label}`];
  if (host) tooltip.push(`Host: ${host}${hostSource ? ` (${describeSource(hostSource)})` : ''}`);

  if (options.instanceDisabled) {
    tooltip.push('Instance: None (dw.json not used)');
  } else if (dwJson?.location) {
    const selection = options.workspaceSelected ? 'selected for this workspace' : 'following the default';
    tooltip.push(`Instance: ${dwJson.location} (${selection})`);
  }
  if (options.envFileSelection === null) {
    tooltip.push('Env file: None');
  } else if (options.envFile) {
    tooltip.push(`Env file: ${options.envFile}${envFileExplicit ? '' : ' (default)'}`);
  }

  let warning = false;
  if (options.envFileProblem) {
    tooltip.push(`Env file problem: ${options.envFileProblem}`);
    warning = true;
  }
  if (dwJson && !dwJsonUsed && dwJson.fieldsIgnored?.length) {
    const mismatch = config.warnings.find(
      (item) => item.code === 'HOSTNAME_MISMATCH' && item.details?.source === 'DwJsonSource',
    );
    if (mismatch && hostSource) {
      tooltip.push(`dw.json ignored: hostname from ${describeSource(hostSource)} differs`);
      if (ENV_SOURCE_NAMES.has(hostSource.name)) warning = true;
    }
  }

  if (dwJsonUsed?.fieldsIgnored?.length) {
    const dwJsonIndex = sources.indexOf(dwJsonUsed);
    const overrides = new Map<string, (keyof NormalizedConfig)[]>();
    for (const field of dwJsonUsed.fieldsIgnored) {
      const winner = sources.slice(0, dwJsonIndex).find((source) => usedFields(source).includes(field));
      if (!winner || !ENV_SOURCE_NAMES.has(winner.name)) continue;
      const name = describeSource(winner);
      overrides.set(name, [...(overrides.get(name) ?? []), field]);
    }
    for (const [name, fields] of overrides) {
      tooltip.push(`Overrides from ${name}: ${fields.join(', ')}`);
      warning = true;
    }
  }

  for (const source of sources) {
    const fields = usedFields(source);
    if (fields.length === 0) continue;
    if (source.name === 'StorefrontNextEnvSource') {
      tooltip.push(`Storefront Next fallback (${describeSource(source)}): ${fields.join(', ')}`);
    } else if (source.name === 'SandboxHostname') {
      tooltip.push(`Derived from hostname: ${fields.join(', ')}`);
    }
  }

  // Name an explicitly selected env file; name the default .env only when it supplies used settings.
  const envFileInPlay =
    envFileExplicit ||
    sources.some(
      (source) =>
        (source.name === 'DotenvFile' ||
          (source.name === 'StorefrontNextEnvSource' && source.location === options.envFile)) &&
        usedFields(source).length > 0,
    );
  const suffix = envFileInPlay && envFileName && label !== envFileName ? ` | ${envFileName}` : '';
  const text = `$(cloud) ${label}${suffix}${warning ? ' $(warning)' : ''}`;
  return {label, text, tooltip, warning};
}
