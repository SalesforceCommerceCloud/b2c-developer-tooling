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
  findTypeSources,
  normalizeTypeId,
  sfnextDecoratedTypes,
  templatesRenderedBy,
} from '../content-tree/type-sources.js';

function write(root: string, rel: string, text: string): string {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, text);
  return file;
}

suite('type sources', () => {
  let root: string;

  setup(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'type-sources-'));
  });

  teardown(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  test('normalizes library XML type IDs', () => {
    assert.deepStrictEqual(normalizeTypeId('component.commerce_assets.photoTile'), {
      kind: 'component',
      id: 'commerce_assets.photoTile',
    });
    assert.deepStrictEqual(normalizeTypeId('page.storePage'), {kind: 'page', id: 'storePage'});
    assert.deepStrictEqual(normalizeTypeId('Content.hero'), {id: 'Content.hero'});
  });

  test('reads templates a render script renders', () => {
    const script = "var a = 1;\nreturn new Template('experience/components/x/tile').render(model).text;";
    assert.deepStrictEqual(templatesRenderedBy(script), [{template: 'experience/components/x/tile', line: 1}]);
  });

  test('reads Storefront Next decorators as type IDs', () => {
    const source = [
      "@Component('hero', {",
      "  name: 'Hero {banner}',",
      "  group: 'Content',",
      '})',
      'export class HeroMetadata {}',
      "@Component('plain')",
      'export class PlainMetadata {}',
      '@PageType({',
      "  name: 'Home Page',",
      '})',
      'export class HomeMetadata {}',
      "@PageType({id: 'custom', name: 'Other'})",
      'export class CustomMetadata {}',
    ].join('\n');
    assert.deepStrictEqual(sfnextDecoratedTypes(source), [
      {kind: 'component', typeId: 'Content.hero', line: 0},
      {kind: 'component', typeId: 'storefrontnext_base.plain', line: 5},
      {kind: 'page', typeId: 'homePage', line: 7},
      {kind: 'page', typeId: 'custom', line: 11},
    ]);
  });

  test('finds the meta definition, render script and template in a cartridge project', async () => {
    const base = path.join(root, 'cartridges', 'app_base');
    const plugin = path.join(root, 'cartridges', 'plugin_x');
    write(base, 'cartridge/experience/components/assets/tile.json', '{}');
    write(
      base,
      'cartridge/experience/components/assets/tile.js',
      "return new Template('experience/components/assets/tile').render(m).text;",
    );
    write(plugin, 'cartridge/templates/default/experience/components/assets/tile.isml', '<div/>');
    write(base, 'cartridge/templates/default/experience/components/assets/tile.isml', '<div/>');

    const sources = await findTypeSources('component.assets.tile', {
      kind: 'component',
      cartridges: [
        {name: 'plugin_x', src: plugin},
        {name: 'app_base', src: base},
      ],
    });
    assert.deepStrictEqual(
      sources.map((s) => [s.label, s.detail]),
      [
        ['Meta definition', 'app_base'],
        ['Render script', 'app_base'],
        ['Template', 'plugin_x'],
        ['Template', 'app_base'],
      ],
    );
  });

  test('finds Storefront Next sources before the generated JSON, base before overrides', async () => {
    const cartridge = path.join(root, 'cartridges', 'app_sfnext');
    write(cartridge, 'cartridge/experience/pages/homePage.json', '{}');
    const override = write(root, 'src/verticals/a/routes/home.tsx', "@PageType({name: 'Home Page'})\nclass A {}");
    const base = write(root, 'src/routes/home.tsx', "\n@PageType({name: 'Home Page'})\nclass B {}");
    write(root, 'src/routes/other.tsx', "@PageType({name: 'Other Page'})\nclass C {}");

    const sources = await findTypeSources('homePage', {
      kind: 'page',
      cartridges: [{name: 'app_sfnext', src: cartridge}],
      sourceFiles: [override, base, path.join(root, 'src/routes/other.tsx')],
      projectRoot: root,
    });
    assert.deepStrictEqual(
      sources.map((s) => [s.label, s.detail, s.line]),
      [
        ['Page type source', path.join('src', 'routes', 'home.tsx'), 1],
        ['Page type source', path.join('src', 'verticals', 'a', 'routes', 'home.tsx'), 0],
        ['Meta definition', 'app_sfnext', undefined],
      ],
    );
  });

  test('finds nothing for an unknown type', async () => {
    assert.deepStrictEqual(await findTypeSources('assets.missing', {kind: 'component', cartridges: []}), []);
  });
});
