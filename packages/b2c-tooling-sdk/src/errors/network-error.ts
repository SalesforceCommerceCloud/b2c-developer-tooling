/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Custom error class for network-layer failures during fetch requests.
 *
 * Wraps low-level network errors (connection resets, timeouts, DNS failures, TLS errors, etc.)
 * with actionable context about what operation failed, which host was targeted, and what remediation
 * steps may help.
 *
 * @example
 * try {
 *   await client.deploy();
 * } catch (error) {
 *   if (error instanceof NetworkError && error.kind === 'timeout') {
 *     console.error('Request timed out, retrying...');
 *   }
 *   throw error;
 * }
 *
 * @module errors/network-error
 */

/**
 * Classification of network error causes.
 */
export type NetworkErrorKind =
  | 'timeout'
  | 'connection-reset'
  | 'connection-refused'
  | 'dns'
  | 'tls'
  | 'aborted'
  | 'unknown';

/**
 * Error thrown when a network-layer request fails.
 *
 * Provides structured classification of network failures and actionable hints for resolution.
 */
export class NetworkError extends Error {
  /**
   * Classified network error kind.
   */
  readonly kind: NetworkErrorKind;

  /**
   * Description of the operation that failed (e.g., "WebDAV POST", "OAuth token request").
   */
  readonly operation?: string;

  /**
   * Target hostname (e.g., "sandbox.demandware.net").
   */
  readonly host?: string;

  constructor(
    message: string,
    options: {
      kind: NetworkErrorKind;
      operation?: string;
      host?: string;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'NetworkError';
    this.kind = options.kind;
    this.operation = options.operation;
    this.host = options.host;
    this.cause = options.cause;
  }
}

/**
 * Extracts error code from an error object.
 * Undici nests the real cause in `err.cause`, so we check both `err.code` and `err.cause?.code`.
 */
function extractErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object') {
    // Check top-level code
    if ('code' in err && typeof err.code === 'string') {
      return err.code;
    }
    // Check cause.code (undici nests real error in cause)
    if ('cause' in err && err.cause && typeof err.cause === 'object' && 'code' in err.cause) {
      const cause = err.cause as {code?: unknown};
      if (typeof cause.code === 'string') {
        return cause.code;
      }
    }
  }
  return undefined;
}

/**
 * Extracts error message from an error object at any depth.
 */
function extractErrorMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object') {
    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }
    if ('cause' in err) {
      return extractErrorMessage(err.cause);
    }
  }
  return undefined;
}

/**
 * Classifies a network error by inspecting error properties.
 *
 * Checks error name, code (including nested cause.code for undici), and message content
 * to determine the kind of network failure.
 *
 * @param err - The error to classify
 * @returns Classified error kind
 */
export function classifyNetworkError(err: unknown): NetworkErrorKind {
  if (!err || typeof err !== 'object') {
    return 'unknown';
  }

  const error = err as {name?: string; code?: string; message?: string; cause?: unknown};

  // Check error name first
  if (error.name === 'AbortError') {
    return 'aborted';
  }
  if (error.name === 'TimeoutError') {
    return 'timeout';
  }

  // Extract error code (checks both top-level and cause.code for undici)
  const code = extractErrorCode(err);
  if (code) {
    // Connection reset
    if (code === 'ECONNRESET' || code === 'UND_ERR_SOCKET' || code === 'EPIPE') {
      return 'connection-reset';
    }
    // Connection refused
    if (code === 'ECONNREFUSED') {
      return 'connection-refused';
    }
    // DNS failures
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
      return 'dns';
    }
    // Timeout codes
    if (
      code === 'ETIMEDOUT' ||
      code === 'UND_ERR_HEADERS_TIMEOUT' ||
      code === 'UND_ERR_BODY_TIMEOUT' ||
      code === 'UND_ERR_CONNECT_TIMEOUT'
    ) {
      return 'timeout';
    }
    // TLS/certificate errors
    if (
      code.startsWith('CERT_') ||
      code.startsWith('ERR_TLS') ||
      code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
      code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
    ) {
      return 'tls';
    }
  }

  // Check message content as fallback
  const message = extractErrorMessage(err)?.toLowerCase();
  if (message) {
    if (message.includes('socket hang up')) {
      return 'connection-reset';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
  }

  return 'unknown';
}

/**
 * Checks if an error is a network-layer error (not an HTTP/application error).
 *
 * Returns true for thrown network errors like "fetch failed", AbortError, TimeoutError,
 * or errors with recognizable network error codes.
 *
 * Returns false for HTTPError and other application-level errors that should pass through untouched.
 *
 * @param err - The error to check
 * @returns true if this is a network error
 */
