/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Tail application logs from Managed Runtime environments via WebSocket.
 *
 * Connects to the MRT logging WebSocket to stream real-time application logs
 * from SSR environments.
 *
 * @module operations/mrt/tail-logs
 */
import type {AuthStrategy} from '../../auth/types.js';
import {DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * A parsed MRT log entry.
 */
export interface MrtLogEntry {
  /** ISO 8601 timestamp, if present. */
  timestamp?: string;
  /** Full request UUID, if present. */
  requestId?: string;
  /** Shortened request ID (first 8 hex chars). */
  shortRequestId?: string;
  /** Log level (ERROR, WARN, INFO, DEBUG, etc.), if detected. */
  level?: string;
  /** The log message content. */
  message: string;
  /** The original raw log line. */
  raw: string;
}

/**
 * Options for creating a logging JWT token.
 */
export interface CreateLoggingTokenOptions {
  /** MRT project slug. */
  projectSlug: string;
  /** MRT environment slug. */
  environmentSlug: string;
  /** MRT API origin URL. */
  origin?: string;
}

/**
 * Options for tailing MRT logs.
 */
export interface TailMrtLogsOptions {
  /** MRT project slug. */
  projectSlug: string;
  /** MRT environment slug. */
  environmentSlug: string;
  /** MRT API origin URL. */
  origin?: string;
  /** User email for the WebSocket connection. */
  user?: string;
  /** Called for each parsed log entry. */
  onEntry?: (entry: MrtLogEntry) => void;
  /** Called when the WebSocket connection is established. */
  onConnect?: () => void;
  /** Called on WebSocket error. */
  onError?: (error: Error) => void;
  /** Called when the WebSocket connection closes. */
  onClose?: (code: number, reason: string) => void;
}

/**
 * Result from starting a log tail session.
 */
export interface TailMrtLogsResult {
  /** Call to stop tailing and close the WebSocket. */
  stop: () => void;
  /** Resolves when the WebSocket connection is closed. */
  done: Promise<void>;
}

/** Known platform log levels. */
const PLATFORM_LEVELS = new Set(['ERROR', 'WARN', 'WARNING', 'INFO', 'DEBUG', 'TRACE']);

/** Heartbeat interval: 5 minutes (server has 10-min idle timeout). */
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Creates a logging JWT token for WebSocket authentication.
 *
 * POST /api/projects/{project}/target/{environment}/jwt/
 *
 * @param options - Token creation options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The JWT token string
 * @throws Error if token creation fails
 */
export async function createLoggingToken(options: CreateLoggingTokenOptions, auth: AuthStrategy): Promise<string> {
  const logger = getLogger();
  const {projectSlug, environmentSlug, origin} = options;
  const baseUrl = origin || DEFAULT_MRT_ORIGIN;

  logger.debug({projectSlug, environmentSlug}, '[MRT] Creating logging token');

  const url = `${baseUrl}/api/projects/${encodeURIComponent(projectSlug)}/target/${encodeURIComponent(environmentSlug)}/jwt/`;

  const response = await auth.fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to create logging token (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {token: string};
  logger.debug('[MRT] Logging token created');

  return data.token;
}

/**
 * Parses a raw MRT log line into a structured entry.
 *
 * Application log format (tab-separated):
 *   {ISO8601}\t{UUID}\t{LEVEL}\t{message}
 *
 * Platform log format:
 *   {LEVEL} {message}
 *
 * @param raw - The raw log line string
 * @returns Parsed log entry
 */
export function parseMrtLogLine(raw: string): MrtLogEntry {
  // Try application format: tab-separated with at least 4 fields
  const parts = raw.split('\t');

  if (parts.length >= 4) {
    const [timestamp, requestId, level, ...messageParts] = parts;

    // Validate this looks like an application log (timestamp should be ISO-ish)
    if (timestamp && /^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
      const message = messageParts.join('\t');
      return {
        timestamp,
        requestId,
        shortRequestId: requestId ? requestId.replace(/-/g, '').slice(0, 8) : undefined,
        level: level || undefined,
        message,
        raw,
      };
    }
  }

  // Try platform format: "LEVEL message"
  const spaceIdx = raw.indexOf(' ');
  if (spaceIdx > 0) {
    const maybeLevel = raw.slice(0, spaceIdx).toUpperCase();
    if (PLATFORM_LEVELS.has(maybeLevel)) {
      return {
        level: maybeLevel,
        message: raw.slice(spaceIdx + 1),
        raw,
      };
    }
  }

  // Fallback: entire line is the message
  return {
    message: raw,
    raw,
  };
}

/**
 * Transforms the MRT cloud origin URL into the logs WebSocket URL.
 *
 * Replaces the `cloud` prefix in the hostname with `logs` and switches
 * the protocol to `wss://`.
 *
 * @example
 * getLogsWebSocketUrl('https://cloud.mobify.com')
 * // → 'wss://logs.mobify.com'
 *
 * getLogsWebSocketUrl('https://cloud-soak.mrt-soak.com')
 * // → 'wss://logs-soak.mrt-soak.com'
 */
export function getLogsWebSocketUrl(origin: string): string {
  const url = new URL(origin);
  url.protocol = 'wss:';
  url.hostname = url.hostname.replace('cloud', 'logs');
  return url.origin;
}

/**
 * Streams application logs from an MRT environment via WebSocket.
 *
 * @param options - Tail options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Object with `stop()` to end streaming and `done` promise
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { tailMrtLogs } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const { stop, done } = await tailMrtLogs({
 *   projectSlug: 'my-storefront',
 *   environmentSlug: 'staging',
 *   onEntry: (entry) => console.log(entry.message),
 *   onConnect: () => console.log('Connected'),
 * }, auth);
 *
 * // Later: stop()
 * ```
 */
export async function tailMrtLogs(options: TailMrtLogsOptions, auth: AuthStrategy): Promise<TailMrtLogsResult> {
  const logger = getLogger();
  const {projectSlug, environmentSlug, origin, user, onEntry, onConnect, onError, onClose} = options;
  const baseOrigin = origin || DEFAULT_MRT_ORIGIN;

  logger.debug({projectSlug, environmentSlug, origin: baseOrigin}, '[MRT] Starting log tail');

  // Step 1: Get JWT token
  logger.trace({projectSlug, environmentSlug}, '[MRT] Requesting logging JWT token');
  const token = await createLoggingToken({projectSlug, environmentSlug, origin: baseOrigin}, auth);
  logger.trace('[MRT] Logging JWT token received');

  // Step 2: Build WebSocket URL (connect to root of logs host, like pwa-kit)
  const wsBase = getLogsWebSocketUrl(baseOrigin);
  logger.trace({cloudOrigin: baseOrigin, wsOrigin: wsBase}, '[MRT] Transformed cloud origin to WebSocket origin');

  const wsUrl = new URL(wsBase);
  wsUrl.searchParams.set('project', projectSlug);
  wsUrl.searchParams.set('environment', environmentSlug);
  wsUrl.searchParams.set('access_token', token);
  if (user) {
    wsUrl.searchParams.set('user', user);
  }

  logger.debug({wsUrl: wsUrl.toString()}, '[MRT] Opening log stream WebSocket');

  // Step 3: Open WebSocket
  const ws = new WebSocket(wsUrl.toString());
  logger.trace({readyState: ws.readyState}, '[MRT] WebSocket instance created');

  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;
  let hadError = false;

  const done = new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => {
      logger.debug('[MRT] WebSocket connected successfully');
      onConnect?.();

      // Send heartbeat to avoid idle timeout (server disconnects after 10 min)
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          logger.trace('[MRT] Sending WebSocket heartbeat');
          ws.send('');
        }
      }, HEARTBEAT_INTERVAL_MS);
      logger.trace({intervalMs: HEARTBEAT_INTERVAL_MS}, '[MRT] Heartbeat timer started');
    });

    ws.addEventListener('message', (event) => {
      logger.trace({dataLength: String(event.data).length}, '[MRT] WebSocket message received');
      if (!onEntry) return;

      try {
        const messages = JSON.parse(String(event.data)) as Array<{message: string}>;
        logger.trace({messageCount: messages.length}, '[MRT] Parsed WebSocket message batch');
        for (const msg of messages) {
          if (msg.message) {
            const entry = parseMrtLogLine(msg.message);
            onEntry(entry);
          }
        }
      } catch (err) {
        logger.debug(
          {error: err, rawData: String(event.data).slice(0, 200)},
          '[MRT] Failed to parse WebSocket message',
        );
      }
    });

    // The browser WebSocket API fires 'error' before 'close', but the error
    // event carries no details. We flag it here and report in the close handler
    // where we have the close code and reason.
    ws.addEventListener('error', () => {
      hadError = true;
      logger.debug('[MRT] WebSocket error event fired (waiting for close event for details)');
    });

    ws.addEventListener('close', (event) => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        logger.trace('[MRT] Heartbeat timer cleared');
      }

      logger.debug(
        {code: event.code, reason: event.reason, hadError, stopped, wasClean: event.code === 1000},
        '[MRT] WebSocket closed',
      );

      if (hadError && !stopped) {
        // Build a descriptive error from the close code/reason
        const detail = event.reason || `close code ${event.code}`;
        const error = new Error(`WebSocket connection failed: ${detail}`);
        logger.debug({detail, code: event.code, reason: event.reason}, '[MRT] WebSocket connection failed');
        onError?.(error);
        onClose?.(event.code, event.reason);
        reject(error);
      } else {
        onClose?.(event.code, event.reason);
        resolve();
      }
    });
  });

  const stop = (): void => {
    logger.debug('[MRT] Stopping log tail');
    stopped = true;
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      logger.trace({readyState: ws.readyState}, '[MRT] Closing WebSocket connection');
      ws.close();
    }
  };

  return {stop, done};
}