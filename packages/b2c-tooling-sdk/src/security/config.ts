/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import {Minimatch} from 'minimatch';

import {SECURITY_SEVERITIES, type SecurityFinding, type SecuritySeverity} from './types.js';

/** Project security settings file, read from the scan root. */
export const SECURITY_CONFIG_FILE = '.b2c-security.json';

/** A rule's setting: `off`, a severity, or a severity and paths to ignore. */
export type SecurityRuleSetting = 'off' | SecuritySeverity | {severity?: SecuritySeverity; ignore?: string[]};

/**
 * Project security settings, usually checked in as `.b2c-security.json`.
 *
 * @example
 * ```json
 * {
 *   "ignore": ["cartridges/bm_*\/**"],
 *   "rules": {
 *     "pii-in-logs": "off",
 *     "weak-crypto": "low",
 *     "dynamic-code": {"ignore": ["cartridges/int_legacy/**"]}
 *   }
 * }
 * ```
 */
export interface SecurityConfig {
  /** Paths (globs relative to the scan root) that are not scanned. */
  ignore?: string[];
  /** Per-rule settings keyed by rule ID. */
  rules?: Record<string, SecurityRuleSetting>;
}

/** Validates and returns a parsed security config. Throws with the offending key on invalid input. */
export function parseSecurityConfig(text: string, file = SECURITY_CONFIG_FILE): SecurityConfig {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`${file}: invalid JSON (${(error as Error).message})`);
  }
  return validateSecurityConfig(data, file);
}

/**
 * Validates a security config object, such as the `security` key of dw.json.
 * `source` names it in error messages.
 */
export function validateSecurityConfig(data: unknown, source = SECURITY_CONFIG_FILE): SecurityConfig {
  const file = source;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${file}: expected an object`);
  const {ignore, rules} = data as Record<string, unknown>;
  const strings = (value: unknown, key: string): string[] | undefined => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new Error(`${file}: "${key}" must be an array of glob strings`);
    }
    return value as string[];
  };
  const severity = (value: unknown, key: string): SecuritySeverity | undefined => {
    if (value === undefined) return undefined;
    if (!SECURITY_SEVERITIES.includes(value as SecuritySeverity)) {
      throw new Error(`${file}: "${key}" must be one of off, ${SECURITY_SEVERITIES.join(', ')}`);
    }
    return value as SecuritySeverity;
  };
  const config: SecurityConfig = {};
  const ignored = strings(ignore, 'ignore');
  if (ignored) config.ignore = ignored;
  if (rules !== undefined) {
    if (!rules || typeof rules !== 'object' || Array.isArray(rules))
      throw new Error(`${file}: "rules" must be an object`);
    config.rules = {};
    for (const [id, setting] of Object.entries(rules)) {
      const key = `rules.${id}`;
      if (setting === 'off') config.rules[id] = 'off';
      else if (typeof setting === 'string') config.rules[id] = severity(setting, key)!;
      else if (setting && typeof setting === 'object' && !Array.isArray(setting)) {
        const s = setting as Record<string, unknown>;
        config.rules[id] = {
          ...(s.severity === undefined ? {} : {severity: severity(s.severity, `${key}.severity`)}),
          ...(s.ignore === undefined ? {} : {ignore: strings(s.ignore, `${key}.ignore`)}),
        };
      } else {
        throw new Error(`${file}: "${key}" must be "off", a severity, or {severity, ignore}`);
      }
    }
  }
  return config;
}

/** Reads `.b2c-security.json` from `root`, or returns undefined when there is none. */
export function loadSecurityConfig(root: string): {config: SecurityConfig; file: string} | undefined {
  const file = path.join(root, SECURITY_CONFIG_FILE);
  if (!fs.existsSync(file)) return undefined;
  return {config: parseSecurityConfig(fs.readFileSync(file, 'utf8'), file), file};
}

/** Rule IDs a config turns off. */
export function disabledRules(config: SecurityConfig | undefined): string[] {
  return Object.entries(config?.rules ?? {})
    .filter(([, setting]) => setting === 'off')
    .map(([id]) => id);
}

function trimSlashes(pattern: string): string {
  let end = pattern.length;
  while (end > 0 && pattern[end - 1] === '/') end--;
  return pattern.slice(0, end);
}

function matcher(patterns: readonly string[]): (file: string) => boolean {
  // A pattern naming a directory (`cartridges/bm_tools`) also covers the files inside it.
  const compiled = patterns
    .map((p) => trimSlashes(p.startsWith('./') ? p.slice(2) : p))
    .flatMap((p) => [p, `${p}/**`])
    .map((p) => new Minimatch(p, {dot: true}));
  return (file) => compiled.some((m) => m.match(file));
}

/** Returns a test for paths (relative to the root, forward slashes) that the config and extra globs ignore. */
export function ignoredPathTest(
  config: SecurityConfig | undefined,
  extra: readonly string[] = [],
): (file: string) => boolean {
  const patterns = [...(config?.ignore ?? []), ...extra];
  if (patterns.length === 0) return () => false;
  return matcher(patterns);
}

/**
 * Applies per-rule settings to findings: drops findings in a rule's ignored
 * paths and replaces the severity where the config sets one.
 */
export function applyRuleSettings(findings: SecurityFinding[], config: SecurityConfig | undefined): SecurityFinding[] {
  const rules = config?.rules;
  if (!rules) return findings;
  const ignores = new Map<string, (file: string) => boolean>();
  for (const [id, setting] of Object.entries(rules)) {
    if (typeof setting === 'object' && setting.ignore?.length) ignores.set(id, matcher(setting.ignore));
  }
  const result: SecurityFinding[] = [];
  for (const finding of findings) {
    if (ignores.get(finding.ruleId)?.(finding.location.file)) continue;
    const setting = rules[finding.ruleId];
    const severity = typeof setting === 'string' ? setting : setting?.severity;
    result.push(severity && severity !== 'off' ? {...finding, severity} : finding);
  }
  return result;
}
