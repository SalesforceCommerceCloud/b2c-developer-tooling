/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, type GetCommandOutput} from '@aws-sdk/lib-dynamodb';

import {DataStoreNotFoundError, DataStoreServiceError, DataStoreUnavailableError} from './errors.js';
import {logMRTError} from '../utils/utils.js';

export {DataStoreNotFoundError, DataStoreServiceError, DataStoreUnavailableError} from './errors.js';

/**
 * Retry mode for the data store DynamoDB client.
 *
 * `'adaptive'` adds a client-side rate limiter that backs off proactively when the table
 * signals throttling, instead of retrying blindly into an already-saturated table. The
 * rate limiter keeps state on the client instance, so it only helps across invocations on
 * a warm container — the memoized client preserves that state.
 */
const DAL_RETRY_MODE = 'adaptive';

/**
 * Maximum number of attempts (initial request + retries) per data store request.
 *
 * Bounds retry fan-out under sustained throttling. Chosen together with
 * {@link DAL_REQUEST_TIMEOUT_MS} so that `DAL_MAX_ATTEMPTS × DAL_REQUEST_TIMEOUT_MS` stays
 * comfortably under the surrounding request/function timeout.
 */
const DAL_MAX_ATTEMPTS = 2;

/**
 * Maximum time (ms) to wait for a connection to be established per attempt.
 *
 * A hard per-attempt ceiling so a slow/hung connection cannot consume the whole budget.
 * The client is memoized on a warm container and reuses keep-alive connections, so most
 * attempts do not open a new connection; a fresh connect exceeding this is already
 * abnormal.
 */
const DAL_CONNECTION_TIMEOUT_MS = 300;

/**
 * Maximum time (ms) to wait for a response per attempt.
 *
 * A hard per-attempt ceiling. A single-key DynamoDB read is typically single-digit ms, so
 * this leaves a large multiple of headroom over p99 while still failing fast on a genuine
 * hang. See {@link DAL_MAX_ATTEMPTS} for the timeout/attempt invariant relative to the
 * surrounding function timeout — with these defaults the worst-case timeout path is
 * roughly `DAL_MAX_ATTEMPTS × DAL_REQUEST_TIMEOUT_MS` (≈1s) plus adaptive-retry backoff
 * between attempts.
 */
const DAL_REQUEST_TIMEOUT_MS = 500;

/**
 * Error names that indicate the request was throttled.
 *
 * Mirrors the AWS SDK's own throttling classification so the telemetry flag agrees with
 * what actually drove adaptive backoff, rather than a hand-maintained subset.
 */
const THROTTLING_ERROR_NAMES = new Set([
  'ThrottlingException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  'RequestThrottled',
  'RequestThrottledException',
  'TooManyRequestsException',
  'ThrottledException',
  'Throttling',
]);

/**
 * Whether an error represents a throttling response.
 *
 * Checks the SDK's retryable-throttling trait and an HTTP 429 status in addition to the
 * known throttling error names, so throttles surfaced only via metadata are still flagged.
 */
function isThrottlingError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as {
    name?: unknown;
    $retryable?: {throttling?: unknown};
    $metadata?: {httpStatusCode?: unknown};
  };
  if (candidate.$retryable?.throttling === true) {
    return true;
  }
  if (candidate.$metadata?.httpStatusCode === 429) {
    return true;
  }
  return typeof candidate.name === 'string' && THROTTLING_ERROR_NAMES.has(candidate.name);
}

/**
 * Create the DynamoDB client used by the data store, configured for resilient reads under
 * throttling: adaptive retries, bounded attempts, and hard per-attempt timeouts.
 *
 * @returns A configured DynamoDB client
 */
export function createDalDynamoDBClient(): DynamoDBClient {
  return new DynamoDBClient({
    region: process.env.AWS_REGION,
    retryMode: DAL_RETRY_MODE,
    maxAttempts: DAL_MAX_ATTEMPTS,
    // Passing a plain object lets the SDK construct its default NodeHttpHandler with these
    // bounds — no direct dependency on the handler package required. `throwOnRequestTimeout`
    // is required for `requestTimeout` to actually abort a hung request: without it the
    // handler only logs a warning and lets the request run on. Safe here because a DAL read
    // is a simple request/response, not a long-lived stream.
    requestHandler: {
      connectionTimeout: DAL_CONNECTION_TIMEOUT_MS,
      requestTimeout: DAL_REQUEST_TIMEOUT_MS,
      throwOnRequestTimeout: true,
    },
  });
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
      this._ddb = DynamoDBDocumentClient.from(createDalDynamoDBClient());
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
      const errorName = error instanceof Error ? error.name : undefined;
      const throttled = isThrottlingError(error);
      const logFn = DataStore._testLogMRTError ?? logMRTError;
      logFn('data_store', error, {key, tableName: this._tableName, errorName, throttled});
      throw new DataStoreServiceError('Data store request failed.');
    }

    if (!response.Item?.value) {
      throw new DataStoreNotFoundError(`Data store entry '${key}' not found.`);
    }

    return {key, value: response.Item.value};
  }
}
