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

function readPackageJson(): {contributes?: {xmlValidation?: XmlValidationEntry[]}} {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function readMappings(): MappingEntry[] {
  return JSON.parse(fs.readFileSync(mappingsPath, 'utf8')).mappings;
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
      'package.json#contributes.xmlValidation is out of sync with resources/xsd-mappings.json — run `pnpm run sync:xsd`.',
    );
  });

  test('every schema referenced in mappings exists under resources/xsd/', () => {
    for (const {schema} of readMappings()) {
      const abs = path.join(xsdDir, schema);
      assert.ok(fs.existsSync(abs), `Mapped schema not found on disk: ${schema}`);
    }
  });

  test('resources/xsd/ contains no XSDs that are not declared in mappings', () => {
    const declared = new Set(readMappings().map((m) => m.schema));
    const onDisk = fs.readdirSync(xsdDir).filter((name) => name.endsWith('.xsd'));
    for (const file of onDisk) {
      assert.ok(declared.has(file), `Stray XSD on disk (not in mappings): ${file}`);
    }
  });
});
