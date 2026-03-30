/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * An entry in the "add" or "unchanged" category of a diff.
 */
export interface EnvVarEntry {
  key: string;
  value: string;
}

/**
 * An entry in the "update" category of a diff, showing both old and new values.
 */
export interface EnvVarUpdateEntry extends EnvVarEntry {
  oldValue: string;
}

/**
 * The result of comparing local env vars against remote MRT env vars.
 */
export interface EnvVarDiff {
  /** Variables present locally but not in MRT — will be added. */
  add: EnvVarEntry[];
  /** Variables present in both with differing values — will be updated. */
  update: EnvVarUpdateEntry[];
  /** Variables present in both with identical values — no action needed. */
  unchanged: EnvVarEntry[];
  /** Variables present in MRT but not locally — will NOT be deleted. */
  remoteOnly: EnvVarEntry[];
}

/**
 * Returns a new Map excluding entries whose keys start with any of the given prefixes.
 *
 * @param vars - Map of environment variable key-value pairs
 * @param excludePrefixes - Prefixes to exclude (e.g. ['MRT_', 'SFCC_'])
 */
export function filterByPrefix(vars: Map<string, string>, excludePrefixes: string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of vars) {
    if (!excludePrefixes.some((prefix) => key.startsWith(prefix))) {
      result.set(key, value);
    }
  }
  return result;
}

/**
 * Computes the diff between local env vars and remote MRT env vars.
 *
 * @param local - Local env vars (already filtered)
 * @param remote - Remote MRT env vars
 */
export function computeEnvVarDiff(local: Map<string, string>, remote: Map<string, string>): EnvVarDiff {
  const add: EnvVarEntry[] = [];
  const update: EnvVarUpdateEntry[] = [];
  const unchanged: EnvVarEntry[] = [];
  const remoteOnly: EnvVarEntry[] = [];

  for (const [key, value] of local) {
    if (remote.has(key)) {
      const remoteValue = remote.get(key)!;
      if (remoteValue === value) {
        unchanged.push({key, value});
      } else {
        update.push({key, value, oldValue: remoteValue});
      }
    } else {
      add.push({key, value});
    }
  }

  for (const [key, value] of remote) {
    if (!local.has(key)) {
      remoteOnly.push({key, value});
    }
  }

  return {add, update, unchanged, remoteOnly};
}

/**
 * Formats a human-readable diff summary using ASCII markers.
 *
 * @param diff - The diff to format
 */
export function formatEnvVarDiffSummary(diff: EnvVarDiff): string {
  const {add, update, unchanged, remoteOnly} = diff;
  const lines: string[] = [];

  if (add.length === 0 && update.length === 0) {
    lines.push('Nothing to sync — all variables are up-to-date.');
    if (unchanged.length > 0) {
      lines.push('', `  ${unchanged.length} variable(s) unchanged`);
    }
    if (remoteOnly.length > 0) {
      lines.push('', `  ${remoteOnly.length} remote-only variable(s) (not in local file):`);
      for (const {key, value} of remoteOnly) {
        lines.push(`    * ${key} = ${value}`);
      }
    }
    return lines.join('\n');
  }

  if (add.length > 0) {
    lines.push(`+ Add (${add.length}):`);
    for (const {key, value} of add) {
      lines.push(`  + ${key} = ${value}`);
    }
    lines.push('');
  }

  if (update.length > 0) {
    lines.push(`~ Update (${update.length}):`);
    for (const {key, value, oldValue} of update) {
      lines.push(`  ~ ${key}: ${oldValue} → ${value}`);
    }
    lines.push('');
  }

  if (unchanged.length > 0) {
    lines.push(`  Unchanged (${unchanged.length}):`);
    for (const {key} of unchanged) {
      lines.push(`    = ${key}`);
    }
    lines.push('');
  }

  if (remoteOnly.length > 0) {
    lines.push(`  Remote-only (${remoteOnly.length}, not deleted):`);
    for (const {key, value} of remoteOnly) {
      lines.push(`    * ${key} = ${value}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
