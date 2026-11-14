/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {createHash} from 'node:crypto';

import type {SecurityFinding} from './types.js';

/** A baseline: findings accepted as known, so only new findings are reported. */
export interface SecurityBaseline {
  version: 1;
  findings: Array<{ruleId: string; file: string; fingerprint: string; message: string}>;
}

/**
 * Computes a fingerprint from the rule, file, and the trimmed source line, so
 * it survives code moving up or down. `occurrence` distinguishes identical
 * lines in the same file.
 */
export function fingerprintFinding(ruleId: string, file: string, snippet: string, occurrence: number): string {
  return createHash('sha256')
    .update([ruleId, file, snippet.replace(/\s+/g, ' ').trim(), String(occurrence)].join('\0'))
    .digest('hex')
    .slice(0, 32);
}

/** Creates a baseline from findings (suppressed findings are left out). */
export function createBaseline(findings: readonly SecurityFinding[]): SecurityBaseline {
  return {
    version: 1,
    findings: findings
      .filter((f) => !f.suppression)
      .map((f) => ({ruleId: f.ruleId, file: f.location.file, fingerprint: f.fingerprint, message: f.message}))
      .sort(
        (a, b) =>
          a.file.localeCompare(b.file) ||
          a.ruleId.localeCompare(b.ruleId) ||
          a.fingerprint.localeCompare(b.fingerprint),
      ),
  };
}

/** Parses and validates baseline JSON. */
export function parseBaseline(json: string): SecurityBaseline {
  const data = JSON.parse(json) as Partial<SecurityBaseline>;
  if (data.version !== 1 || !Array.isArray(data.findings)) {
    throw new Error('Not a security baseline file (expected {"version": 1, "findings": [...]})');
  }
  return data as SecurityBaseline;
}

/** Marks findings whose fingerprints appear in the baseline. Returns new finding objects. */
export function applyBaseline(findings: readonly SecurityFinding[], baseline: SecurityBaseline): SecurityFinding[] {
  const known = new Set(baseline.findings.map((f) => f.fingerprint));
  return findings.map((f) => (known.has(f.fingerprint) ? {...f, baselined: true} : f));
}
