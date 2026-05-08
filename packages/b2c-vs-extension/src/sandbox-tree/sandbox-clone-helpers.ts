/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Minimal structural shape of a sandbox record used by these helpers. */
export interface SandboxLike {
  id: string;
  realm?: string;
  instance?: string;
  state?: string;
  clonedFrom?: string;
}

/** States of a cloned sandbox that indicate the clone is still being set up from its source. */
export const CLONE_IN_PROGRESS_STATES = new Set(['cloning', 'creating', 'failed']);

/** Sandbox states that drive the realm auto-poll (anything mid-transition). */
export const TRANSITIONAL_STATES = new Set(['creating', 'starting', 'stopping', 'deleting', 'cloning']);

export function getRealmInstanceId(s: SandboxLike): string | undefined {
  return s.realm && s.instance ? `${s.realm}-${s.instance}` : undefined;
}

/** Return the set of realm-instance identifiers that are currently a source of an in-progress clone. */
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
  /** Text shown in the tree row description. */
  displayState: string;
  /** Context-value suffix after `sandbox-`, without the `-cloned` suffix. */
  contextState: string;
  /** Full context value used by VS Code menu `when` clauses. */
  contextValue: string;
  /** True when this row represents a cloned sandbox (clonedFrom is set). */
  isClone: boolean;
  /** True when the sandbox is a cloned target still being set up (state=failed + clonedFrom). */
  isCloneInSetup: boolean;
  /** True when this row is the source of an in-progress clone. */
  showAsCloning: boolean;
  /** Text shown in the tooltip State line. */
  tooltipStateLine: string | undefined;
}

/**
 * Compute display data for a sandbox tree row. Pure function — no VS Code dependencies.
 *
 * @param sandbox the sandbox record
 * @param isCloneSource true when the caller knows this sandbox is the source of an active clone
 */
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
