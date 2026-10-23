/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type {ResolvedB2CConfig} from '@salesforce/b2c-tooling-sdk/config';
import {codeVersionsFromPropfind, dwJsonForHostname, saveCodeVersion} from '../code-sync/code-sync-setup.js';
import {instanceNameForHostname, parseServerHostname} from '../walkthrough/server-hostname.js';

function resolvedConfig(sources: ResolvedB2CConfig['sources'], instanceName?: string): ResolvedB2CConfig {
  return {sources, values: {hostname: 'my-sandbox.example.com', instanceName}} as unknown as ResolvedB2CConfig;
}

suite('server-only code sync setup', () => {
  test('parses a hostname out of a bare host or any instance URL', () => {
    assert.strictEqual(parseServerHostname(' my-sandbox.example.com '), 'my-sandbox.example.com');
    assert.strictEqual(
      parseServerHostname(
        'https://My-Sandbox.example.com/on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage',
      ),
      'my-sandbox.example.com',
    );
    assert.strictEqual(parseServerHostname('my-sandbox.example.com/on/demandware.store'), 'my-sandbox.example.com');
    assert.strictEqual(parseServerHostname('localhost.example.com:8443'), 'localhost.example.com:8443');
    assert.strictEqual(parseServerHostname(''), undefined);
    assert.strictEqual(parseServerHostname('not a host'), undefined);
    assert.strictEqual(parseServerHostname('sandbox'), undefined);
  });

  test('names the config after the first DNS label', () => {
    assert.strictEqual(instanceNameForHostname('my-sandbox.example.com'), 'my-sandbox');
    assert.strictEqual(instanceNameForHostname('.example.com'), 'dev');
  });

  test('lists code versions from a Cartridges PROPFIND', () => {
    const versions = codeVersionsFromPropfind([
      {href: '/on/demandware.servlet/webdav/Sites/Cartridges/', displayName: 'Cartridges', isCollection: true},
      {href: '/on/demandware.servlet/webdav/Sites/Cartridges/version2/', displayName: 'version2', isCollection: true},
      {href: '/on/demandware.servlet/webdav/Sites/Cartridges/version1/', displayName: 'version1', isCollection: true},
      {href: '/on/demandware.servlet/webdav/Sites/Cartridges/notes.txt', displayName: 'notes.txt', isCollection: false},
    ]);
    assert.deepStrictEqual(versions, ['version1', 'version2']);
  });

  test('saves the code version to the project dw.json that supplied the hostname', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-code-sync-setup-'));
    try {
      const dwJson = path.join(dir, 'dw.json');
      fs.writeFileSync(
        dwJson,
        JSON.stringify({
          configs: [
            {name: 'other', hostname: 'other.example.com'},
            {name: 'my-sandbox', active: true, hostname: 'my-sandbox.example.com'},
          ],
        }),
      );
      const config = resolvedConfig(
        [
          {name: 'DwJsonSource', scope: 'global', location: '/global/dw.json', fields: ['hostname']},
          {name: 'DwJsonSource', location: dwJson, fields: ['hostname']},
        ],
        'my-sandbox',
      );
      assert.strictEqual(dwJsonForHostname(config), dwJson);

      assert.strictEqual(await saveCodeVersion(config, 'version1'), dwJson);
      const saved = JSON.parse(fs.readFileSync(dwJson, 'utf-8'));
      assert.strictEqual(saved.configs[1]['code-version'], 'version1');
      assert.strictEqual(saved.configs[0]['code-version'], undefined);
    } finally {
      fs.rmSync(dir, {recursive: true, force: true});
    }
  });

  test('does not write when the hostname came from somewhere other than a project dw.json', async () => {
    const config = resolvedConfig([{name: 'EnvSource', fields: ['hostname']}]);
    assert.strictEqual(dwJsonForHostname(config), undefined);
    assert.strictEqual(await saveCodeVersion(config, 'version1'), undefined);
  });
});
