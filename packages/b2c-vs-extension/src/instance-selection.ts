/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {InstanceInfo} from '@salesforce/b2c-tooling-sdk/config';
import * as path from 'path';

export interface WorkspaceInstanceSelection {
  name: string;
  location: string;
}

export type InstanceConfigurationScope = 'project' | 'global';

export interface InstancePickerEntry {
  kind: 'follow' | 'separator' | 'instance';
  scope?: InstanceConfigurationScope;
  instance?: InstanceInfo;
  selected?: boolean;
  default?: boolean;
  description?: string;
}

export interface InstancePickerSelection {
  action?: 'follow';
  instance?: InstanceInfo;
}

export interface InstancePickerSelectionActions {
  followDefault(): Promise<void>;
  selectForWorkspace(selection: WorkspaceInstanceSelection): Promise<void>;
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
): InstancePickerEntry[] {
  const currentSelection = workspaceSelection ?? defaultSelection;
  const entries: InstancePickerEntry[] = [
    {
      kind: 'follow',
      description: workspaceSelection
        ? defaultSelection
          ? `Use ${defaultSelection.name}`
          : 'Use the default configuration'
        : 'Currently following the default',
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

  return entries;
}

/** Apply an accepted picker row. Opening or changing the default are separate button actions. */
export async function acceptInstancePickerSelection(
  picked: InstancePickerSelection,
  actions: InstancePickerSelectionActions,
): Promise<void> {
  if (picked.action === 'follow') {
    await actions.followDefault();
    return;
  }
  if (!picked.instance) return;

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
