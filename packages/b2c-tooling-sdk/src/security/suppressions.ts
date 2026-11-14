/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** A parsed inline suppression comment. */
export interface InlineSuppression {
  /** The 1-based line the suppression applies to. */
  line: number;
  ruleIds: ReadonlySet<string>;
  reason?: string;
}

const DIRECTIVE = /^\s*b2c-dx-disable-(next-line|line)\s+(.*)$/s;
/** Prefix accepted in front of rule IDs, matching how the ESLint plugin names them. */
const PLUGIN_PREFIX = 'b2c-security/';

/**
 * Parses `b2c-dx-disable-next-line` and `b2c-dx-disable-line` comments.
 *
 * A suppression must name one or more rule IDs (comma- or space-separated);
 * a reason after `--` is optional. IDs may carry the `b2c-security/` prefix.
 *
 * @example
 * ```js
 * // b2c-dx-disable-next-line open-redirect -- target is checked by isSafeRedirect()
 * res.redirect(req.querystring.returnUrl);
 * ```
 */
export function parseSuppressions(
  comments: ReadonlyArray<{value: string; loc: {start: {line: number}; end: {line: number}}}>,
): InlineSuppression[] {
  const result: InlineSuppression[] = [];
  for (const comment of comments) {
    const match = DIRECTIVE.exec(comment.value);
    if (!match) continue;
    const [body, ...reasonParts] = match[2].split(/(?:^|\s)--(?:\s|$)/);
    const ids = body
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith(PLUGIN_PREFIX) ? s.slice(PLUGIN_PREFIX.length) : s));
    if (ids.length === 0) continue;
    const reason = reasonParts.join(' -- ').replace(/\*\/$/, '').trim() || undefined;
    const line = match[1] === 'next-line' ? comment.loc.end.line + 1 : comment.loc.start.line;
    result.push({line, ruleIds: new Set(ids), reason});
  }
  return result;
}

/** Returns the suppression covering `ruleId` on `line`, if any. */
export function findSuppression(
  suppressions: readonly InlineSuppression[],
  ruleId: string,
  line: number,
): InlineSuppression | undefined {
  return suppressions.find((s) => s.line === line && s.ruleIds.has(ruleId));
}
