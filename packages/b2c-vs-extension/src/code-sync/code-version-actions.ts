/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {CodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';

export type PostDeployAction = 'none' | 'activate' | 'reload';

export interface PostDeployActionItem {
  action: PostDeployAction;
  description?: string;
  label: string;
}

export function getPostDeployActions(targetIsActive: boolean): PostDeployActionItem[] {
  const actions: PostDeployActionItem[] = [{label: 'Deploy only', action: 'none'}];
  if (!targetIsActive) {
    actions.push({label: 'Deploy & Activate', action: 'activate'});
  }
  actions.push({label: 'Deploy & Reload', description: 'Toggle activation to force reload', action: 'reload'});
  return actions;
}

export function getActivationCandidates(versions: CodeVersion[]): CodeVersion[] {
  return versions.filter((version) => !version.active && typeof version.id === 'string');
}
