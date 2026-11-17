/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {fetchContentLibrary, Library} from '@salesforce/b2c-tooling-sdk/operations/content';
import type {B2CExtensionConfig} from '../config-provider.js';
import {ContentConfigProvider} from '../content-tree/content-config.js';

function provider(options: {instance?: unknown} = {}) {
  const calls: Array<{id: string; isSiteLibrary?: boolean}> = [];
  let resolveNext: ((library: Library) => void) | undefined;
  const config = {
    getInstance: () => ('instance' in options ? options.instance : {}),
    getConfig: () => ({values: {}}),
    onDidReset: () => ({dispose() {}}),
  } as unknown as B2CExtensionConfig;
  const fetch = ((_instance: unknown, id: string, opts?: {isSiteLibrary?: boolean}) => {
    calls.push({id, isSiteLibrary: opts?.isSiteLibrary});
    return new Promise((resolve) => {
      resolveNext = (library) => resolve({library} as Awaited<ReturnType<typeof fetchContentLibrary>>);
    });
  }) as unknown as typeof fetchContentLibrary;
  return {
    content: new ContentConfigProvider(config, fetch),
    calls,
    resolve: (library: Library) => resolveNext?.(library),
  };
}

const lib = (name: string) => ({name}) as unknown as Library;

suite('ContentConfigProvider.loadLibrary', () => {
  test('fetches and caches a library that is not loaded', async () => {
    const {content, calls, resolve} = provider();
    const pending = content.loadLibrary('SharedLibrary', false);
    resolve(lib('a'));
    assert.strictEqual(await pending, content.getCachedLibrary('SharedLibrary'));
    assert.deepStrictEqual(calls, [{id: 'SharedLibrary', isSiteLibrary: false}]);
    assert.strictEqual(await content.loadLibrary('SharedLibrary', false), await pending);
    assert.strictEqual(calls.length, 1);
  });

  test('reloads after a save invalidates the cache', async () => {
    const {content, calls, resolve} = provider();
    const first = content.loadLibrary('RefArch', true);
    resolve(lib('before'));
    await first;
    content.invalidateLibrary('RefArch');
    assert.strictEqual(content.getCachedLibrary('RefArch'), undefined);
    const second = content.loadLibrary('RefArch', true);
    const after = lib('after');
    resolve(after);
    assert.strictEqual(await second, after);
    assert.strictEqual(content.getCachedLibrary('RefArch'), after);
    assert.deepStrictEqual(calls, [
      {id: 'RefArch', isSiteLibrary: true},
      {id: 'RefArch', isSiteLibrary: true},
    ]);
  });

  test('concurrent loads share one fetch', async () => {
    const {content, calls, resolve} = provider();
    const a = content.loadLibrary('SharedLibrary', false);
    const b = content.loadLibrary('SharedLibrary', false);
    const library = lib('x');
    resolve(library);
    assert.strictEqual(await a, library);
    assert.strictEqual(await b, library);
    assert.strictEqual(calls.length, 1);
  });

  test('does not cache a load that an invalidation superseded', async () => {
    const {content, resolve} = provider();
    const stale = content.loadLibrary('SharedLibrary', false);
    content.invalidateLibrary('SharedLibrary');
    resolve(lib('stale'));
    await stale;
    assert.strictEqual(content.getCachedLibrary('SharedLibrary'), undefined);
  });

  test('rejects without an instance', async () => {
    const {content} = provider({instance: null});
    await assert.rejects(content.loadLibrary('SharedLibrary', false), /No B2C Commerce instance configured/);
  });
});
