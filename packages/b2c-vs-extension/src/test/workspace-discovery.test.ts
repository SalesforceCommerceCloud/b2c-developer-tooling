/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {findCartridgesSafe, isUnscannableRoot} from '../workspace-discovery.js';

suite('workspace-discovery guards (W-23618508)', () => {
  suite('isUnscannableRoot', () => {
    test('treats empty string as unscannable', () => {
      assert.strictEqual(isUnscannableRoot(''), true);
    });

    test('treats the filesystem root as unscannable', () => {
      assert.strictEqual(isUnscannableRoot(path.parse(process.cwd()).root), true);
    });

    test('treats the home directory as unscannable', () => {
      assert.strictEqual(isUnscannableRoot(os.homedir()), true);
    });

    test('does not flag a normal nested project directory', () => {
      const nested = path.join(os.homedir(), 'code', 'some-project');
      assert.strictEqual(isUnscannableRoot(nested), false);
    });
  });

  suite('findCartridgesSafe', () => {
    let tmpRoot: string;

    setup(() => {
      tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-ws-disc-'));
    });

    teardown(() => {
      fs.rmSync(tmpRoot, {recursive: true, force: true});
    });

    test('returns [] for an empty working directory without scanning cwd', () => {
      // Must NOT fall back to process.cwd() — that is the freeze the guard prevents.
      assert.deepStrictEqual(findCartridgesSafe(''), []);
      assert.deepStrictEqual(findCartridgesSafe(undefined), []);
    });

    test('returns [] for the home directory (never scans ~)', () => {
      assert.deepStrictEqual(findCartridgesSafe(os.homedir()), []);
    });

    test('returns [] for the filesystem root', () => {
      assert.deepStrictEqual(findCartridgesSafe(path.parse(tmpRoot).root), []);
    });

    test('discovers cartridges in a concrete workspace folder', () => {
      const cartridgeDir = path.join(tmpRoot, 'cartridges', 'app_storefront_base');
      fs.mkdirSync(cartridgeDir, {recursive: true});
      fs.writeFileSync(path.join(cartridgeDir, '.project'), '<projectDescription/>');

      const found = findCartridgesSafe(tmpRoot);
      assert.deepStrictEqual(
        found.map((c) => c.name),
        ['app_storefront_base'],
      );
    });

    test('depth-bounds the scan so a cartridge below the limit is not discovered', () => {
      // WORKSPACE_DISCOVERY_MAX_DEPTH is 5; place a .project at depth 7 so the
      // default bound skips it. This is the defense-in-depth behavior that keeps
      // a huge/deep tree from stalling the extension host.
      const deep = path.join(tmpRoot, 'a', 'b', 'c', 'd', 'e', 'f', 'deep_cartridge');
      fs.mkdirSync(deep, {recursive: true});
      fs.writeFileSync(path.join(deep, '.project'), '<projectDescription/>');

      const found = findCartridgesSafe(tmpRoot);
      assert.deepStrictEqual(found, []);
    });
  });
});
