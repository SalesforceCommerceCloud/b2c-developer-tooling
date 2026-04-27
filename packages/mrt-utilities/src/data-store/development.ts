/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DataStoreNotFoundError} from './errors.js';

export {DataStoreNotFoundError, DataStoreServiceError, DataStoreUnavailableError} from './errors.js';

/**
 * Development-only pseudo data store backed by environment variables.
 *
 * This class mirrors the public DataStore API while avoiding DynamoDB access.
 */
export class DataStore {
  private defaults: Record<string, Record<string, unknown>>;

  private warnOnMissing: boolean;

  private warnedKeys: Set<string>;

  private static _instance: DataStore | null = null;

  private constructor() {
    this.defaults = readDefaultsFromEnv();
    this.warnOnMissing = readWarnOnMissingFromEnv();
    this.warnedKeys = new Set<string>();
  }

  /**
   * Get or create the singleton DataStore instance.
   *
   * @returns The singleton DataStore instance
   */
  static getDataStore(): DataStore {
    if (!DataStore._instance) {
      DataStore._instance = new DataStore();
    }

    return DataStore._instance;
  }

  /**
   * Whether the data store can be used in the current environment.
   *
   * The development pseudo store is always available when loaded.
   *
   * @returns true
   */
  isDataStoreAvailable(): boolean {
    return true;
  }

  /**
   * Fetch an entry from the pseudo data store.
   *
   * @param key The data store entry's key
   * @returns An object containing the entry's key and value
   * @throws {DataStoreNotFoundError} An entry with the given key cannot be found
   */
  async getEntry(key: string): Promise<Record<string, unknown> | undefined> {
    const value = this.defaults[key];
    if (value && typeof value === 'object') {
      return {key, value};
    }

    if (this.warnOnMissing && !this.warnedKeys.has(key)) {
      this.warnedKeys.add(key);
      console.warn(`Local data-store provider did not find '${key}'.`);
    }

    throw new DataStoreNotFoundError(`Data store entry '${key}' not found.`);
  }
}

function readDefaultsFromEnv(): Record<string, Record<string, unknown>> {
  const raw = process.env.SFNEXT_DATA_STORE_DEFAULTS;
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, Record<string, unknown>>;
    }
  } catch (error) {
    console.warn('Failed to parse SFNEXT_DATA_STORE_DEFAULTS JSON.', error);
  }

  return {};
}

function readWarnOnMissingFromEnv(): boolean {
  const raw = process.env.SFNEXT_DATA_STORE_WARN_ON_MISSING;
  if (!raw) {
    return true;
  }

  return raw.toLowerCase() !== 'false';
}
