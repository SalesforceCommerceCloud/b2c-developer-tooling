/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, type GetCommandOutput} from '@aws-sdk/lib-dynamodb';

import {CircuitBreaker} from './circuit-breaker.js';
import {DataStoreNotFoundError, DataStoreServiceError, DataStoreUnavailableError} from './errors.js';
import {logMRTError, logMRTEvent} from '../utils/utils.js';

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
 * Circuit-breaker failure weight needed to trip from closed to open.
 *
 * A plain service error contributes 1 point; a throttling error contributes
 * {@link DAL_BREAKER_THROTTLE_WEIGHT}. Sized so normal miss/hit traffic (misses are not
 * failures) never opens the breaker, but a short run of real service failures does.
 */
const DAL_BREAKER_FAILURE_THRESHOLD = 5;

/**
 * Points a throttling failure contributes toward the trip threshold.
 *
 * Weighted heavier than a plain failure because sustained throttling is exactly the load
 * signal this breaker exists to shed — a handful of throttles should open it well before an
 * equal number of unrelated transient errors would.
 */
const DAL_BREAKER_THROTTLE_WEIGHT = 2;

/**
 * How long (ms) the breaker stays open before admitting a half-open probe.
 *
 * A short window: long enough to give a saturated table room to recover, short enough that a
 * false trip only briefly diverts reads to the application-level API fallback.
 */
const DAL_BREAKER_COOLDOWN_MS = 5_000;

/**
 * Consecutive successful probes required in half-open to close the breaker.
 */
const DAL_BREAKER_HALF_OPEN_PROBES = 1;

/**
 * Env var kill switch for the circuit breaker.
 *
 * Set to a truthy value (`'1'` / `'true'`) to disable breaking entirely — reads always flow
 * through to DynamoDB as if the breaker were permanently closed. Unset or falsy leaves the
 * breaker active. The only operational dial; thresholds/cooldown are engineering-tuned
 * constants, not incident-time knobs.
 */
const DAL_BREAKER_DISABLED_ENV = 'MRT_DATA_STORE_CIRCUIT_BREAKER_DISABLED';

/**
 * Whether the circuit breaker is disabled via {@link DAL_BREAKER_DISABLED_ENV}.
 */
function isBreakerDisabled(): boolean {
  const value = process.env[DAL_BREAKER_DISABLED_ENV];
  return value === '1' || value?.toLowerCase() === 'true';
}

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
  private _breaker: CircuitBreaker | null = null;
  private static _instance: DataStore | null = null;

  /** @internal Test hook: inject a document client for unit tests */
  static _testDocumentClient: DynamoDBDocumentClient | null = null;
  /** @internal Test hook: inject logMRTError for unit tests */
  static _testLogMRTError: ((namespace: string, err: unknown, context?: Record<string, unknown>) => void) | null = null;
  /** @internal Test hook: inject logMRTEvent for unit tests */
  static _testLogMRTEvent: ((namespace: string, message: string, context?: Record<string, unknown>) => void) | null =
    null;
  /** @internal Test hook: inject a deterministic random source (returns [0, 1)) for unit tests */
  static _testRandom: (() => number) | null = null;
  /** @internal Test hook: inject a circuit breaker (e.g. with a fake clock) for unit tests */
  static _testBreaker: CircuitBreaker | null = null;

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
   * Get or create this instance's circuit breaker.
   *
   * The breaker is memoized per DataStore instance so its state rides the same warm-container
   * reuse as the singleton and the memoized DynamoDB client — a cold start begins closed. It
   * emits state transitions via the MRT internal log constructs: opening is logged as an
   * error (the backend is failing), recovery/probing as an event (info level) so recovery
   * doesn't trip error-based alerting.
   *
   * @private
   * @returns The circuit breaker guarding data store reads
   */
  private getBreaker(): CircuitBreaker {
    if (DataStore._testBreaker) {
      return DataStore._testBreaker;
    }
    if (!this._breaker) {
      this._breaker = new CircuitBreaker({
        failureThreshold: DAL_BREAKER_FAILURE_THRESHOLD,
        throttleWeight: DAL_BREAKER_THROTTLE_WEIGHT,
        cooldownMs: DAL_BREAKER_COOLDOWN_MS,
        halfOpenProbes: DAL_BREAKER_HALF_OPEN_PROBES,
        onTransition: ({from, to, reason}) => {
          const context = {from, to, reason};
          if (to === 'open') {
            const logFn = DataStore._testLogMRTError ?? logMRTError;
            logFn('data_store', new Error(`Circuit breaker opened: ${reason}`), context);
          } else {
            const logFn = DataStore._testLogMRTEvent ?? logMRTEvent;
            logFn('data_store', 'circuit breaker state change', context);
          }
        },
      });
    }
    return this._breaker;
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

    // Circuit breaker: shed load when the table is failing. When open, fail fast without
    // calling DynamoDB — the client's application-level API fallback then serves correct
    // data. Skipped entirely when disabled via the kill switch.
    const breaker = isBreakerDisabled() ? null : this.getBreaker();
    if (breaker && !breaker.canRequest()) {
      throw new DataStoreServiceError('Data store request failed.');
    }

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
      breaker?.recordFailure(throttled);
      const logFn = DataStore._testLogMRTError ?? logMRTError;
      logFn('data_store', error, {key, projectEnvironment, tableName: this._tableName, errorName, throttled});
      throw new DataStoreServiceError('Data store request failed.');
    }

    // The send succeeded (the table answered) — record success even on a miss, since a miss
    // is a healthy response, not a backend failure.
    breaker?.recordSuccess();

    if (!response.Item?.value) {
      throw new DataStoreNotFoundError(`Data store entry '${key}' not found.`);
    }

    return {key, value: response.Item.value};
  }
}
