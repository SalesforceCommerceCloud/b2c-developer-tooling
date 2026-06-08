/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

const STORAGE_KEY = 'b2c-dx.docs.recents';
const MAX_RECENTS = 10;

/**
 * Minimal storage surface so we can unit-test the recents logic without a
 * VS Code ExtensionContext. Keys/values are JSON-serializable.
 */
export interface RecentsStorage {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): Thenable<void>;
}

/**
 * In-order LRU of recently opened entry ids. Most-recent first. Strings only;
 * the caller is responsible for resolving them back to entries via the loader.
 */
export class DocsRecents {
  constructor(
    private readonly storage: RecentsStorage,
    private readonly max: number = MAX_RECENTS,
  ) {}

  list(): string[] {
    const raw = this.storage.get<unknown>(STORAGE_KEY);
    if (!Array.isArray(raw)) return [];
    return raw.filter((value): value is string => typeof value === 'string').slice(0, this.max);
  }

  /**
   * Record an id as the most-recent. Moves it to the front if already present;
   * trims to `max` length. Returns the new list (no need to await persistence
   * for the caller to reflect the new state).
   */
  async push(id: string): Promise<string[]> {
    if (!id) return this.list();
    const current = this.list().filter((existing) => existing !== id);
    current.unshift(id);
    if (current.length > this.max) current.length = this.max;
    await this.storage.update(STORAGE_KEY, current);
    return current;
  }

  async clear(): Promise<void> {
    await this.storage.update(STORAGE_KEY, []);
  }
}
