/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as path from 'node:path';

/**
 * Shared helpers for reading job definitions out of a `jobs.xml`.
 *
 * jobs.xml is user-edited and can take a variety of shapes — commented-out job
 * blocks, arbitrary attribute order, unusual whitespace. We deliberately don't
 * pull in a full XML parser (heavy dep, big bundle hit) for a couple of tree
 * lookups, but we DO need to survive the shapes users actually write. These
 * helpers centralize the parsing so every caller gets the same behavior and
 * one place is tested for the tricky cases.
 */

/**
 * Removes `<!-- … -->` comment blocks from an XML document. Commented-out job
 * definitions must not surface as tree rows or auto-deploy candidates — they're
 * intentionally disabled by the developer.
 *
 * The comment regex is non-greedy and multi-line so nested blocks and blocks
 * spanning many lines are both handled. XML doesn't allow nested comments, so a
 * single pass is sufficient.
 */
export function stripXmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

const JOB_ID_REGEX = /<job\b[^>]*\bjob-id\s*=\s*(["'])((?:(?!\1).)+)\1/gi;

/**
 * Extracts every `<job job-id="…">` value from a jobs.xml string in file order,
 * ignoring commented-out blocks. Returns unique ids only — the same id declared
 * twice in one file (which would be a user error anyway) collapses to one.
 *
 * Handles the shapes we've seen in the wild:
 * - attributes in any order: `<job name="x" job-id="y">`
 * - single OR double quotes around the value
 * - whitespace around the `=`: `<job job-id = "y">`
 * - commented-out blocks: `<!-- <job job-id="y"/> -->` (skipped)
 */
export function extractJobIdsFromXml(content: string): string[] {
  const cleaned = stripXmlComments(content);
  const ids: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(JOB_ID_REGEX.source, JOB_ID_REGEX.flags);
  while ((match = regex.exec(cleaned)) !== null) {
    const id = match[2]?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Extracts the entire `<job job-id="X"> … </job>` block for a specific job-id,
 * or `undefined` when the id isn't declared (or is only inside a comment).
 *
 * The returned string is the exact block text — callers use it as the payload
 * of the minimal jobs.xml they upload to BM when auto-deploying a workspace
 * job definition.
 */
export function extractJobBlockXml(content: string, jobId: string): string | undefined {
  const cleaned = stripXmlComments(content);
  const escaped = jobId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRegex = new RegExp(`<job\\b[^>]*\\bjob-id\\s*=\\s*(["'])${escaped}\\1[\\s\\S]*?</job>`, 'i');
  const match = blockRegex.exec(cleaned);
  return match ? match[0] : undefined;
}

/**
 * Locates the character offset of the `<job job-id="X">` opening tag inside a
 * jobs.xml string, or `undefined` when not found. Callers use this to position
 * the editor cursor when opening the file from a tree row.
 *
 * Returns the offset into the ORIGINAL content (not the comment-stripped copy)
 * so cursor placement is accurate. When the only match is inside a comment we
 * return undefined — the editor should open the file at the top rather than
 * jump into a disabled block.
 */
export function findJobBlockOffset(content: string, jobId: string): number | undefined {
  const cleaned = stripXmlComments(content);
  const escaped = jobId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<job\\b[^>]*\\bjob-id\\s*=\\s*(["'])${escaped}\\1`, 'i');
  const cleanedMatch = regex.exec(cleaned);
  if (!cleanedMatch) return undefined;

  // Map the offset from the cleaned string back to the original. Comment
  // removal only deletes bytes, so we can walk the original and count real
  // (non-comment) characters until we've passed cleanedMatch.index.
  const target = cleanedMatch.index;
  let originalOffset = 0;
  let cleanedConsumed = 0;
  const commentRegex = /<!--[\s\S]*?-->/g;
  let commentMatch: RegExpExecArray | null;
  while ((commentMatch = commentRegex.exec(content)) !== null) {
    const segmentBeforeComment = commentMatch.index - originalOffset;
    if (cleanedConsumed + segmentBeforeComment > target) {
      return originalOffset + (target - cleanedConsumed);
    }
    cleanedConsumed += segmentBeforeComment;
    originalOffset = commentMatch.index + commentMatch[0].length;
  }
  return originalOffset + (target - cleanedConsumed);
}

/**
 * Best-effort cartridge name for a jobs.xml file.
 *
 * When `knownCartridgeRoots` is supplied (e.g. from `findCartridges()`), we
 * match by path prefix — this is the authoritative source and correctly labels
 * non-standard layouts (a cartridge directly under `src/`, cartridges under a
 * `cartridges/` container, etc.).
 *
 * When no roots are supplied (tests, or before the tree is initialised), we
 * fall back to walking up looking for a `cartridge` segment — the canonical
 * SFCC layout is `<name>/cartridge/**\/jobs.xml`. Uses exact-segment match so
 * `my-cartridge-utils/` and `cartridges/` don't false-match. Returns the
 * immediate parent directory as a last resort so a row is never unlabeled.
 */
export function detectCartridgeName(
  jobsXmlPath: string,
  knownCartridgeRoots?: ReadonlyArray<{name: string; src: string}>,
): string | undefined {
  if (knownCartridgeRoots && knownCartridgeRoots.length > 0) {
    // Longest-match wins — a cartridge nested under another cartridge should be
    // labelled by the inner one. In practice this is rare, but the sort keeps
    // the behavior deterministic.
    const normalized = path.normalize(jobsXmlPath);
    const bestMatch = [...knownCartridgeRoots]
      .filter((c) => {
        const root = path.normalize(c.src);
        const withSep = root.endsWith(path.sep) ? root : root + path.sep;
        return normalized === root || normalized.startsWith(withSep);
      })
      .sort((a, b) => b.src.length - a.src.length)[0];
    if (bestMatch) return bestMatch.name;
  }

  const parts = jobsXmlPath.split(/[/\\]/);
  for (let i = parts.length - 2; i >= 1; i--) {
    if (parts[i] === 'cartridge' && parts[i - 1]) {
      return parts[i - 1];
    }
  }
  return parts[parts.length - 2];
}
