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
  profile?: string;
  resourceProfile?: string;
  clonedFrom?: string;
}

export const CLONE_PROFILES = ['medium', 'large', 'xlarge', 'xxlarge'] as const;
export type CloneProfile = (typeof CLONE_PROFILES)[number];

const CLONE_PROFILE_RANK: Record<CloneProfile, number> = {
  medium: 0,
  large: 1,
  xlarge: 2,
  xxlarge: 3,
};

/** States of a cloned sandbox that indicate the clone is still being set up from its source. */
export const CLONE_IN_PROGRESS_STATES = new Set(['cloning', 'creating', 'failed']);

/** Sandbox states that drive the realm auto-poll (anything mid-transition). */
export const TRANSITIONAL_STATES = new Set(['creating', 'starting', 'stopping', 'deleting', 'cloning']);

export function getRealmInstanceId(s: SandboxLike): string | undefined {
  return s.realm && s.instance ? `${s.realm}-${s.instance}` : undefined;
}

export function normalizeCloneProfile(profile: string | undefined): CloneProfile | undefined {
  const normalized = profile?.trim().toLowerCase();
  if (!normalized) return undefined;
  return CLONE_PROFILES.find((p) => p === normalized);
}

export function getSandboxSourceProfile(sandbox: Pick<SandboxLike, 'profile' | 'resourceProfile'>): string | undefined {
  return sandbox.profile ?? sandbox.resourceProfile;
}

export function getAllowedCloneTargetProfiles(sourceProfile: string | undefined): CloneProfile[] {
  const normalizedSource = normalizeCloneProfile(sourceProfile);
  if (!normalizedSource) return [...CLONE_PROFILES];
  const sourceRank = CLONE_PROFILE_RANK[normalizedSource];
  return CLONE_PROFILES.filter((p) => CLONE_PROFILE_RANK[p] >= sourceRank);
}

export function getExplicitCloneTargetProfiles(sourceProfile: string | undefined): CloneProfile[] {
  const allowedProfiles = getAllowedCloneTargetProfiles(sourceProfile);
  const normalizedSource = normalizeCloneProfile(sourceProfile);
  if (!normalizedSource) return allowedProfiles;
  return allowedProfiles.filter((p) => p !== normalizedSource);
}

export function isCloneProfileDowngrade(sourceProfile: string | undefined, targetProfile: string | undefined): boolean {
  const normalizedSource = normalizeCloneProfile(sourceProfile);
  const normalizedTarget = normalizeCloneProfile(targetProfile);
  if (!normalizedSource || !normalizedTarget) return false;
  return CLONE_PROFILE_RANK[normalizedTarget] < CLONE_PROFILE_RANK[normalizedSource];
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
