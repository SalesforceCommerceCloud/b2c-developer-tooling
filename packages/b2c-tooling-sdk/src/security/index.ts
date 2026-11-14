/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Security scanning for B2C Commerce cartridge code.
 *
 * Rules are written as ESLint v9 rules over Script API JavaScript. The SDK
 * runs them without ESLint (parsing with espree and eslint-scope), and the
 * same rule objects can run in ESLint or oxlint.
 *
 * @example
 * ```typescript
 * import {scanSecurity, toSarif} from '@salesforce/b2c-tooling-sdk/security';
 *
 * const result = scanSecurity({root: '.', minSeverity: 'low'});
 * const open = result.findings.filter((f) => !f.suppression && !f.baselined);
 * const sarif = toSarif(result.findings, result.rules);
 * ```
 *
 * @module security
 */

export {
  REFERENCE_CARTRIDGES,
  collectSecurityScanFiles,
  listSecurityRules,
  scanSecurity,
  scanSecurityText,
  selectSecurityRules,
} from './engine.js';
export type {ScanSecurityTextOptions, SecurityScanError, SecurityScanOptions, SecurityScanResult} from './engine.js';

export {SECURITY_SETTINGS_KEY} from './script/project.js';
export type {SecurityRuleSettings} from './script/project.js';

export {applyBaseline, createBaseline, fingerprintFinding, parseBaseline} from './baseline.js';
export type {SecurityBaseline} from './baseline.js';

export {toSarif} from './sarif.js';
export type {ToSarifOptions} from './sarif.js';

export {findSuppression, parseSuppressions} from './suppressions.js';
export type {InlineSuppression} from './suppressions.js';

export {defineScriptRule, SECURITY_RULES_DOCS_URL} from './rule.js';
export type {
  AstNode,
  AstReference,
  AstScope,
  AstVariable,
  ScriptReportDescriptor,
  ScriptRule,
  ScriptRuleContext,
  ScriptRuleDefinition,
  ScriptRuleListener,
  ScriptSourceCode,
} from './rule.js';

export {runScriptRules} from './script/runner.js';
export type {ScriptComment, ScriptRuleReport, ScriptRunResult} from './script/runner.js';

export {SCRIPT_RULES} from './rules/index.js';

export {SECURITY_SEVERITIES, isAtLeastSeverity} from './types.js';
export type {
  SecurityAnalyzer,
  SecurityCategory,
  SecurityConfidence,
  SecurityFinding,
  SecurityLocation,
  SecurityRuleInfo,
  SecuritySeverity,
} from './types.js';
