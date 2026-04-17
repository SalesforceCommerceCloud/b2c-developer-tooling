/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, type GetCommandOutput} from '@aws-sdk/lib-dynamodb';

import {logMRTError} from '../utils/utils.js';

export class DataStoreNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreNotFoundError';
    Object.setPrototypeOf(this, DataStoreNotFoundError.prototype);
  }
}

export class DataStoreServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreServiceError';
    Object.setPrototypeOf(this, DataStoreServiceError.prototype);
  }
}

export class DataStoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreUnavailableError';
    Object.setPrototypeOf(this, DataStoreUnavailableError.prototype);
  }
}

/**
 * A class for reading entries from the data store.
 *
 * This class uses a singleton pattern.
 * Use DataStore.getDataStore() to get the singleton instance.
 */
export class DataStore {
  private _tableName: string = '';
  private _ddb: DynamoDBDocumentClient | null = null;
  private static _instance: DataStore | null = null;

  /** @internal Test hook: inject a document client for unit tests */
  static _testDocumentClient: DynamoDBDocumentClient | null = null;
  /** @internal Test hook: inject logMRTError for unit tests */
  static _testLogMRTError: ((namespace: string, err: unknown, context?: Record<string, unknown>) => void) | null = null;

  private constructor() {
    // Private constructor for singleton; use DataStore.getDataStore() instead.
  }

  /**
   * Get or create a DynamoDB document client (for abstraction of attribute values).
   *
   * @private
   * @returns The DynamoDB document client
   * @throws {DataStoreUnavailableError} The data store is unavailable
   */
  private getClient(): DynamoDBDocumentClient {
    if (!this.isDataStoreAvailable()) {
      throw new DataStoreUnavailableError('The data store is unavailable.');
    }

    if (DataStore._testDocumentClient) {
      this._tableName = `DataAccessLayer-${process.env.AWS_REGION}`;
      return DataStore._testDocumentClient;
    }

    if (!this._ddb) {
      this._tableName = `DataAccessLayer-${process.env.AWS_REGION}`;
      this._ddb = DynamoDBDocumentClient.from(
        new DynamoDBClient({
          region: process.env.AWS_REGION,
        }),
      );
    }

    return this._ddb;
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
   * @returns true if the data store is available, false otherwise
   */
  isDataStoreAvailable(): boolean {
    return Boolean(process.env.AWS_REGION && process.env.MOBIFY_PROPERTY_ID && process.env.DEPLOY_TARGET);
  }

  /**
   * Fetch an entry from the data store.
   *
   * @param key The data store entry's key
   * @returns An object containing the entry's key and value
   * @throws {DataStoreUnavailableError} The data store is unavailable
   * @throws {DataStoreNotFoundError} An entry with the given key cannot be found
   * @throws {DataStoreServiceError} An internal error occurred
   */
  async getEntry(key: string): Promise<Record<string, unknown> | undefined> {
    if (!this.isDataStoreAvailable()) {
      throw new DataStoreUnavailableError('The data store is unavailable.');
    }

    const ddb = this.getClient();
    let response: GetCommandOutput;
    try {
      response = await ddb.send(
        new GetCommand({
          TableName: this._tableName,
          Key: {
            projectEnvironment: `${process.env.MOBIFY_PROPERTY_ID} ${process.env.DEPLOY_TARGET}`,
            key,
          },
        }),
      );
    } catch (error) {
      const logFn = DataStore._testLogMRTError ?? logMRTError;
      logFn('data_store', error, {key, tableName: this._tableName});
      throw new DataStoreServiceError('Data store request failed.');
    }

    if (!response.Item?.value) {
      throw new DataStoreNotFoundError(`Data store entry '${key}' not found.`);
    }

    return {key, value: response.Item.value};
  }
}
