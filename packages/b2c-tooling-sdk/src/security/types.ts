/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/** Finding severity, most severe first. */
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Severities ordered from most to least severe. */
export const SECURITY_SEVERITIES: readonly SecuritySeverity[] = Object.freeze([
  'critical',
  'high',
  'medium',
  'low',
  'info',
]);

/**
 * How sure a rule is that a finding is a real problem. `low` findings are
 * candidates for a person or an agent to judge (for example, whether a logged
 * value is personal data).
 */
export type SecurityConfidence = 'high' | 'medium' | 'low';

/** Broad finding categories. */
export type SecurityCategory =
  | 'authz'
  | 'config'
  | 'crypto'
  | 'csrf'
  | 'injection'
  | 'pii'
  | 'redirect'
  | 'secrets'
  | 'session'
  | 'xss';

/** The analyzer that runs a rule. */
export type SecurityAnalyzer = 'script';

/** Descriptive metadata every security rule carries. */
export interface SecurityRuleInfo {
  /** Stable rule ID, kebab-case (for example `open-redirect`). Public contract once released. */
  id: string;
  analyzer: SecurityAnalyzer;
  severity: SecuritySeverity;
  confidence: SecurityConfidence;
  category: SecurityCategory;
  /** CWE identifiers, for example `CWE-601`. */
  cwe: readonly string[];
  /** One-sentence summary of what the rule finds. */
  description: string;
  /** Short guidance on how to fix a finding. */
  remediation: string;
  /** Link to the rule's documentation. */
  docsUrl: string;
}

/** A location in a scanned file. Lines and columns are 1-based. */
export interface SecurityLocation {
  /** File path relative to the scan root, with forward slashes. */
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/** A single security finding. */
export interface SecurityFinding {
  ruleId: string;
  severity: SecuritySeverity;
  confidence: SecurityConfidence;
  category: SecurityCategory;
  cwe: readonly string[];
  message: string;
  location: SecurityLocation;
  /** The source line the finding starts on, trimmed. */
  snippet: string;
  remediation: string;
  docsUrl: string;
  /** Stable identifier used by baselines; survives line moves. */
  fingerprint: string;
  /** Set when an inline comment suppresses the finding. */
  suppression?: {kind: 'inline'; reason?: string};
  /** True when the finding matches the baseline. */
  baselined?: boolean;
}

/** Returns true when `severity` is at least as severe as `threshold`. */
export function isAtLeastSeverity(severity: SecuritySeverity, threshold: SecuritySeverity): boolean {
  return SECURITY_SEVERITIES.indexOf(severity) <= SECURITY_SEVERITIES.indexOf(threshold);
}
