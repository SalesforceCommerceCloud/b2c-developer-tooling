/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import {createNodeFileSystemHost, discoverCartridges, DISCOVERY_IGNORED_DIRECTORIES} from '../cartridges/index.js';
import {applyBaseline, fingerprintFinding, type SecurityBaseline} from './baseline.js';
import type {ScriptRule} from './rule.js';
import {SCRIPT_RULES} from './rules/index.js';
import {runScriptRules} from './script/runner.js';
import {findSuppression, parseSuppressions} from './suppressions.js';
import {isAtLeastSeverity, type SecurityFinding, type SecurityRuleInfo, type SecuritySeverity} from './types.js';

/** Script file extensions the script analyzer reads. */
const SCRIPT_EXTENSIONS = new Set(['.js', '.ds']);

/**
 * Directories inside a cartridge that hold browser code or build output rather
 * than Script API code.
 */
const NON_SERVER_SEGMENTS = ['/cartridge/static/', '/cartridge/client/', '/node_modules/'];

/** Options for {@link scanSecurity}. */
export interface SecurityScanOptions {
  /** Directory that finding paths are relative to. Defaults to the current directory. */
  root?: string;
  /**
   * Files or directories to scan. Directories are searched for cartridges
   * (folders with a `.project` file) and their server-side scripts. Defaults to `root`.
   */
  paths?: string[];
  /** Run only these rule IDs. */
  rules?: string[];
  /** Skip these rule IDs. */
  excludeRules?: string[];
  /** Drop findings below this severity. */
  minSeverity?: SecuritySeverity;
  /** Mark findings that match this baseline. */
  baseline?: SecurityBaseline;
}

/** A file that could not be analyzed. */
export interface SecurityScanError {
  file: string;
  message: string;
}

/** The result of a scan. */
export interface SecurityScanResult {
  root: string;
  filesScanned: number;
  /** All findings, including suppressed and baselined ones (see their flags). */
  findings: SecurityFinding[];
  /** Files that could not be parsed. Legacy `.ds` files with type annotations land here. */
  errors: SecurityScanError[];
  /** The rules that ran. */
  rules: SecurityRuleInfo[];
}

/** Every built-in rule's metadata. */
export function listSecurityRules(): SecurityRuleInfo[] {
  return SCRIPT_RULES.map((r) => r.meta.b2c);
}

/** Resolves the rules to run from include/exclude lists, rejecting unknown IDs. */
export function selectSecurityRules(include?: readonly string[], exclude?: readonly string[]): ScriptRule[] {
  const known = new Set(SCRIPT_RULES.map((r) => r.meta.b2c.id));
  const unknown = [...(include ?? []), ...(exclude ?? [])].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown security rule ID(s): ${unknown.join(', ')}. Known rules: ${[...known].sort().join(', ')}`);
  }
  return SCRIPT_RULES.filter(
    (r) => (!include || include.length === 0 || include.includes(r.meta.b2c.id)) && !exclude?.includes(r.meta.b2c.id),
  );
}

/**
 * Collects server-side script files to scan. Explicit files are always
 * included; directories contribute the scripts inside the cartridges found
 * below them, skipping static, client, and dependency folders.
 */
export function collectSecurityScanFiles(paths: readonly string[]): string[] {
  const host = createNodeFileSystemHost();
  const files = new Set<string>();
  for (const p of paths) {
    const abs = path.resolve(p);
    const stat = fs.statSync(abs, {throwIfNoEntry: false});
    if (!stat) throw new Error(`Path not found: ${p}`);
    if (stat.isFile()) {
      files.add(abs);
      continue;
    }
    const cartridges = host.fileExists(path.join(abs, '.project'))
      ? [{name: path.basename(abs), src: abs}]
      : discoverCartridges(abs, host);
    for (const cartridge of cartridges) {
      for (const file of walk(cartridge.src)) files.add(file);
    }
  }
  return [...files].sort();
}

function* walk(dir: string): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, {withFileTypes: true});
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (DISCOVERY_IGNORED_DIRECTORIES.has(entry.name)) continue;
      if (NON_SERVER_SEGMENTS.some((seg) => (full.split(path.sep).join('/') + '/').includes(seg))) continue;
      yield* walk(full);
    } else if (entry.isFile() && SCRIPT_EXTENSIONS.has(path.extname(entry.name)) && !entry.name.endsWith('.min.js')) {
      yield full;
    }
  }
}

/**
 * Scans B2C Commerce cartridge code for security problems.
 *
 * @example
 * ```typescript
 * import {scanSecurity} from '@salesforce/b2c-tooling-sdk/security';
 *
 * const result = scanSecurity({root: './my-project', minSeverity: 'medium'});
 * for (const f of result.findings.filter((f) => !f.suppression && !f.baselined)) {
 *   console.log(`${f.location.file}:${f.location.startLine} ${f.ruleId} ${f.message}`);
 * }
 * ```
 */
export function scanSecurity(options: SecurityScanOptions = {}): SecurityScanResult {
  const root = path.resolve(options.root ?? process.cwd());
  const rules = selectSecurityRules(options.rules, options.excludeRules);
  const files = collectSecurityScanFiles(options.paths && options.paths.length > 0 ? options.paths : [root]);
  const findings: SecurityFinding[] = [];
  const errors: SecurityScanError[] = [];

  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const text = fs.readFileSync(file, 'utf8');
    findings.push(...scanSecurityText(text, relative, rules, errors));
  }

  let result = findings;
  if (options.minSeverity) result = result.filter((f) => isAtLeastSeverity(f.severity, options.minSeverity!));
  if (options.baseline) result = applyBaseline(result, options.baseline);

  return {root, filesScanned: files.length, findings: result, errors, rules: rules.map((r) => r.meta.b2c)};
}

/**
 * Scans one file's text. `file` is the path recorded in findings (relative to
 * the scan root). Parse failures are appended to `errors` when given.
 */
export function scanSecurityText(
  text: string,
  file: string,
  rules: readonly ScriptRule[] = SCRIPT_RULES,
  errors?: SecurityScanError[],
): SecurityFinding[] {
  const run = runScriptRules(text, file, rules);
  if (run.parseError) {
    errors?.push({file, message: `Could not parse: ${run.parseError.message}`});
    return [];
  }
  const suppressions = parseSuppressions(run.comments);
  const lines = text.split(/\r?\n/);
  const byId = new Map(rules.map((r) => [r.meta.b2c.id, r.meta.b2c]));
  const occurrences = new Map<string, number>();

  return run.reports.map((report) => {
    const info = byId.get(report.ruleId)!;
    const snippet = (lines[report.line - 1] ?? '').trim();
    const key = `${report.ruleId}\0${snippet}`;
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    const suppression = findSuppression(suppressions, report.ruleId, report.line);
    return {
      ruleId: report.ruleId,
      severity: info.severity,
      confidence: info.confidence,
      category: info.category,
      cwe: info.cwe,
      message: report.message,
      location: {
        file,
        startLine: report.line,
        startColumn: report.column,
        endLine: report.endLine,
        endColumn: report.endColumn,
      },
      snippet,
      remediation: info.remediation,
      docsUrl: info.docsUrl,
      fingerprint: fingerprintFinding(report.ruleId, file, snippet, occurrence),
      ...(suppression
        ? {suppression: {kind: 'inline' as const, ...(suppression.reason ? {reason: suppression.reason} : {})}}
        : {}),
    };
  });
}
