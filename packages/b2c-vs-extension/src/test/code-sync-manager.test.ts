/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import type {FileChange} from '@salesforce/b2c-tooling-sdk/operations/code';
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {CodeSyncManager, isAuthUploadError, uploadErrorStatus} from '../code-sync/code-sync-manager.js';
import type {B2CExtensionConfig} from '../config-provider.js';

interface UploadCall {
  uploads: string[];
  deletes: string[];
  at: number;
}

const memento = {keys: () => [], get: () => undefined, update: async () => {}} as unknown as vscode.Memento;
const instance = {config: {hostname: 'sync.invalid', codeVersion: 'v1'}} as unknown as B2CInstance;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Invoke the watcher callbacks directly instead of waiting for file system events. */
function touch(manager: CodeSyncManager, file: string): void {
  (manager as unknown as {onFileChange(uri: vscode.Uri): void}).onFileChange(vscode.Uri.file(file));
}

function remove(manager: CodeSyncManager, file: string): void {
  (manager as unknown as {onFileDelete(uri: vscode.Uri): void}).onFileDelete(vscode.Uri.file(file));
}

suite('code sync upload failures', () => {
  let dir: string;
  let cartridge: string;
  let calls: UploadCall[];
  let failures: Error[];
  let manager: CodeSyncManager;

  setup(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-code-sync-'));
    cartridge = path.join(dir, 'app_custom');
    fs.mkdirSync(path.join(cartridge, 'cartridge'), {recursive: true});
    fs.writeFileSync(path.join(cartridge, '.project'), '<projectDescription/>');
    fs.writeFileSync(path.join(cartridge, 'cartridge', 'a.js'), '');
    fs.writeFileSync(path.join(cartridge, 'cartridge', 'b.js'), '');
    calls = [];
    failures = [];
    const upload = async (_instance: B2CInstance, _version: string, uploads: FileChange[], deletes: FileChange[]) => {
      calls.push({
        uploads: uploads.map((f) => path.basename(f.src)),
        deletes: deletes.map((f) => path.basename(f.src)),
        at: Date.now(),
      });
      const failure = failures.shift();
      if (failure) throw failure;
    };
    manager = new CodeSyncManager(memento, {} as B2CExtensionConfig, upload, {initialRetryMs: 400, maxRetryMs: 800});
  });

  async function waitForCalls(count: number): Promise<void> {
    const deadline = Date.now() + 5000;
    while (calls.length < count) {
      if (Date.now() > deadline) assert.fail(`expected ${count} upload attempt(s), saw ${calls.length}`);
      await sleep(20);
    }
  }

  teardown(async () => {
    await manager.stopWatch();
    manager.dispose();
    fs.rmSync(dir, {recursive: true, force: true});
  });

  test('classifies auth failures from HTTP errors and messages', () => {
    assert.strictEqual(uploadErrorStatus({response: {status: 403}}), 403);
    assert.strictEqual(isAuthUploadError(new Error('PUT failed: 401 Unauthorized')), true);
    assert.strictEqual(isAuthUploadError(new Error('Unzip failed: 403')), true);
    assert.strictEqual(isAuthUploadError(new Error('PUT failed: 503 Service Unavailable')), false);
    assert.strictEqual(isAuthUploadError(new Error('socket hang up')), false);
  });

  test('pauses on an auth failure and retries only on the next save', async () => {
    await manager.startWatch(instance, dir);
    failures.push(new Error('PUT failed: 401 Unauthorized'));

    touch(manager, path.join(cartridge, 'cartridge', 'a.js'));
    await waitForCalls(1);
    await sleep(800);
    assert.strictEqual(calls.length, 1, 'an auth failure is not retried on a timer');

    touch(manager, path.join(cartridge, 'cartridge', 'b.js'));
    await waitForCalls(2);
    assert.deepStrictEqual(calls[1].uploads.sort(), ['a.js', 'b.js'], 'the failed change is retried with the new one');
  });

  test('backs off transient failures and keeps failed deletes', async () => {
    await manager.startWatch(instance, dir);
    failures.push(new Error('PUT failed: 503 Service Unavailable'), new Error('socket hang up'));

    touch(manager, path.join(cartridge, 'cartridge', 'a.js'));
    remove(manager, path.join(cartridge, 'cartridge', 'gone.js'));
    await waitForCalls(1);

    // A save during the retry delay waits for it instead of retrying immediately.
    touch(manager, path.join(cartridge, 'cartridge', 'b.js'));
    await waitForCalls(3);

    // Timers never fire early, so lower bounds are deterministic.
    assert.ok(calls[1].at - calls[0].at >= 390, `first retry after ${calls[1].at - calls[0].at}ms`);
    assert.ok(calls[2].at - calls[1].at >= 790, `the retry delay doubles (${calls[2].at - calls[1].at}ms)`);
    assert.deepStrictEqual(calls[2].uploads.sort(), ['a.js', 'b.js']);
    assert.deepStrictEqual(calls[2].deletes, ['gone.js']);
  });

  test('a configuration reload retries pending changes against the same instance', async () => {
    await manager.startWatch(instance, dir);
    failures.push(new Error('PUT failed: 401 Unauthorized'));
    touch(manager, path.join(cartridge, 'cartridge', 'a.js'));
    await waitForCalls(1);

    manager.suspendForReload();
    assert.strictEqual(calls.length, 1, 'suspending does not make a last attempt with the old configuration');
    const reloaded = {config: {hostname: 'sync.invalid', codeVersion: 'v1'}} as unknown as B2CInstance;
    await manager.startWatch(reloaded, dir);
    await waitForCalls(2);

    assert.deepStrictEqual(calls[1].uploads, ['a.js']);
  });

  test('a configuration reload to another instance drops pending changes', async () => {
    await manager.startWatch(instance, dir);
    failures.push(new Error('PUT failed: 401 Unauthorized'));
    touch(manager, path.join(cartridge, 'cartridge', 'a.js'));
    await waitForCalls(1);

    manager.suspendForReload();
    const other = {config: {hostname: 'other.invalid', codeVersion: 'v1'}} as unknown as B2CInstance;
    await manager.startWatch(other, dir);
    await sleep(400);

    assert.strictEqual(calls.length, 1);
  });

  test('stopping makes one immediate attempt instead of waiting out the retry delay', async () => {
    await manager.startWatch(instance, dir);
    failures.push(new Error('socket hang up'), new Error('socket hang up'));

    touch(manager, path.join(cartridge, 'cartridge', 'a.js'));
    await waitForCalls(1);
    const started = Date.now();
    await manager.stopWatch();

    assert.strictEqual(calls.length, 2);
    assert.ok(Date.now() - started < 390, 'stop does not wait for the retry delay');
  });
});
