/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Captures the git provenance (commit SHA, commit date, branch) of a source
 * content repository at generation time. Written into each prose corpus's
 * `index.json` as its `source` field so a maintainer can diff the committed
 * corpus against the current upstream (`git log <sha>..HEAD` in the local clone)
 * and see exactly what changed before a refresh.
 *
 * Only opaque values are recorded — deliberately NO repository URL — so no
 * internal host name or maintainer credential can land in the published package.
 *
 * Best-effort: if the path is not a git repo or git is unavailable, returns
 * `undefined` and the caller simply omits the provenance (generation never fails
 * over missing git metadata).
 */
import {execFileSync} from 'node:child_process';

export interface SourceProvenance {
  sha: string;
  committedAt: string;
  ref?: string;
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
}

/**
 * @param repoPath any path inside the source repo working tree
 */
export function captureSourceProvenance(repoPath: string): SourceProvenance | undefined {
  try {
    const sha = git(repoPath, ['rev-parse', 'HEAD']);
    const committedAt = git(repoPath, ['show', '-s', '--format=%cI', 'HEAD']);
    let ref: string | undefined;
    try {
      const branch = git(repoPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
      if (branch && branch !== 'HEAD') ref = branch;
    } catch {
      // detached HEAD or unavailable
    }
    return {sha, committedAt, ...(ref && {ref})};
  } catch {
    console.warn(`Warning: could not read git provenance from ${repoPath}; omitting source metadata.`);
    return undefined;
  }
}
