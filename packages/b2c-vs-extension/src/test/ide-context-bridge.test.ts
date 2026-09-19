/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import {startIdeContextBridge} from '../ai/ide-context-bridge.js';

suite('IDE context bridge', () => {
  let bridge: Awaited<ReturnType<typeof startIdeContextBridge>>;
  let instanceName = 'development';

  setup(async () => {
    instanceName = 'development';
    bridge = await startIdeContextBridge(async () => ({
      status: 'ready',
      selectionMode: 'workspace',
      projectRootPinned: false,
      instanceName,
      codeSync: {available: true, active: instanceName === 'development'},
    }));
  });
  teardown(async () => {
    await bridge.dispose();
  });

  test('returns the live selection and sync state without caching', async () => {
    const headers = {Authorization: `Bearer ${bridge.token}`};
    const first = await fetch(bridge.url, {headers});
    assert.strictEqual(first.headers.get('cache-control'), 'no-store');
    assert.strictEqual((await first.json()).codeSync.active, true);
    instanceName = 'staging';
    const second = await fetch(bridge.url, {headers});
    const context = await second.json();
    assert.strictEqual(context.instanceName, 'staging');
    assert.strictEqual(context.codeSync.active, false);
  });

  test('rejects unauthenticated, browser-origin, and non-read requests', async () => {
    const headers = {Authorization: `Bearer ${bridge.token}`};
    assert.strictEqual((await fetch(bridge.url)).status, 403);
    assert.strictEqual((await fetch(bridge.url, {headers: {...headers, Origin: 'https://example.com'}})).status, 403);
    assert.strictEqual((await fetch(bridge.url, {method: 'POST', headers, body: '{}'})).status, 405);
    assert.strictEqual((await fetch(bridge.url.replace('/context', '/other'), {headers})).status, 404);
  });
});
