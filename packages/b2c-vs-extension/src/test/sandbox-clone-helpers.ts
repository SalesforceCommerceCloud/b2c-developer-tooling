/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Test-local mirror of src/sandbox-tree/sandbox-clone-helpers.ts.
 * Kept in sync manually — production code is outside this test config's rootDir.
 */

export interface SandboxLike {
  id: string;
  realm?: string;
  instance?: string;
  state?: string;
  clonedFrom?: string;
}

export const CLONE_IN_PROGRESS_STATES = new Set(['cloning', 'creating', 'failed']);

export const TRANSITIONAL_STATES = new Set(['creating', 'starting', 'stopping', 'deleting', 'cloning']);

export function getRealmInstanceId(s: SandboxLike): string | undefined {
  return s.realm && s.instance ? `${s.realm}-${s.instance}` : undefined;
}

export function getActiveCloneSourceIds(sandboxes: SandboxLike[]): Set<string> {
  const sources = new Set<string>();
  for (const s of sandboxes) {
    if (typeof s.clonedFrom === 'string' && s.clonedFrom.length > 0) {
      const state = (s.state ?? '').toLowerCase();
      if (CLONE_IN_PROGRESS_STATES.has(state)) {
        sources.add(s.clonedFrom);
      }
    }
  }
  return sources;
}

export interface SandboxDisplay {
  displayState: string;
  contextState: string;
  contextValue: string;
  isClone: boolean;
  isCloneInSetup: boolean;
  showAsCloning: boolean;
  tooltipStateLine: string | undefined;
}

export function computeSandboxDisplay(sandbox: SandboxLike, isCloneSource: boolean): SandboxDisplay {
  const rawState = (sandbox.state ?? 'unknown').toLowerCase();
  const isClone = typeof sandbox.clonedFrom === 'string' && sandbox.clonedFrom.length > 0;
  const isCloneInSetup = isClone && rawState === 'failed';
  const showAsCloning = isCloneSource && !isCloneInSetup;
  const displayState = isCloneInSetup ? 'setting up' : showAsCloning ? 'cloning' : rawState;
  const contextState = isCloneInSetup ? 'settingup' : showAsCloning ? 'cloning' : rawState;
  const contextValue = isClone ? `sandbox-${contextState}-cloned` : `sandbox-${contextState}`;
  let tooltipStateLine: string | undefined;
  if (sandbox.state) {
    tooltipStateLine = isCloneInSetup
      ? 'setting up (clone in progress)'
      : showAsCloning
        ? `${sandbox.state} (clone in progress)`
        : sandbox.state;
  }
  return {displayState, contextState, contextValue, isClone, isCloneInSetup, showAsCloning, tooltipStateLine};
}
