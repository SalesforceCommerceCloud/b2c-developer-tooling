/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {collectStepTypeEntries, resolveStepTypeModule} from '../code-sync/cartridge-tree-provider.js';

async function mkTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'b2c-step-types-'));
}

async function writeJson(target: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, JSON.stringify(value, null, 2), 'utf-8');
}

async function writeFile(target: string, contents = ''): Promise<void> {
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, contents, 'utf-8');
}

suite('cartridge-tree-provider — custom step types', () => {
  suite('collectStepTypeEntries', () => {
    test('parses task + chunk categories in the canonical shape', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'app_custom_core');
      await writeJson(path.join(cartridgeRoot, 'steptypes.json'), {
        'step-types': {
          'script-module-step': [
            {'@type-id': 'custom.MyTaskStep', module: 'app_custom_core/cartridge/scripts/jobsteps/taskStep'},
          ],
          'chunk-script-module-step': [
            {'@type-id': 'custom.MyChunkStep', module: 'app_custom_core/cartridge/scripts/jobsteps/chunkStep'},
          ],
        },
      });

      const entries = await collectStepTypeEntries(cartridgeRoot);
      // Sorted alphabetically by typeId.
      assert.deepStrictEqual(
        entries.map((e) => ({typeId: e.typeId, kind: e.kind, moduleRef: e.moduleRef})),
        [
          {
            typeId: 'custom.MyChunkStep',
            kind: 'chunk',
            moduleRef: 'app_custom_core/cartridge/scripts/jobsteps/chunkStep',
          },
          {
            typeId: 'custom.MyTaskStep',
            kind: 'task',
            moduleRef: 'app_custom_core/cartridge/scripts/jobsteps/taskStep',
          },
        ],
      );
    });

    test('tolerates the legacy flat-array shape as task steps', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'legacy_cartridge');
      await writeJson(path.join(cartridgeRoot, 'steptypes.json'), {
        'step-types': [{'@type-id': 'custom.Legacy', module: 'legacy_cartridge/cartridge/scripts/foo'}],
      });

      const entries = await collectStepTypeEntries(cartridgeRoot);
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].typeId, 'custom.Legacy');
      assert.strictEqual(entries[0].kind, 'task');
    });

    test('silently ignores malformed steptypes.json', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'broken');
      const stepTypesPath = path.join(cartridgeRoot, 'steptypes.json');
      await fs.mkdir(cartridgeRoot, {recursive: true});
      await fs.writeFile(stepTypesPath, '{not valid json', 'utf-8');

      const entries = await collectStepTypeEntries(cartridgeRoot);
      assert.deepStrictEqual(entries, []);
    });

    test('skips entries missing @type-id or module', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'partial');
      await writeJson(path.join(cartridgeRoot, 'steptypes.json'), {
        'step-types': {
          'script-module-step': [
            {'@type-id': 'custom.Good', module: 'partial/cartridge/scripts/good'},
            {'@type-id': 'custom.NoModule'},
            {module: 'partial/cartridge/scripts/noType'},
          ],
        },
      });

      const entries = await collectStepTypeEntries(cartridgeRoot);
      assert.deepStrictEqual(
        entries.map((e) => e.typeId),
        ['custom.Good'],
      );
    });

    test('finds steptypes.json nested under the cartridge (not just at the root)', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'nested');
      // Some cartridges keep steptypes.json under a `meta/` or similar subfolder.
      await writeJson(path.join(cartridgeRoot, 'meta', 'steptypes.json'), {
        'step-types': {
          'script-module-step': [{'@type-id': 'custom.Nested', module: 'nested/cartridge/scripts/nestedStep'}],
        },
      });

      const entries = await collectStepTypeEntries(cartridgeRoot);
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].typeId, 'custom.Nested');
    });
  });

  suite('resolveStepTypeModule', () => {
    test('resolves module inside the declaring cartridge with cartridge prefix (adds .js)', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'app_custom_core');
      const moduleAbs = path.join(cartridgeRoot, 'cartridge', 'scripts', 'jobsteps', 'myStep.js');
      await writeFile(moduleAbs, '// step');

      const resolved = await resolveStepTypeModule(
        'app_custom_core/cartridge/scripts/jobsteps/myStep',
        cartridgeRoot,
        [],
      );
      assert.strictEqual(resolved, moduleAbs);
    });

    test('resolves module when the reference already includes .js', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'app_custom_core');
      const moduleAbs = path.join(cartridgeRoot, 'cartridge', 'scripts', 'jobsteps', 'myStep.js');
      await writeFile(moduleAbs);

      const resolved = await resolveStepTypeModule(
        'app_custom_core/cartridge/scripts/jobsteps/myStep.js',
        cartridgeRoot,
        [],
      );
      assert.strictEqual(resolved, moduleAbs);
    });

    test('resolves legacy module reference without the cartridge prefix', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'legacy_cartridge');
      const moduleAbs = path.join(cartridgeRoot, 'cartridge', 'scripts', 'foo.js');
      await writeFile(moduleAbs);

      const resolved = await resolveStepTypeModule('cartridge/scripts/foo', cartridgeRoot, []);
      assert.strictEqual(resolved, moduleAbs);
    });

    test('falls back to a sibling cartridge when the module names a different cartridge', async () => {
      const root = await mkTmpDir();
      const registrarRoot = path.join(root, 'app_custom_core');
      const implementorRoot = path.join(root, 'plugin_shared');
      const moduleAbs = path.join(implementorRoot, 'cartridge', 'scripts', 'jobsteps', 'shared.js');
      await fs.mkdir(registrarRoot, {recursive: true});
      await writeFile(moduleAbs);

      const resolved = await resolveStepTypeModule('plugin_shared/cartridge/scripts/jobsteps/shared', registrarRoot, [
        implementorRoot,
      ]);
      assert.strictEqual(resolved, moduleAbs);
    });

    test('returns undefined when the module cannot be resolved', async () => {
      const root = await mkTmpDir();
      const cartridgeRoot = path.join(root, 'app_custom_core');
      await fs.mkdir(cartridgeRoot, {recursive: true});

      const resolved = await resolveStepTypeModule(
        'app_custom_core/cartridge/scripts/jobsteps/missing',
        cartridgeRoot,
        [],
      );
      assert.strictEqual(resolved, undefined);
    });

    test('returns undefined for an empty module reference', async () => {
      const root = await mkTmpDir();
      const resolved = await resolveStepTypeModule('   ', path.join(root, 'any'), []);
      assert.strictEqual(resolved, undefined);
    });
  });
});
