/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  CartridgeResolver,
  createNodeFileSystemHost,
  discoverCartridges,
  DISCOVERY_IGNORED_DIRECTORIES,
} from '../cartridges/index.js';
import {buildProjectIndex} from '../project-index/build.js';
import type {ProjectIndex} from '../project-index/types.js';
import {applyBaseline, fingerprintFinding, type SecurityBaseline} from './baseline.js';
import type {ScriptRule} from './rule.js';
import {SCRIPT_RULES} from './rules/index.js';
import {SECURITY_SETTINGS_KEY} from './script/project.js';
import {runScriptRules, type ScriptComment, type ScriptRuleReport} from './script/runner.js';
import {METADATA_RULES} from './metadata/rules/index.js';
import {metadataKindOfFile, runMetadataRules} from './metadata/run.js';
import type {MetadataFileKind, MetadataRule} from './metadata/types.js';
import {findSuppression, parseSuppressions} from './suppressions.js';
import {isAtLeastSeverity, type SecurityFinding, type SecurityRuleInfo, type SecuritySeverity} from './types.js';

/** Script file extensions the script analyzer reads. */
const SCRIPT_EXTENSIONS = new Set(['.js', '.ds']);

/**
 * Directories inside a cartridge that hold browser code or build output rather
 * than Script API code.
 */
const NON_SERVER_SEGMENTS = ['/cartridge/static/', '/cartridge/client/', '/node_modules/'];

/**
 * Cartridges that ship with SFRA and SiteGenesis. Findings in them are real
 * exposures for any storefront that deploys them (fix them with an overlay
 * cartridge), so they are reported, tagged with `referenceCartridge`, and can
 * be left out with `excludeReferenceCartridges`.
 */
export const REFERENCE_CARTRIDGES: ReadonlySet<string> = new Set([
  'app_storefront_base',
  'bm_app_storefront_base',
  'modules',
  'app_storefront_controllers',
  'app_storefront_core',
  'app_storefront_pipelines',
]);

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
  /** Cartridge path order (names) used to compose routes across cartridges. */
  cartridgePath?: string[];
  /** Leave out findings inside SFRA and SiteGenesis reference cartridges ({@link REFERENCE_CARTRIDGES}). */
  excludeReferenceCartridges?: boolean;
  /** A project index to use instead of building one from `root` and `paths`. */
  projectIndex?: ProjectIndex;
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
  /** Findings left out because they are inside reference cartridges (see `excludeReferenceCartridges`). */
  hiddenReferenceFindings: number;
  /** Endpoints in the project index the rules used. */
  indexedEndpoints: number;
}

/** A built-in rule of either analyzer. */
export type SecurityRule = MetadataRule | ScriptRule;

/** Every built-in rule, script rules first. */
export const SECURITY_RULES: readonly SecurityRule[] = Object.freeze([...SCRIPT_RULES, ...METADATA_RULES]);

/** Every built-in rule's metadata. */
export function listSecurityRules(): SecurityRuleInfo[] {
  return SECURITY_RULES.map((r) => r.meta.b2c);
}

/** Resolves the rules to run from include/exclude lists, rejecting unknown IDs. */
export function selectSecurityRules(include?: readonly string[], exclude?: readonly string[]): SecurityRule[] {
  const known = new Set(SECURITY_RULES.map((r) => r.meta.b2c.id));
  const unknown = [...(include ?? []), ...(exclude ?? [])].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(`Unknown security rule ID(s): ${unknown.join(', ')}. Known rules: ${[...known].sort().join(', ')}`);
  }
  return SECURITY_RULES.filter(
    (r) => (!include || include.length === 0 || include.includes(r.meta.b2c.id)) && !exclude?.includes(r.meta.b2c.id),
  );
}

function isScriptRule(rule: SecurityRule): rule is ScriptRule {
  return rule.meta.b2c.analyzer === 'script';
}

function isMetadataRule(rule: SecurityRule): rule is MetadataRule {
  return rule.meta.b2c.analyzer === 'metadata';
}

/**
 * Collects metadata files to scan below the given paths: services.xml,
 * preferences.xml, metadata (attribute definitions), the CSRF allowlist, and
 * OCAPI settings JSON, wherever they are (site archives, site_template
 * folders). Files are recognized by their XML root element or OCAPI settings
 * file name.
 */
