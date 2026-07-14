/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import * as assert from 'assert';
import type * as vscode from 'vscode';
import {CipQueryLibraryService} from '../../cip-analytics/cip-query-library-service.js';

/** Minimal in-memory Memento for test isolation. */
function makeMemento(initial?: Record<string, unknown>): vscode.Memento {
  const store = new Map<string, unknown>(Object.entries(initial ?? {}));
  return {
    get: (<T>(key: string, defaultValue?: T) =>
      store.has(key) ? (store.get(key) as T) : defaultValue) as vscode.Memento['get'],
    update: (key: string, value: unknown) => {
      if (value === undefined) store.delete(key);
      else store.set(key, value);
      return Promise.resolve();
    },
    keys: () => [...store.keys()],
    setKeysForSync: () => {},
  } as unknown as vscode.Memento;
}

const STORE_KEY = 'b2c-dx.cipAnalytics.savedQueries';

suite('CipQueryLibraryService', () => {
  test('starts empty when storage has nothing', () => {
    const svc = new CipQueryLibraryService(makeMemento());
    assert.deepEqual(svc.list(), []);
  });

  test('discards malformed entries from storage', () => {
    const memento = makeMemento({
      [STORE_KEY]: [
        {id: 'good', name: 'Good', sql: 'SELECT 1', tenantId: 't', createdAt: 1, updatedAt: 1},
        {id: 'bad', name: 'no-sql', tenantId: 't'},
        'not-an-object',
        null,
      ],
    });
    const svc = new CipQueryLibraryService(memento);
    const list = svc.list();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 'good');
  });

  test('save persists and lists newest first', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    const a = await svc.save({name: 'A', sql: 'SELECT 1', tenantId: 't1'});
    // Spread updatedAt by 1ms so the sort is deterministic.
    await new Promise((r) => setTimeout(r, 2));
    const b = await svc.save({name: 'B', sql: 'SELECT 2', tenantId: 't1'});
    const list = svc.list();
    assert.equal(list.length, 2);
    assert.equal(list[0].id, b.id, 'newer first');
    assert.equal(list[1].id, a.id);
    assert.equal(svc.get(a.id)?.name, 'A');
  });

  test('save trims name + description and drops empty descriptions', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    const entry = await svc.save({name: '  Padded  ', sql: 'SELECT 1', description: '   ', tenantId: 't1'});
    assert.equal(entry.name, 'Padded');
    assert.equal(entry.description, undefined);
  });

  test('listForTenant filters by tenant id', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    await svc.save({name: 'A', sql: 'SELECT 1', tenantId: 't1'});
    await svc.save({name: 'B', sql: 'SELECT 2', tenantId: 't2'});
    const t1 = svc.listForTenant('t1');
    assert.equal(t1.length, 1);
    assert.equal(t1[0].name, 'A');
  });

  test('update patches fields and bumps updatedAt', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    const entry = await svc.save({name: 'orig', sql: 'SELECT 1', tenantId: 't'});
    await new Promise((r) => setTimeout(r, 2));
    const next = await svc.update(entry.id, {name: 'renamed', sql: 'SELECT 2'});
    assert.ok(next);
    assert.equal(next!.name, 'renamed');
    assert.equal(next!.sql, 'SELECT 2');
    assert.ok(next!.updatedAt >= entry.updatedAt);
  });

  test('update returns undefined for unknown id', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    const next = await svc.update('does-not-exist', {name: 'x'});
    assert.equal(next, undefined);
  });

  test('delete removes the entry', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    const entry = await svc.save({name: 'A', sql: 'SELECT 1', tenantId: 't'});
    await svc.delete(entry.id);
    assert.equal(svc.get(entry.id), undefined);
    assert.deepEqual(svc.list(), []);
  });

  test('onDidChange fires on save and delete', async () => {
    const svc = new CipQueryLibraryService(makeMemento());
    let count = 0;
    svc.onDidChange(() => {
      count += 1;
    });
    const entry = await svc.save({name: 'A', sql: 'SELECT 1', tenantId: 't'});
    assert.equal(count, 1);
    await svc.delete(entry.id);
    assert.equal(count, 2);
  });
});
