/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared `--workspace` resolution for the `docs search` and `docs read` commands
 * so both apply the same workspace-aware ranking (parity: a fuzzy `docs read`
 * should resolve the same top hit that `docs search` ranks first).
 */
import {PROJECT_TYPES, type DetectionResult, type ProjectType} from '@salesforce/b2c-tooling-sdk/discovery';

/** Minimal logger surface used by {@link resolveDocsWorkspace}. */
interface WorkspaceLogger {
  debug(objOrMsg: unknown, msg?: string): void;
}

/** Detector signature — matches the SDK's `detectWorkspaceType`; injected so commands can stub it in tests. */
type DetectWorkspaceType = (cwd: string) => Promise<DetectionResult>;

/**
 * Resolves the `--workspace` flag value to concrete project type(s).
 *
 * Workspace awareness is ON by default (matching the MCP docs tools): when the
 * flag is unset — or explicitly `auto` — workspace detection runs and its result
 * favors the detected workspace's docs. `all` opts out (no preference); an
 * explicit type (or comma-separated list) is used verbatim without detection.
 *
 * Kept dependency-injected (detector/logger/warn) rather than a base-class method
 * so both docs commands share one implementation and can stub detection in tests.
 *
 * @param value - The raw `--workspace` flag value (may be undefined)
 * @param detect - Workspace detector (the command's stubbable `detectWorkspaceType`)
 * @param logger - Command logger for debug tracing
 * @param warn - Callback for surfacing unknown workspace types to the user
 * @returns Concrete project types to favor, or `undefined` for no preference
 */
export async function resolveDocsWorkspace(
  value: string | undefined,
  detect: DetectWorkspaceType,
  logger: WorkspaceLogger,
  warn: (message: string) => void,
): Promise<ProjectType[] | undefined> {
  if (value === 'all') {
    logger.debug('Workspace preference disabled (--workspace all); no detection run');
    return undefined;
  }
  if (!value || value === 'auto') {
    const cwd = process.cwd();
    const detection = await detect(cwd);
    const resolved = detection.projectTypes.length > 0 ? detection.projectTypes : undefined;
    logger.debug(
      {
        cwd,
        workspaceFlag: value ?? '(unset, defaults to auto)',
        matchedPatterns: detection.matchedPatterns,
        projectTypes: detection.projectTypes,
        resolved: resolved ?? null,
      },
      resolved
        ? `Auto-detected workspace: ${resolved.join(', ')}`
        : 'No workspace detected; using no workspace preference',
    );
    return resolved;
  }
  // Handle one or more comma-separated explicit types. Validate against the
  // canonical PROJECT_TYPES; warn on (and drop) anything unrecognized.
  const known = new Set<string>(PROJECT_TYPES);
  const requested = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  const valid = requested.filter((s) => known.has(s)) as ProjectType[];
  const invalid = requested.filter((s) => !known.has(s));
  if (invalid.length > 0) {
    warn(`Ignoring unknown workspace type(s): ${invalid.join(', ')}`);
  }
  if (valid.length === 0) {
    logger.debug({requested}, 'No valid workspace types specified; using no workspace preference');
    return undefined;
  }
  logger.debug({workspace: valid}, 'Using explicitly specified workspace type(s)');
  return [...new Set(valid)];
}
