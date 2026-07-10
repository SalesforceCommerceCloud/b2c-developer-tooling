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
const catalogPath = path.join(pkgRoot, 'resources', 'xsd-catalog.xml');
const runtimeConfigPath = path.join(pkgRoot, 'resources', 'xml-validation.generated.json');

interface MappingEntry {
  schema: string;
  fileMatch: string[];
}

interface MappingsFile {
  mappings: MappingEntry[];
  bundleOnly: string[];
  skipped: string[];
}

interface RuntimeConfig {
  catalog: string;
  fileAssociations: {pattern: string; systemId: string}[];
  detectionGlobs: string[];
}

function readPackageJson(): {contributes?: Record<string, unknown>} {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function readMappings(): MappingEntry[] {
  return JSON.parse(fs.readFileSync(mappingsPath, 'utf8')).mappings;
}

function readMappingsFile(): MappingsFile {
  const parsed = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  return {mappings: parsed.mappings, bundleOnly: parsed.bundleOnly ?? [], skipped: parsed.skipped ?? []};
}

function readRuntimeConfig(): RuntimeConfig {
  return JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
}

function readTargetNamespace(schema: string): string | undefined {
  const text = fs.readFileSync(path.join(xsdDir, schema), 'utf8');
  const match = text.match(/targetNamespace\s*=\s*"([^"]+)"/);
  return match ? match[1] : undefined;
}

function listSdkXsds(): string[] {
  const sdkXsdDir = path.resolve(pkgRoot, '..', 'b2c-tooling-sdk', 'data', 'xsd');
  return fs
    .readdirSync(sdkXsdDir)
    .filter((name) => name.endsWith('.xsd'))
    .sort();
}

suite('XML schema validation contribution', () => {
  test('package.json carries no stale contributes.xmlValidation block (namespace catalog supersedes it)', () => {
    // redhat.vscode-xml does not read xmlValidation from a third-party extension,
    // so we associate by namespace via the catalog + addXMLCatalogs() instead.
    const contributes = readPackageJson().contributes ?? {};
    assert.ok(!('xmlValidation' in contributes), 'contributes.xmlValidation should have been removed by sync-xsd.mjs');
  });

  test('the generated OASIS catalog maps every uniquely-namespaced schema to a bundled XSD', () => {
    assert.ok(fs.existsSync(catalogPath), 'resources/xsd-catalog.xml is missing — run `pnpm run build`');
    const catalog = fs.readFileSync(catalogPath, 'utf8');

    // Build the expected namespace->schema map, excluding namespaces shared by
    // more than one mapped schema (those are handled by file associations).
    const nsToSchemas = new Map<string, string[]>();
    for (const {schema} of readMappings()) {
      const ns = readTargetNamespace(schema);
      assert.ok(ns, `${schema} is mapped but declares no targetNamespace`);
      if (!nsToSchemas.has(ns!)) nsToSchemas.set(ns!, []);
      nsToSchemas.get(ns!)!.push(schema);
    }

    for (const [ns, schemas] of nsToSchemas) {
      if (schemas.length > 1) {
        // Colliding namespace must NOT be catalogued.
        assert.ok(
          !catalog.includes(`name="${ns}"`),
          `namespace ${ns} is shared by ${schemas.join(', ')} and must not appear in the catalog`,
        );
        continue;
      }
      assert.ok(
        catalog.includes(`<uri name="${ns}" uri="./xsd/${schemas[0]}" />`),
        `catalog is missing namespace mapping for ${schemas[0]} (${ns}) — run \`pnpm run build\``,
      );
    }
  });

  test('runtime config catalog + association paths resolve to files on disk', () => {
    const config = readRuntimeConfig();
    const catalogAbs = path.resolve(pkgRoot, config.catalog);
    assert.ok(fs.existsSync(catalogAbs), `runtime catalog path does not exist: ${catalogAbs}`);
    for (const assoc of config.fileAssociations) {
      assert.ok(assoc.systemId.startsWith('./resources/xsd/'), `unexpected systemId shape: ${assoc.systemId}`);
      const abs = path.resolve(pkgRoot, assoc.systemId);
      assert.ok(fs.existsSync(abs), `association XSD missing for ${assoc.pattern}: ${abs}`);
    }
    assert.ok(config.detectionGlobs.length > 0, 'expected at least one detection glob');
  });

  test('schemas sharing a namespace are routed to file associations (not the catalog)', () => {
    const {mappings} = readMappingsFile();
    const nsToSchemas = new Map<string, string[]>();
    for (const {schema} of mappings) {
      const ns = readTargetNamespace(schema)!;
      if (!nsToSchemas.has(ns)) nsToSchemas.set(ns, []);
      nsToSchemas.get(ns)!.push(schema);
    }
    const collidingSchemas = new Set<string>();
    for (const schemas of nsToSchemas.values()) {
      if (schemas.length > 1) schemas.forEach((s) => collidingSchemas.add(s));
    }

    const config = readRuntimeConfig();
    const associatedSchemas = new Set(config.fileAssociations.map((a) => a.systemId.split('/').pop()));
    for (const schema of collidingSchemas) {
      assert.ok(
        associatedSchemas.has(schema),
        `${schema} shares a namespace and must appear in fileAssociations — run \`pnpm run build\``,
      );
    }
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