export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  // Don't treat HTTPError as network error
  const error = err as {name?: string; message?: string};
  if (error.name === 'HTTPError') {
    return false;
  }

  // undici throws "fetch failed"; browsers/MSW throw "Failed to fetch"
  if (err instanceof TypeError && error.message && /fetch failed|failed to fetch/i.test(error.message)) {
    return true;
  }

  // Check for AbortError or TimeoutError
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  // Check for recognizable network error codes
  const code = extractErrorCode(err);
  if (code) {
    const networkCodes = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'EPIPE',
      'UND_ERR_SOCKET',
      'UND_ERR_HEADERS_TIMEOUT',
      'UND_ERR_BODY_TIMEOUT',
      'UND_ERR_CONNECT_TIMEOUT',
    ];
    if (networkCodes.includes(code) || code.startsWith('CERT_') || code.startsWith('ERR_TLS')) {
      return true;
    }
  }

  return false;
}

/**
 * Describes a network error kind with human-readable summary and actionable hint.
 *
 * @param kind - The network error kind
 * @returns Summary and hint for the error kind
 */
export function describeNetworkErrorKind(kind: NetworkErrorKind): {summary: string; hint: string} {
  switch (kind) {
    case 'timeout':
      return {
        summary: 'the request timed out',
        hint: 'The server or an intermediary (proxy/load balancer/WAF) may have closed an idle connection. Large or slow server-side operations can exceed network idle limits — retrying or checking the instance status may help.',
      };
    case 'connection-reset':
      return {
        summary: 'the connection was reset (socket hang up)',
        hint: 'The server, proxy, or load balancer closed the connection unexpectedly. This often happens when the sandbox is processing a long-running operation server-side (e.g., code activation) or when a network intermediary drops an idle connection. Retrying may succeed.',
      };
    case 'connection-refused':
      return {
        summary: 'the connection was refused',
        hint: 'The host is unreachable or not listening on the expected port. Check that the instance hostname is correct and that the instance is running (not stopped).',
      };
    case 'dns':
      return {
        summary: 'the hostname could not be resolved',
        hint: 'DNS lookup failed for the configured instance hostname. Verify the hostname in your dw.json or config, and check your network connection.',
      };
    case 'tls':
      return {
        summary: 'a TLS/certificate error occurred',
        hint: 'There was a problem establishing a secure connection. Check client certificate configuration (mTLS), certificate validity, or trusted CA certificates if using self-signed certs.',
      };
    case 'aborted':
      return {
        summary: 'the operation was aborted',
        hint: 'The request was canceled, likely due to a client-side timeout or explicit cancellation.',
      };
    case 'unknown':
      return {
        summary: 'a network error occurred',
        hint: 'An unexpected network failure occurred. Check your connection, instance availability, and any proxy or firewall settings.',
      };
  }
}

/**
 * Wraps a network error with context about the failed operation and target host.
 *
 * If the error is already a NetworkError, returns it as-is (possibly filling in missing context).
 * If the error is not a network error (e.g., HTTPError), returns it unchanged.
 * Otherwise, classifies and wraps the error in a NetworkError with an actionable message.
 *
 * This function does NOT throw — it returns the wrapped or original error. The caller must throw it.
 *
 * @param err - The error to wrap
 * @param context - Operation and host context for the error
 * @returns The wrapped NetworkError, or the original error if it's not a network error
 *
 * @example
 * try {
 *   await fetch(url);
 * } catch (err) {
 *   throw wrapNetworkError(err, { operation: 'OAuth token request', host: 'account.demandware.com' });
 * }
 */
export function wrapNetworkError(err: unknown, context: {operation?: string; host?: string}): NetworkError | unknown {
  // If already a NetworkError, optionally fill in missing context but don't double-wrap
  if (err instanceof NetworkError) {
    if (context.operation && !err.operation) {
      return new NetworkError(err.message, {
        kind: err.kind,
        operation: context.operation,
        host: err.host ?? context.host,
        cause: err.cause,
      });
    }
    if (context.host && !err.host) {
      return new NetworkError(err.message, {
        kind: err.kind,
        operation: err.operation ?? context.operation,
        host: context.host,
        cause: err.cause,
      });
    }
    return err;
  }

  // If not a network error, pass through unchanged
  if (!isNetworkError(err)) {
    return err;
  }

  // Classify and wrap
  const kind = classifyNetworkError(err);
  const {summary, hint} = describeNetworkErrorKind(kind);
  const operation = context.operation ?? 'Network request';
  const hostPart = context.host ? ` to ${context.host}` : '';
  const message = `${operation}${hostPart} failed: ${summary}. ${hint}`;

  return new NetworkError(message, {
    kind,
    operation: context.operation,
    host: context.host,
    cause: err,
  });
}
