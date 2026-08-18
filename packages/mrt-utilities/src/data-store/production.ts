/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, type GetCommandOutput} from '@aws-sdk/lib-dynamodb';
import {SpanStatusCode, trace} from '@opentelemetry/api';

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
const DATA_STORE_RETRY_MODE = 'adaptive';

/**
 * Tracer for data store operations.
 *
 * This is a library, so we depend only on `@opentelemetry/api` and never register a
 * provider ourselves — the host runtime owns that. When no provider is registered (e.g.
 * local development, or any consumer that has not set up tracing) `getTracer` returns a
 * no-op tracer, so instrumentation is silent and adds negligible overhead. When the host
 * has registered a provider (the Managed Runtime storefront registers one that exports
 * spans to stdout for MRT to ship), the span joins the ambient trace context.
 */
const tracer = trace.getTracer('@salesforce/mrt-utilities');

/**
 * Span name for a single data store fetch.
 *
 * Deliberately static and low-cardinality so traces aggregate by operation. The
 * high-cardinality request detail (the entry key, the resolved partition key) is attached
 * as span attributes instead of being baked into the name.
 */
const GET_ENTRY_SPAN_NAME = 'mrt.data_store.getEntry';

/**
 * Maximum number of attempts (initial request + retries) per data store request.
 *
 * Bounds retry fan-out under sustained throttling. Chosen together with
 * {@link DATA_STORE_REQUEST_TIMEOUT_MS} so that `DATA_STORE_MAX_ATTEMPTS × DATA_STORE_REQUEST_TIMEOUT_MS` stays
 * comfortably under the surrounding request/function timeout.
 */
const DATA_STORE_MAX_ATTEMPTS = 2;

/**
 * Maximum time (ms) to wait for a connection to be established per attempt.
 *
 * A hard per-attempt ceiling so a slow/hung connection cannot consume the whole budget.
 * The client is memoized on a warm container and reuses keep-alive connections, so most
 * attempts do not open a new connection; a fresh connect exceeding this is already
 * abnormal.
 */
const DATA_STORE_CONNECTION_TIMEOUT_MS = 300;

/**
 * Maximum time (ms) to wait for a response per attempt.
 *
 * A hard per-attempt ceiling. A single-key DynamoDB read is typically single-digit ms, so
 * this leaves a large multiple of headroom over p99 while still failing fast on a genuine
 * hang. See {@link DATA_STORE_MAX_ATTEMPTS} for the timeout/attempt invariant relative to the
 * surrounding function timeout — with these defaults the worst-case timeout path is
 * roughly `DATA_STORE_MAX_ATTEMPTS × DATA_STORE_REQUEST_TIMEOUT_MS` (≈1s) plus adaptive-retry backoff
 * between attempts.
 */
const DATA_STORE_REQUEST_TIMEOUT_MS = 500;

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
    retryMode: DATA_STORE_RETRY_MODE,
    maxAttempts: DATA_STORE_MAX_ATTEMPTS,
    // Passing a plain object lets the SDK construct its default NodeHttpHandler with these
    // bounds — no direct dependency on the handler package required. `throwOnRequestTimeout`
    // is required for `requestTimeout` to actually abort a hung request: without it the
    // handler only logs a warning and lets the request run on. Safe here because a data store read
    // is a simple request/response, not a long-lived stream.
    requestHandler: {
      connectionTimeout: DATA_STORE_CONNECTION_TIMEOUT_MS,
      requestTimeout: DATA_STORE_REQUEST_TIMEOUT_MS,
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
  /** @internal Test hook: inject a deterministic random source (returns [0, 1)) for unit tests */
  static _testRandom: (() => number) | null = null;

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
   * Resolve the DynamoDB partition key for a read, applying shard selection.
   *
   * Reads the shard count from `MRT_NUM_SHARDS` (default 1) and picks a random
   * shard `i` in `[0, N)`. Shard 0 is the legacy unsuffixed partition key, so
   * when `MRT_NUM_SHARDS` is unset or 1 this is identical to today's behavior.
   * There is no runtime fallback: writers fan out to every shard, so every shard
   * a reader can pick is guaranteed to exist.
   *
   * @private
   * @returns The `projectEnvironment` partition key value to read
   */
  private resolveShardPartitionKey(): string {
    const base = `${process.env.MOBIFY_PROPERTY_ID} ${process.env.DEPLOY_TARGET}`;

    const parsed = Number(process.env.MRT_NUM_SHARDS);
    const numShards = Number.isInteger(parsed) && parsed > 1 ? parsed : 1;
    if (numShards === 1) {
      return base;
    }

    const random = DataStore._testRandom ?? Math.random;
    const shard = Math.floor(random() * numShards);
    // shard 0 is the legacy unsuffixed partition; shards 1..N-1 carry a suffix.
    return shard === 0 ? base : `${base} ${shard}`;
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
    const projectEnvironment = this.resolveShardPartitionKey();

    // Trace the fetch as a client span. Semantic-convention DynamoDB attributes describe
    // the operation; the outcome (found/throttled/error) is recorded on the span below.
    return tracer.startActiveSpan(
      GET_ENTRY_SPAN_NAME,
      {
        attributes: {
          'db.system': 'dynamodb',
          'db.operation': 'GetItem',
          'aws.dynamodb.table_names': this._tableName,
        },
      },
      async (span) => {
        // End the span exactly once, after all attributes/status are set on every path
        // (success, miss, and error). Attributes set after end() are dropped by OTel, so we
        // cannot end in a `finally` that runs before the found/not-found branch below.
        try {
          let response: GetCommandOutput;
          try {
            response = await ddb.send(
              new GetCommand({
                TableName: this._tableName,
                Key: {
                  projectEnvironment,
                  key,
                },
              }),
            );
          } catch (error) {
            const errorName = error instanceof Error ? error.name : undefined;
            const throttled = isThrottlingError(error);
            span.setAttribute('mrt.data_store.throttled', throttled);
            if (errorName) {
              span.setAttribute('error.type', errorName);
            }
            if (error instanceof Error) {
              span.recordException(error);
            }
            span.setStatus({code: SpanStatusCode.ERROR, message: 'Data store request failed.'});
            const logFn = DataStore._testLogMRTError ?? logMRTError;
            logFn('data_store', error, {key, projectEnvironment, tableName: this._tableName, errorName, throttled});
            throw new DataStoreServiceError('Data store request failed.');
          }

          if (!response.Item?.value) {
            // A miss is an expected outcome, not a service error — record it as an attribute
            // and leave the span status unset (successful fetch that found nothing).
            span.setAttribute('mrt.data_store.found', false);
            throw new DataStoreNotFoundError(`Data store entry '${key}' not found.`);
          }

          span.setAttribute('mrt.data_store.found', true);
          return {key, value: response.Item.value};
        } finally {
          span.end();
        }
      },
    );
  }
}
