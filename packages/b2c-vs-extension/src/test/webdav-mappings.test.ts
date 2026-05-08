/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {B2CExtensionConfig} from '../config-provider.js';
import {WebDavMappingsProvider} from '../webdav-tree/webdav-mappings.js';

interface ResetEmitter {
  fire(): void;
}

function makeStubConfig(values: Record<string, unknown>): {provider: B2CExtensionConfig; reset: ResetEmitter} {
  let resetListener: (() => void) | undefined;
  const stub = {
    getConfig: () => ({values}),
    onDidReset: (listener: () => void) => {
      resetListener = listener;
      return {dispose() {}};
    },
  };
  return {
    provider: stub as unknown as B2CExtensionConfig,
    reset: {
      fire() {
        resetListener?.();
      },
    },
  };
}

suite('WebDavMappingsProvider', () => {
  test('seedFromConfig dedupes contentLibrary against libraries', () => {
    const {provider} = makeStubConfig({libraries: ['lib-a', 'lib-b'], contentLibrary: 'lib-a'});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    assert.deepStrictEqual(mappings.getLibraryIds().sort(), ['lib-a', 'lib-b']);
  });

  test('seedFromConfig adds contentLibrary when not already in libraries', () => {
    const {provider} = makeStubConfig({libraries: ['lib-a'], contentLibrary: 'lib-c'});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    assert.deepStrictEqual(mappings.getLibraryIds().sort(), ['lib-a', 'lib-c']);
  });

  test('seedFromConfig copies catalogs verbatim', () => {
    const {provider} = makeStubConfig({catalogs: ['cat-1', 'cat-2']});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    assert.deepStrictEqual(mappings.getCatalogIds(), ['cat-1', 'cat-2']);
  });

  test('getEffectiveContentLibrary prefers explicit contentLibrary over libraries[0]', () => {
    const {provider} = makeStubConfig({libraries: ['lib-a', 'lib-b'], contentLibrary: 'lib-b'});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    assert.strictEqual(mappings.getEffectiveContentLibrary(), 'lib-b');
  });

  test('getEffectiveContentLibrary falls back to libraries[0] when contentLibrary is unset', () => {
    const {provider} = makeStubConfig({libraries: ['lib-a', 'lib-b']});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    assert.strictEqual(mappings.getEffectiveContentLibrary(), 'lib-a');
  });

  test('addCatalog is a no-op when the id is already present', () => {
    const {provider} = makeStubConfig({catalogs: ['cat-1']});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    let fires = 0;
    mappings.onDidChange(() => fires++);

    mappings.addCatalog('cat-1');
    assert.strictEqual(fires, 0, 'duplicate add should not fire onDidChange');
    assert.deepStrictEqual(mappings.getCatalogIds(), ['cat-1']);

    mappings.addCatalog('cat-2');
    assert.strictEqual(fires, 1, 'novel add should fire onDidChange exactly once');
    assert.deepStrictEqual(mappings.getCatalogIds(), ['cat-1', 'cat-2']);
  });

  test('removeCatalog is a no-op when the id is absent', () => {
    const {provider} = makeStubConfig({catalogs: ['cat-1']});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    let fires = 0;
    mappings.onDidChange(() => fires++);

    mappings.removeCatalog('does-not-exist');
    assert.strictEqual(fires, 0);

    mappings.removeCatalog('cat-1');
    assert.strictEqual(fires, 1);
    assert.deepStrictEqual(mappings.getCatalogIds(), []);
  });

  test('addLibrary / removeLibrary mirror catalog behavior', () => {
    const {provider} = makeStubConfig({libraries: []});
    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();

    let fires = 0;
    mappings.onDidChange(() => fires++);

    mappings.addLibrary('lib-x');
    mappings.addLibrary('lib-x'); // duplicate
    mappings.removeLibrary('lib-y'); // absent
    mappings.removeLibrary('lib-x');

    assert.strictEqual(fires, 2, 'one fire for the novel add and one for the actual removal');
    assert.deepStrictEqual(mappings.getLibraryIds(), []);
  });

  test('config reset re-seeds from config and discards manual additions', () => {
    const values: {libraries?: string[]; catalogs?: string[]} = {libraries: ['lib-a'], catalogs: ['cat-1']};
    let resetListener: (() => void) | undefined;
    const provider = {
      getConfig: () => ({values}),
      onDidReset: (listener: () => void) => {
        resetListener = listener;
        return {dispose() {}};
      },
    } as unknown as B2CExtensionConfig;

    const mappings = new WebDavMappingsProvider(provider);
    mappings.seedFromConfig();
    mappings.addCatalog('cat-runtime');
    assert.deepStrictEqual(mappings.getCatalogIds().sort(), ['cat-1', 'cat-runtime']);

    values.catalogs = ['cat-1', 'cat-2'];
    resetListener?.();

    assert.deepStrictEqual(
      mappings.getCatalogIds().sort(),
      ['cat-1', 'cat-2'],
      'reset should re-seed from config and drop runtime additions',
    );
  });
});
