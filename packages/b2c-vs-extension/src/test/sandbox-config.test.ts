/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {B2CExtensionConfig} from '../config-provider.js';
import {SandboxConfigProvider, type SandboxInfo} from '../sandbox-tree/sandbox-config.js';

function makeStubConfig(values: Record<string, unknown>): B2CExtensionConfig {
  const stub = {
    getConfig: () => ({values}),
    onDidReset: (_listener: () => void) => ({dispose() {}}),
  };
  return stub as unknown as B2CExtensionConfig;
}

function makeNullConfig(): B2CExtensionConfig {
  const stub = {
    getConfig: () => null,
    onDidReset: (_listener: () => void) => ({dispose() {}}),
  };
  return stub as unknown as B2CExtensionConfig;
}

suite('SandboxConfigProvider', () => {
  suite('realm management', () => {
    test('addRealm trims whitespace and dedupes', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      provider.addRealm('zzzz');
      provider.addRealm('  zzzz  ');
      provider.addRealm('aaaa');
      assert.deepStrictEqual(provider.getRealms(), ['zzzz', 'aaaa']);
    });

    test('addRealm ignores empty strings', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      provider.addRealm('');
      provider.addRealm('   ');
      assert.deepStrictEqual(provider.getRealms(), []);
    });

    test('removeRealm drops the realm and clears its sandbox cache', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      provider.addRealm('zzzz');
      provider.addRealm('aaaa');
      const sandboxes: SandboxInfo[] = [{id: 'sb1', realm: 'zzzz'}];
      provider.setCachedSandboxes('zzzz', sandboxes);

      provider.removeRealm('zzzz');

      assert.deepStrictEqual(provider.getRealms(), ['aaaa']);
      assert.strictEqual(provider.getCachedSandboxes('zzzz'), undefined);
    });
  });

  suite('sandbox cache', () => {
    test('round-trips cached sandboxes', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      const sandboxes: SandboxInfo[] = [{id: 'sb1'}, {id: 'sb2'}];
      provider.setCachedSandboxes('zzzz', sandboxes);
      assert.strictEqual(provider.getCachedSandboxes('zzzz'), sandboxes);
    });

    test('invalidateRealm drops only the named realm', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      provider.setCachedSandboxes('zzzz', [{id: 'sb1'}]);
      provider.setCachedSandboxes('aaaa', [{id: 'sb2'}]);

      provider.invalidateRealm('zzzz');

      assert.strictEqual(provider.getCachedSandboxes('zzzz'), undefined);
      assert.ok(provider.getCachedSandboxes('aaaa'));
    });

    test('clearCache drops all entries', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      provider.setCachedSandboxes('zzzz', [{id: 'sb1'}]);
      provider.setCachedSandboxes('aaaa', [{id: 'sb2'}]);

      provider.clearCache();

      assert.strictEqual(provider.getCachedSandboxes('zzzz'), undefined);
      assert.strictEqual(provider.getCachedSandboxes('aaaa'), undefined);
    });
  });

  suite('default realm derivation', () => {
    test('getConfiguredRealm returns explicit realm', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({realm: 'zzzz'}));
      assert.strictEqual(provider.getConfiguredRealm(), 'zzzz');
    });

    test('getHostnameRealm strips suffix and instance number', () => {
      const provider = new SandboxConfigProvider(
        makeStubConfig({hostname: 'zzzz-001.dx.commercecloud.salesforce.com'}),
      );
      assert.strictEqual(provider.getHostnameRealm(), 'zzzz');
    });

    test('getHostnameRealm handles a hostname with no instance suffix', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({hostname: 'aaaa.demandware.net'}));
      assert.strictEqual(provider.getHostnameRealm(), 'aaaa');
    });

    test('getHostnameRealm returns undefined when hostname is absent', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      assert.strictEqual(provider.getHostnameRealm(), undefined);
    });

    test('getHostnameRealm returns undefined when config itself is null', () => {
      const provider = new SandboxConfigProvider(makeNullConfig());
      assert.strictEqual(provider.getHostnameRealm(), undefined);
      assert.strictEqual(provider.getConfiguredRealm(), undefined);
      assert.strictEqual(provider.getDefaultRealm(), '');
    });

    test('getDefaultRealm prefers explicit config over hostname derivation', () => {
      const provider = new SandboxConfigProvider(
        makeStubConfig({realm: 'bbbb', hostname: 'zzzz-001.dx.commercecloud.salesforce.com'}),
      );
      assert.strictEqual(provider.getDefaultRealm(), 'bbbb');
    });

    test('getDefaultRealm falls back to hostname when realm is unset', () => {
      const provider = new SandboxConfigProvider(
        makeStubConfig({hostname: 'zzzz-001.dx.commercecloud.salesforce.com'}),
      );
      assert.strictEqual(provider.getDefaultRealm(), 'zzzz');
    });

    test('getDefaultRealm returns empty string when neither source is available', () => {
      const provider = new SandboxConfigProvider(makeStubConfig({}));
      assert.strictEqual(provider.getDefaultRealm(), '');
    });
  });
});
