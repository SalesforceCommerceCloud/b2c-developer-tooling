/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const packageJsonPath = path.join(pkgRoot, 'package.json');
const mappingsPath = path.join(pkgRoot, 'resources', 'xsd-mappings.json');
const xsdDir = path.join(pkgRoot, 'resources', 'xsd');

interface XmlValidationEntry {
  fileMatch: string;
  url: string;
}

interface MappingEntry {
  schema: string;
  fileMatch: string[];
}

interface MappingsFile {
  mappings: MappingEntry[];
  bundleOnly: string[];
  skipped: string[];
}

function readPackageJson(): {contributes?: {xmlValidation?: XmlValidationEntry[]}} {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function readMappings(): MappingEntry[] {
  return JSON.parse(fs.readFileSync(mappingsPath, 'utf8')).mappings;
}

function readMappingsFile(): MappingsFile {
  const parsed = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  return {mappings: parsed.mappings, bundleOnly: parsed.bundleOnly ?? [], skipped: parsed.skipped ?? []};
}

function listSdkXsds(): string[] {
  const sdkXsdDir = path.resolve(pkgRoot, '..', 'b2c-tooling-sdk', 'data', 'xsd');
  return fs
    .readdirSync(sdkXsdDir)
    .filter((name) => name.endsWith('.xsd'))
    .sort();
}

suite('XML schema validation contribution', () => {
  test('package.json has xmlValidation entries', () => {
    const entries = readPackageJson().contributes?.xmlValidation ?? [];
    assert.ok(entries.length > 0, 'expected at least one xmlValidation entry');
  });

  test('every xmlValidation url resolves to an XSD file on disk', () => {
    const entries = readPackageJson().contributes?.xmlValidation ?? [];
    for (const entry of entries) {
      assert.ok(entry.url.startsWith('./resources/xsd/'), `unexpected url shape: ${entry.url}`);
      const abs = path.resolve(pkgRoot, entry.url);
      assert.ok(fs.existsSync(abs), `XSD file is missing for ${entry.fileMatch}: ${abs}`);
    }
  });

  test('xsd-mappings.json drives package.json contributes.xmlValidation (no drift)', () => {
    const mappings = readMappings();
    const expected: XmlValidationEntry[] = [];
    for (const mapping of mappings) {
      for (const fileMatch of mapping.fileMatch) {
        expected.push({fileMatch, url: `./resources/xsd/${mapping.schema}`});
      }
    }
    const actual = readPackageJson().contributes?.xmlValidation ?? [];
    assert.deepStrictEqual(
      actual,
      expected,
      'package.json#contributes.xmlValidation is out of sync with resources/xsd-mappings.json — run `pnpm run build`.',
    );
  });

  test('every schema referenced in mappings exists under resources/xsd/', () => {
    for (const {schema} of readMappings()) {
      const abs = path.join(xsdDir, schema);
      assert.ok(fs.existsSync(abs), `Mapped schema not found on disk: ${schema}`);
    }
  });

  test('resources/xsd/ contains no XSDs that are not declared in mappings or bundleOnly', () => {
    const {mappings, bundleOnly} = readMappingsFile();
    const declared = new Set([...mappings.map((m) => m.schema), ...bundleOnly]);
    const onDisk = fs.readdirSync(xsdDir).filter((name) => name.endsWith('.xsd'));
    for (const file of onDisk) {
      assert.ok(declared.has(file), `Stray XSD on disk (not in mappings or bundleOnly): ${file}`);
    }
  });

  test('every SDK XSD is mapped, bundleOnly, or skipped (no silent gaps)', () => {
    const {mappings, bundleOnly, skipped} = readMappingsFile();
    const accounted = new Set([...mappings.map((m) => m.schema), ...bundleOnly, ...skipped]);
    const sdkXsds = listSdkXsds();

    const unaccounted = sdkXsds.filter((file) => !accounted.has(file));
    assert.deepStrictEqual(
      unaccounted,
      [],
      `SDK schemas not accounted for — add to mappings[], bundleOnly[], or skipped[] in resources/xsd-mappings.json: ${unaccounted.join(', ')}`,
    );

    const sdkSet = new Set(sdkXsds);
    const phantom = [...accounted].filter((file) => !sdkSet.has(file));
    assert.deepStrictEqual(
      phantom,
      [],
      `Schemas listed in xsd-mappings.json that no longer exist in the SDK: ${phantom.join(', ')}`,
    );
  });

  test('schemas imported by mapped XSDs are present (transitive bundling)', () => {
    const {mappings} = readMappingsFile();
    const declared = new Set(fs.readdirSync(xsdDir).filter((name) => name.endsWith('.xsd')));
    const importPattern = /schemaLocation\s*=\s*"([^"]+\.xsd)"/g;

    for (const {schema} of mappings) {
      const content = fs.readFileSync(path.join(xsdDir, schema), 'utf8');
      let match: RegExpExecArray | null;
      while ((match = importPattern.exec(content)) !== null) {
        const imported = match[1].split('/').pop()!;
        assert.ok(
          declared.has(imported),
          `${schema} imports "${imported}" but it is not bundled — add it to bundleOnly[] in resources/xsd-mappings.json`,
        );
      }
    }
  });
});
