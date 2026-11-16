/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {SecurityFinding, SecurityRuleInfo, SecuritySeverity} from './types.js';

const LEVEL: Record<SecuritySeverity, 'error' | 'note' | 'warning'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'note',
  info: 'note',
};

/** GitHub code scanning reads `security-severity` (0-10) to rank alerts. */
const SECURITY_SEVERITY: Record<SecuritySeverity, string> = {
  critical: '9.5',
  high: '8.0',
  medium: '5.5',
  low: '3.0',
  info: '1.0',
};

/** Options for {@link toSarif}. */
export interface ToSarifOptions {
  toolVersion?: string;
  /** Include suppressed and baselined findings, marked as suppressed. Defaults to true. */
  includeSuppressed?: boolean;
}

/**
 * Converts findings to a SARIF 2.1.0 log for GitHub code scanning and other
 * SARIF consumers. File locations are relative to `%SRCROOT%`.
 */
export function toSarif(
  findings: readonly SecurityFinding[],
  rules: readonly SecurityRuleInfo[],
  options: ToSarifOptions = {},
): object {
  const includeSuppressed = options.includeSuppressed ?? true;
  const ruleIndex = new Map(rules.map((r, i) => [r.id, i]));
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'b2c-security',
            informationUri: 'https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/code-security',
            ...(options.toolVersion ? {version: options.toolVersion} : {}),
            rules: rules.map((r) => ({
              id: r.id,
              shortDescription: {text: r.description},
              help: {text: r.remediation},
              helpUri: r.docsUrl,
              defaultConfiguration: {level: LEVEL[r.severity]},
              properties: {
                tags: ['security', r.category, ...r.cwe.map((c) => `external/cwe/${c.toLowerCase()}`)],
                precision: r.confidence === 'high' ? 'high' : r.confidence === 'medium' ? 'medium' : 'low',
                'security-severity': SECURITY_SEVERITY[r.severity],
              },
            })),
          },
        },
        originalUriBaseIds: {'%SRCROOT%': {uri: './'}},
        results: findings
          .filter((f) => includeSuppressed || (!f.suppression && !f.baselined))
          .map((f) => ({
            ruleId: f.ruleId,
            ...(ruleIndex.has(f.ruleId) ? {ruleIndex: ruleIndex.get(f.ruleId)} : {}),
            level: LEVEL[f.severity],
            message: {text: f.message},
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {uri: f.location.file, uriBaseId: '%SRCROOT%'},
                  region: {
                    startLine: f.location.startLine,
                    startColumn: f.location.startColumn,
                    endLine: f.location.endLine,
                    endColumn: f.location.endColumn,
                  },
                },
              },
            ],
            partialFingerprints: {'b2cSecurity/v1': f.fingerprint},
            ...(f.suppression || f.baselined
              ? {
                  suppressions: [
                    f.suppression
                      ? {kind: 'inSource', ...(f.suppression.reason ? {justification: f.suppression.reason} : {})}
                      : {kind: 'external', justification: 'baseline'},
                  ],
                }
              : {}),
          })),
      },
    ],
  };
}
