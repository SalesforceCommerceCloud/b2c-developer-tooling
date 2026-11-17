/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  checkMetadataDrift,
  compareMetadata,
  findSfnextProjectRoot,
  regenerateMetadata,
  sameJson,
  SFNEXT_METADATA_DIR,
  typeIdFromMetadataPath,
} from '../sfnext/metadata-drift.js';

function write(root: string, rel: string, text: string): string {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, text);
  return file;
}

/**
 * A fake project whose `@salesforce/storefront-next-dev/cartridge-services`
 * writes `generated` (relative path → JSON) into the output directory.
 */
function fakeProject(moduleSource: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sfnext-drift-'));
  write(root, 'package.json', JSON.stringify({dependencies: {'@salesforce/storefront-next-dev': '1.0.0'}}));
  const pkg = path.join(root, 'node_modules', '@salesforce', 'storefront-next-dev');
  write(
    pkg,
    'package.json',
    JSON.stringify({
      name: '@salesforce/storefront-next-dev',
      type: 'module',
      exports: {'./cartridge-services': './cs.js'},
    }),
  );
  write(pkg, 'cs.js', moduleSource);
  write(root, 'src/components/hero/index.tsx', "@Component('hero', {group: 'Content'})\nexport class Hero {}\n");
  return root;
}

const GENERATOR = `
import * as fs from 'node:fs';
import * as path from 'node:path';
export async function generateMetadata(root, out, options) {
  fs.mkdirSync(path.join(out, 'components', 'Content'), {recursive: true});
  fs.writeFileSync(path.join(out, 'components', 'Content', 'hero.json'), JSON.stringify({name: 'Hero', group: 'Content'}));
  fs.writeFileSync(path.join(out, 'marker.txt'), JSON.stringify(options));
}
`;

suite('Storefront Next metadata drift', () => {
  const roots: string[] = [];
  const project = (source: string) => {
    const root = fakeProject(source);
    roots.push(root);
    return root;
  };
  teardown(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, {recursive: true, force: true});
  });

  test('maps generated paths to type IDs', () => {
    assert.deepStrictEqual(typeIdFromMetadataPath('components/Content/hero.json'), {
      kind: 'component',
      typeId: 'Content.hero',
    });
    assert.deepStrictEqual(typeIdFromMetadataPath('pages/homePage.json'), {kind: 'page', typeId: 'homePage'});
    assert.strictEqual(typeIdFromMetadataPath('aspects/pdp.json'), undefined);
    assert.strictEqual(typeIdFromMetadataPath('components/hero.json'), undefined);
  });

  test('compares JSON ignoring formatting and key order', () => {
    assert.ok(sameJson('{"a":1,"b":[1,{"x":1,"y":2}]}', '{\n  "b": [1, {"y": 2, "x": 1}],\n  "a": 1\n}'));
    assert.ok(!sameJson('{"a":[1,2]}', '{"a":[2,1]}'));
    assert.ok(!sameJson('{', '{}'));
  });

  test('finds the project root that depends on the dev package', () => {
    const root = project(GENERATOR);
    const file = path.join(root, 'src/components/hero/index.tsx');
    assert.strictEqual(findSfnextProjectRoot(file, root), root);
    assert.strictEqual(findSfnextProjectRoot(file, path.join(root, 'src')), undefined);
  });

  test('reports missing and changed metadata, not matching or aspects', async () => {
    const generated = fs.mkdtempSync(path.join(os.tmpdir(), 'sfnext-gen-'));
    const committed = fs.mkdtempSync(path.join(os.tmpdir(), 'sfnext-com-'));
    roots.push(generated, committed);
    write(generated, 'components/Content/hero.json', '{"name":"Hero"}');
    write(generated, 'components/Content/banner.json', '{"name":"Banner"}');
    write(generated, 'pages/homePage.json', '{"name":"Home Page"}');
    write(generated, 'aspects/pdp.json', '{"name":"PDP"}');
    write(committed, 'components/Content/hero.json', '{\n  "name": "Hero"\n}\n');
    write(committed, 'pages/homePage.json', '{"name":"Home"}');
    const stale = await compareMetadata(generated, committed);
    assert.deepStrictEqual(stale.map((s) => `${s.typeId}:${s.reason}`).sort(), [
      'Content.banner:missing',
      'homePage:changed',
    ]);
  });

  test('runs the project generator for one file and detects drift', async function () {
    this.timeout(20_000);
    const root = project(GENERATOR);
    const file = path.join(root, 'src/components/hero/index.tsx');
    write(root, path.join(SFNEXT_METADATA_DIR, 'components/Content/hero.json'), '{"name":"Old","group":"Content"}');

    const stale = await checkMetadataDrift(root, file, {nodePath: process.execPath});
    assert.deepStrictEqual(
      stale?.map((s) => s.typeId),
      ['Content.hero'],
    );

    const result = await regenerateMetadata(root, file, process.execPath);
    assert.ok(result.ok, result.error);
    const marker = JSON.parse(fs.readFileSync(path.join(root, SFNEXT_METADATA_DIR, 'marker.txt'), 'utf8'));
    assert.deepStrictEqual(marker, {filePaths: [file], lintFix: true});
    assert.deepStrictEqual(await checkMetadataDrift(root, file, {nodePath: process.execPath}), []);
  });

  test('shows nothing when the generator is missing, changed or fails', async function () {
    this.timeout(20_000);
    const cases = [
      'export const somethingElse = 1;',
      'export async function generateMetadata() { process.exit(1); }',
      'export async function generateMetadata() { throw new Error("boom"); }',
      'throw new Error("cannot load");',
    ];
    for (const source of cases) {
      const root = project(source);
      fs.mkdirSync(path.join(root, SFNEXT_METADATA_DIR), {recursive: true});
      const errors: string[] = [];
      const stale = await checkMetadataDrift(root, path.join(root, 'src/components/hero/index.tsx'), {
        nodePath: process.execPath,
        onError: (message) => errors.push(message),
      });
      assert.strictEqual(stale, undefined, source);
      assert.strictEqual(errors.length, 1, source);
    }
  });

  test('skips the check when the project has no metadata directory', async () => {
    const root = project(GENERATOR);
    const stale = await checkMetadataDrift(root, path.join(root, 'src/components/hero/index.tsx'), {
      nodePath: process.execPath,
    });
    assert.strictEqual(stale, undefined);
  });
});