export function collectMetadataFiles(paths: readonly string[]): Array<{file: string; kind: MetadataFileKind}> {
  const found = new Map<string, MetadataFileKind>();
  const visit = (file: string) => {
    const kind = metadataKindOfFile(file);
    if (kind) found.set(file, kind);
  };
  const walkAll = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, {withFileTypes: true});
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (DISCOVERY_IGNORED_DIRECTORIES.has(entry.name) || entry.name === 'static') continue;
        walkAll(full);
      } else if (entry.isFile()) {
        visit(full);
      }
    }
  };
  for (const p of paths) {
    const abs = path.resolve(p);
    const stat = fs.statSync(abs, {throwIfNoEntry: false});
    if (!stat) throw new Error(`Path not found: ${p}`);
    if (stat.isFile()) visit(abs);
    else walkAll(abs);
  }
  return [...found].sort(([a], [b]) => a.localeCompare(b)).map(([file, kind]) => ({file, kind}));
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
  const scriptRules = rules.filter(isScriptRule);
  const metadataRules = rules.filter(isMetadataRule);
  const paths = options.paths && options.paths.length > 0 ? options.paths : [root];
  const files = scriptRules.length > 0 ? collectSecurityScanFiles(paths) : [];
  const metadataFiles = metadataRules.length > 0 ? collectMetadataFiles(paths) : [];
  const projectIndex =
    options.projectIndex ??
    buildProjectIndex({
      root,
      paths: paths.filter((p) => path.resolve(p) !== root),
      cartridgePath: options.cartridgePath,
    });
  const resolver = new CartridgeResolver(projectIndex.cartridges, createNodeFileSystemHost());
  const settings = {[SECURITY_SETTINGS_KEY]: {projectIndex}};
  const findings: SecurityFinding[] = [];
  const errors: SecurityScanError[] = [];
  let hiddenReferenceFindings = 0;
  const relativeTo = (file: string) => path.relative(root, file).split(path.sep).join('/');

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const fileFindings = scanSecurityText(text, relativeTo(file), scriptRules, errors, {filename: file, settings});
    const owner = resolver.ownerOf(file)?.name;
    if (owner && REFERENCE_CARTRIDGES.has(owner)) {
      if (options.excludeReferenceCartridges) {
        hiddenReferenceFindings += fileFindings.length;
        continue;
      }
      for (const f of fileFindings) f.referenceCartridge = owner;
    }
    findings.push(...fileFindings);
  }

  for (const {file, kind} of metadataFiles) {
    const text = fs.readFileSync(file, 'utf8');
    findings.push(...scanMetadataText(text, relativeTo(file), kind, metadataRules, errors));
  }

  let result = findings;
  if (options.minSeverity) result = result.filter((f) => isAtLeastSeverity(f.severity, options.minSeverity!));
  if (options.baseline) result = applyBaseline(result, options.baseline);

  return {
    root,
    filesScanned: files.length + metadataFiles.length,
    findings: result,
    errors,
    rules: rules.map((r) => r.meta.b2c),
    hiddenReferenceFindings,
    indexedEndpoints: projectIndex.endpoints.length,
  };
}

/** Options for {@link scanSecurityText}. */
export interface ScanSecurityTextOptions {
  /** The file name rules see (absolute path); defaults to `file`. Project-aware rules match it against the index. */
  filename?: string;
  /** Rule settings, for example `{b2cSecurity: {projectIndex}}`. */
  settings?: Record<string, unknown>;
}

/**
 * Scans one file's text. `file` is the path recorded in findings (relative to
 * the scan root). Parse failures are appended to `errors` when given.
 */
export function scanSecurityText(
  text: string,
  file: string,
  rules: readonly SecurityRule[] = SCRIPT_RULES,
  errors?: SecurityScanError[],
  options: ScanSecurityTextOptions = {},
): SecurityFinding[] {
  const scriptRules = rules.filter(isScriptRule);
  const run = runScriptRules(text, options.filename ?? file, scriptRules, options.settings);
  if (run.parseError) {
    errors?.push({file, message: `Could not parse: ${run.parseError.message}`});
    return [];
  }
  return toFindings(run.reports, run.comments, text, file, scriptRules);
}

/**
 * Scans one metadata file's text. `kind` is the metadata file kind (see
 * {@link collectMetadataFiles}); `file` is the path recorded in findings.
 */
export function scanMetadataText(
  text: string,
  file: string,
  kind: MetadataFileKind,
  rules: readonly SecurityRule[] = METADATA_RULES,
  errors?: SecurityScanError[],
): SecurityFinding[] {
  const metadataRules = rules.filter(isMetadataRule);
  const run = runMetadataRules(text, file, kind, metadataRules);
  if (run.parseError) {
    errors?.push({file, message: `Could not parse: ${run.parseError.message}`});
    return [];
  }
  return toFindings(run.reports, run.comments, text, file, metadataRules);
}

function toFindings(
  reports: readonly ScriptRuleReport[],
  comments: readonly ScriptComment[],
  text: string,
  file: string,
  rules: readonly SecurityRule[],
): SecurityFinding[] {
  const suppressions = parseSuppressions(comments);
  const lines = text.split(/\r?\n/);
  const byId = new Map(rules.map((r) => [r.meta.b2c.id, r.meta.b2c]));
  const occurrences = new Map<string, number>();

  return reports.map((report) => {
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
