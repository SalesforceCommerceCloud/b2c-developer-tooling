/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type {AuthSession} from '@salesforce/b2c-tooling-sdk/auth';
import type * as vscode from 'vscode';
import {VsCodeSecretsAuthSessionBackend} from '../pkce-secret-store.js';

/**
 * Fake VS Code SecretStorage backed by a Map. Mirrors the surface the backend
 * actually uses (get / store / delete). Returning Promises matches the real
 * SecretStorage so async write-through behavior is exercised.
 */
class FakeSecretStorage implements vscode.SecretStorage {
  readonly secrets = new Map<string, string>();
  // SecretStorage exposes onDidChange in the real API; the backend doesn't
  // subscribe to it, but we still satisfy the type with a no-op event.
  onDidChange = (() => ({dispose() {}})) as unknown as vscode.Event<vscode.SecretStorageChangeEvent>;

  async get(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }

  async store(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.secrets.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.secrets.keys()];
  }
}

class FakeMemento implements vscode.Memento {
  readonly values = new Map<string, unknown>();

  keys(): readonly string[] {
    return [...this.values.keys()];
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return (this.values.has(key) ? (this.values.get(key) as T) : defaultValue) as T | undefined;
  }

  async update(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      this.values.delete(key);
    } else {
      this.values.set(key, value);
    }
  }

  setKeysForSync(_keys: readonly string[]): void {}
}

function makeContext() {
  const secrets = new FakeSecretStorage();
  const globalState = new FakeMemento();
  const context = {secrets, globalState} as unknown as vscode.ExtensionContext;
  return {context, secrets, globalState};
}

/**
 * The backend writes to SecretStorage asynchronously after `save`/`delete`/
 * `clearAll` return. Tests need a way to await those writes. We resolve a
 * macrotask, which is sufficient because every async write in the backend is
 * a single `await secrets.x()` chained off a microtask.
 */
function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeSession(clientId: string, overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    clientId,
    flow: 'pkce',
    accessToken: `at-${clientId}`,
    refreshToken: `rt-${clientId}`,
    sub: 'user@example.com',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    scopes: ['sfcc.products'],
    accountManagerHost: 'account.demandware.com',
    ...overrides,
  };
}

suite('VsCodeSecretsAuthSessionBackend', () => {
  test('hydrate is a no-op when nothing is stored', async () => {
    const {context} = makeContext();
    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();
    assert.deepStrictEqual(backend.list(), []);
    assert.strictEqual(backend.find('any-client'), null);
  });

  test('save writes through to SecretStorage and updates the index', async () => {
    const {context, secrets, globalState} = makeContext();
    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    backend.save(makeSession('client-a'));

    // Sync read sees the snapshot immediately.
    const snapshot = backend.find('client-a');
    assert.ok(snapshot, 'snapshot must be readable synchronously');
    assert.strictEqual(snapshot.accessToken, 'at-client-a');
    assert.strictEqual(typeof snapshot.lastUsedAt, 'string');

    // Background write completes, secret + index are persisted.
    await flush();
    const persisted = secrets.secrets.get('b2c.auth.session.client-a');
    assert.ok(persisted, 'secret should be written to the keychain');
    const parsed = JSON.parse(persisted) as AuthSession;
    assert.strictEqual(parsed.accessToken, 'at-client-a');
    assert.deepStrictEqual(globalState.values.get('b2c.auth.sessions.index'), ['client-a']);
  });

  test('hydrate restores a snapshot from a previously stored secret', async () => {
    const {context, secrets, globalState} = makeContext();
    const session = makeSession('persistent');
    secrets.secrets.set('b2c.auth.session.persistent', JSON.stringify(session));
    globalState.values.set('b2c.auth.sessions.index', ['persistent']);

    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    const found = backend.find('persistent');
    assert.ok(found);
    assert.strictEqual(found.accessToken, 'at-persistent');
    assert.strictEqual(found.refreshToken, 'rt-persistent');
  });

  test('list returns every hydrated session', async () => {
    const {context} = makeContext();
    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    backend.save(makeSession('client-a'));
    backend.save(makeSession('client-b', {flow: 'client-credentials', refreshToken: null}));

    const all = backend.list();
    assert.strictEqual(all.length, 2);
    assert.deepStrictEqual(
      all.map((s) => s.clientId).sort(),
      ['client-a', 'client-b'],
    );
  });

  test('save replaces a prior record for the same clientId', async () => {
    const {context, secrets} = makeContext();
    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    backend.save(makeSession('client-a'));
    await flush();

    backend.save(makeSession('client-a', {accessToken: 'at-rotated', refreshToken: 'rt-rotated'}));
    await flush();

    const replaced = backend.find('client-a');
    assert.strictEqual(replaced?.accessToken, 'at-rotated');
    assert.strictEqual(replaced?.refreshToken, 'rt-rotated');

    const stored = JSON.parse(secrets.secrets.get('b2c.auth.session.client-a')!) as AuthSession;
    assert.strictEqual(stored.accessToken, 'at-rotated');
  });

  test('delete removes the session from snapshot, secrets, and index', async () => {
    const {context, secrets, globalState} = makeContext();
    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    backend.save(makeSession('client-a'));
    backend.save(makeSession('client-b'));
    await flush();

    backend.delete('client-a');
    await flush();

    assert.strictEqual(backend.find('client-a'), null);
    assert.ok(backend.find('client-b'), 'unrelated session must remain');
    assert.strictEqual(secrets.secrets.has('b2c.auth.session.client-a'), false);
    assert.deepStrictEqual(globalState.values.get('b2c.auth.sessions.index'), ['client-b']);
  });

  test('clearAll wipes all sessions and the index', async () => {
    const {context, secrets, globalState} = makeContext();
    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    backend.save(makeSession('client-a'));
    backend.save(makeSession('client-b'));
    await flush();

    backend.clearAll();
    await flush();

    assert.strictEqual(backend.list().length, 0);
    assert.strictEqual(secrets.secrets.size, 0);
    assert.strictEqual(globalState.values.get('b2c.auth.sessions.index'), undefined);
  });

  test('hydrate skips records with corrupted JSON', async () => {
    const {context, secrets, globalState} = makeContext();
    secrets.secrets.set('b2c.auth.session.broken', '{not json');
    secrets.secrets.set('b2c.auth.session.ok', JSON.stringify(makeSession('ok')));
    globalState.values.set('b2c.auth.sessions.index', ['broken', 'ok']);

    const backend = new VsCodeSecretsAuthSessionBackend(context);
    await backend.hydrate();

    assert.strictEqual(backend.find('broken'), null);
    assert.ok(backend.find('ok'));
  });
});
