/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
import {glob, hasMagic} from 'glob';
import {Minimatch} from 'minimatch';
import {getXmlValidatorEngine} from './engine.js';
import {findBundledXmlSchema, readRootElement, resolveXmlSchema} from './schemas.js';
import type {
  CollectedXmlFiles,
  CollectXmlFilesOptions,
  ValidateXmlFilesOptions,
  ValidateXmlOptions,
  XmlValidationResult,
  XmlValidationSummary,
} from './types.js';

const ALWAYS_IGNORED = ['**/node_modules/**', '**/.git/**'];

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Find the XML files to validate. Each input may be a file, a directory (searched recursively for `*.xml`),
 * or a glob pattern. `node_modules` and `.git` directories are never searched.
 *
 * @example
 * ```typescript
 * const {files, explicitFiles} = await collectXmlFiles(['./site_template'], {exclude: ['**\/sites/**']});
 * ```
 */
export async function collectXmlFiles(
  inputs: string[],
  options: CollectXmlFilesOptions = {},
): Promise<CollectedXmlFiles> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const excludes = (options.exclude ?? []).map((pattern) => new Minimatch(pattern, {dot: true}));
  const isExcluded = (file: string) => {
    const relative = toPosix(path.relative(cwd, file));
    return excludes.some((m) => m.match(relative) || m.match(toPosix(file)));
  };

  const files = new Set<string>();
  const explicitFiles = new Set<string>();
  const unmatched: string[] = [];

  for (const input of inputs) {
    const absolute = path.resolve(cwd, input);
    const stat = fs.statSync(absolute, {throwIfNoEntry: false});
    let matches: string[];
    if (stat?.isFile()) {
      explicitFiles.add(absolute);
      matches = [absolute];
    } else if (stat?.isDirectory()) {
      matches = await glob('**/*.xml', {cwd: absolute, absolute: true, nodir: true, dot: true, ignore: ALWAYS_IGNORED});
      matches = matches.filter((file) => !isExcluded(file));
    } else if (hasMagic(toPosix(input))) {
      matches = await glob(toPosix(input), {cwd, absolute: true, nodir: true, dot: true, ignore: ALWAYS_IGNORED});
      matches = matches.filter((file) => !isExcluded(file));
    } else {
      matches = [];
    }
    if (matches.length === 0) unmatched.push(input);
    for (const file of matches) files.add(path.normalize(file));
  }

  return {explicitFiles, files: [...files].sort(), unmatched};
}

/**
 * Validate one XML file against a B2C Commerce schema.
 *
 * Without a `schema` option, the schema is chosen from the namespace of the root element (for example,
 * `http://www.demandware.com/xml/impex/catalog/2006-10-31` selects `catalog`). A well-formed file with no
 * matching schema is skipped; a malformed one fails.
 *
 * @param filePath - Path to the XML file
 * @param options - Validation options
 * @param explicit - When true, a file with no matching schema fails instead of being skipped
 * @throws XmlSchemaLoadError when a custom `.xsd` does not compile
 *
 * @example
 * ```typescript
 * const result = await validateXmlFile('catalog.xml');
 * if (!result.valid) {
 *   for (const error of result.errors) console.log(`line ${error.line}: ${error.message}`);
 * }
 * ```
 */
export async function validateXmlFile(
  filePath: string,
  options: ValidateXmlOptions = {},
  explicit = false,
): Promise<XmlValidationResult> {
  let contents: Buffer;
  try {
    contents = await fs.promises.readFile(filePath);
  } catch (error) {
    return {
      errors: [],
      filePath,
      reason: `Could not read file: ${(error as Error).message}`,
      status: 'fail',
      valid: false,
      warnings: [],
    };
  }
  return validateXmlContent(contents, options, {explicit, filePath});
}

/**
 * Validate an XML document held in memory. Behaves like {@link validateXmlFile}, except that a document with
 * no matching bundled schema fails unless `explicit` is false.
 *
 * @param contents - The document, as text or bytes
 * @param options - Validation options
 * @param source - `filePath` to report in the result (defaults to `<content>`), and whether the document was
 *   named explicitly (defaults to true)
 * @throws XmlSchemaLoadError when a custom `.xsd` does not compile
 */
export async function validateXmlContent(
  contents: string | Uint8Array,
  options: ValidateXmlOptions = {},
  source: {explicit?: boolean; filePath?: string} = {},
): Promise<XmlValidationResult> {
  const bytes = typeof contents === 'string' ? Buffer.from(contents) : contents;
  const result: XmlValidationResult = {
    errors: [],
    filePath: source.filePath ?? '<content>',
    status: 'fail',
    valid: false,
    warnings: [],
  };

  const root = readRootElement(bytes);
  if (root) {
    result.rootElement = root.localName;
    if (root.namespace) result.namespace = root.namespace;
  }

  let schemaPath: string | undefined;
  if (options.schema) {
    const resolved = resolveXmlSchema(options.schema, options.cwd);
    result.schema = resolved.label;
    schemaPath = resolved.path;
  } else if (root?.namespace) {
    const bundled = findBundledXmlSchema(root.namespace, root.localName);
    if (bundled) {
      result.schema = bundled.id;
      schemaPath = bundled.path;
    }
  }

  const engine = await getXmlValidatorEngine();
  // With no schema, still check that the document is well-formed.
  const outcome = engine.validateDocument(bytes, schemaPath ? engine.schemaHandle(schemaPath) : 0);
  for (const diagnostic of outcome.diagnostics) {
    (diagnostic.severity === 'warning' ? result.warnings : result.errors).push(diagnostic);
  }
  if (outcome.truncated) result.truncated = true;

  if (outcome.status !== 0 || result.errors.length > 0) {
    if (outcome.status === 2) result.reason = 'Could not parse document';
    else if (result.errors.length === 0) result.reason = 'Validation failed without diagnostics';
    return result;
  }

  if (!schemaPath) {
    const reason = root?.namespace
      ? `No bundled schema for namespace ${root.namespace}`
      : 'Root element has no namespace, so no bundled schema applies';
    if (source.explicit ?? true) return {...result, reason: `${reason}. Choose one with the schema option.`};
    return {...result, reason, status: 'skip'};
  }

  return {...result, status: 'pass', valid: true};
}

/**
 * Validate a set of XML files. Files are validated one at a time; compiled schemas are reused across files.
 *
 * @example
 * ```typescript
 * const {files, explicitFiles} = await collectXmlFiles(['./site_template']);
 * const summary = await validateXmlFiles(files, {explicitFiles});
 * console.log(`${summary.validFiles}/${summary.totalFiles} valid`);
 * ```
 */
export async function validateXmlFiles(
  files: string[],
  options: ValidateXmlFilesOptions = {},
): Promise<XmlValidationSummary> {
  const results: XmlValidationResult[] = [];
  for (const file of files) {
    const result = await validateXmlFile(file, options, options.explicitFiles?.has(file) ?? false);
    results.push(result);
    options.onResult?.(result);
    if (options.failFast && result.status === 'fail') break;
  }

  return {
    failedFiles: results.filter((r) => r.status === 'fail').length,
    results,
    skippedFiles: results.filter((r) => r.status === 'skip').length,
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    totalFiles: results.length,
    validFiles: results.filter((r) => r.valid).length,
  };
}
