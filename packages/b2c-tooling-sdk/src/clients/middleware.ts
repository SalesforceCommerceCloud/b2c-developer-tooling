/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Shared middleware for openapi-fetch clients.
 *
 * Provides reusable authentication and logging middleware that can be
 * used across all API clients (OCAPI, SLAS, SCAPI, etc.).
 *
 * @module clients/middleware
 */
import type {Middleware} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import {getLogger} from '../logging/logger.js';

/**
 * Configuration for extra parameters middleware.
 */
export interface ExtraParamsConfig {
  /** Extra query parameters to add to the URL */
  query?: Record<string, string | number | boolean | undefined>;
  /** Extra body fields to merge into JSON request bodies */
  body?: Record<string, unknown>;
  /** Extra HTTP headers to add to all requests */
  headers?: Record<string, string>;
}

/**
 * Converts Headers to a plain object for logging.
 */
function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Creates authentication middleware for openapi-fetch.
 *
 * This middleware intercepts requests and adds OAuth authentication headers
 * using the provided AuthStrategy.
 *
 * @param auth - The authentication strategy to use
 * @returns Middleware that adds auth headers to requests
 */
export function createAuthMiddleware(auth: AuthStrategy): Middleware {
  return {
    async onRequest({request}) {
      if (auth.getAuthorizationHeader) {
        const authHeader = await auth.getAuthorizationHeader();
        request.headers.set('Authorization', authHeader);
      }
      return request;
    },
  };
}

/**
 * Configuration for rate limiting middleware.
 */
export interface RateLimitMiddlewareConfig {
  /**
   * Maximum number of retry attempts when a rate limit response is received.
   * Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds used for exponential backoff when no Retry-After
   * header is present. Defaults to 1000ms.
   */
  baseDelayMs?: number;

  /**
   * Maximum delay in milliseconds between retries. Defaults to 30000ms.
   */
  maxDelayMs?: number;

  /**
   * HTTP status codes that should trigger rate limit handling.
   * Defaults to [429]. 503 is often used for overload, but is not included
   * by default to avoid surprising retries for maintenance windows.
   */
  statusCodes?: number[];

  /**
   * Optional log prefix (e.g., 'MRT') used in log messages.
   */
  prefix?: string;

  /**
   * Optional fetch implementation used for retries when the middleware context
   * does not provide a re-dispatch helper.
   */
  fetch?: (request: Request) => Promise<Response>;
}

const DEFAULT_RATE_LIMIT_MAX_RETRIES = 3;
const DEFAULT_RATE_LIMIT_BASE_DELAY_MS = 1000;
const DEFAULT_RATE_LIMIT_MAX_DELAY_MS = 30000;
const DEFAULT_RATE_LIMIT_STATUS_CODES = [429];
const DEFAULT_RATE_LIMIT_JITTER_RATIO = 0.2;

async function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<boolean> {
  if (ms <= 0) {
    return true;
  }

  if (signal?.aborted) {
    return false;
  }

  await new Promise<void>((resolve) => {
    function onAbort() {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort);
  });

  return !signal?.aborted;
}

/**
 * Parses the Retry-After header into a delay in milliseconds.
 * Supports both seconds and HTTP date formats. Returns undefined if
 * the header is missing or invalid.
 */
function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) {
    return undefined;
  }

  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, Math.round(seconds * 1000));
  }

  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    return diff > 0 ? diff : 0;
  }

  return undefined;
}

/**
 * Returns the next backoff delay based on attempt count.
 */
function computeBackoffDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, Math.max(0, attempt));
  if (delay <= 0) {
    return 0;
  }

  const jitter = Math.round(delay * DEFAULT_RATE_LIMIT_JITTER_RATIO * Math.random());
  return Math.min(delay + jitter, maxDelayMs);
}

/**
 * Creates rate limiting middleware for openapi-fetch clients.
 *
 * This middleware inspects responses for rate-limit status codes (by default
 * 429 Too Many Requests), uses the Retry-After header when present to
 * determine a delay, and retries the request up to a configurable limit.
 *
 * The middleware is generic and can be used by MRT and other clients. It does
 * not currently read CLI configuration directly; callers should pass
 * configuration via the factory function.
 */
export function createRateLimitMiddleware(config: RateLimitMiddlewareConfig = {}): Middleware {
  const logger = getLogger();
  const {
    maxRetries = DEFAULT_RATE_LIMIT_MAX_RETRIES,
    baseDelayMs = DEFAULT_RATE_LIMIT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_RATE_LIMIT_MAX_DELAY_MS,
    statusCodes = DEFAULT_RATE_LIMIT_STATUS_CODES,
    prefix,
    fetch: configFetch,
  } = config;

  const tag = prefix ? `[${prefix} RATE]` : '[RATE]';

  return {
    async onResponse(ctx) {
      const {request, response} = ctx;
      const ctxFetch = (ctx as {fetch?: (request: Request) => Promise<Response>}).fetch;
      // Only handle configured status codes
      if (!statusCodes.includes(response.status) || maxRetries <= 0) {
        return response;
      }

      const fetchFn: ((request: Request) => Promise<Response>) | undefined =
        ctxFetch ?? configFetch ?? (typeof fetch === 'function' ? fetch : undefined);

      if (!fetchFn) {
        return response;
      }

      const reqWithAttempt = request as Request & {_rateLimitAttempt?: number};
      const startingAttempt = reqWithAttempt._rateLimitAttempt ?? 0;

      // If openapi-fetch provides ctx.fetch, it typically re-enters the middleware chain.
      // In that case, do a single retry and let subsequent attempts be handled by
      // subsequent middleware invocations (guarded by _rateLimitAttempt).
      if (ctxFetch) {
        if (startingAttempt >= maxRetries) {
          logger.debug(
            {status: response.status, attempt: startingAttempt, maxRetries},
            `${tag} Max retries reached, not retrying request`,
          );
          return response;
        }

        const retryAfterHeader = response.headers.get('Retry-After');
        let delayMs = parseRetryAfter(retryAfterHeader);

        if (delayMs === undefined) {
          delayMs = computeBackoffDelayMs(startingAttempt, baseDelayMs, maxDelayMs);
        } else {
          delayMs = Math.min(delayMs, maxDelayMs);
        }

        logger.warn(
          {
            status: response.status,
            attempt: startingAttempt + 1,
            maxRetries,
            delayMs,
            retryAfter: retryAfterHeader ?? undefined,
            url: request.url,
          },
          `${tag} Rate limit encountered, retrying request after ${delayMs}ms (attempt ${
            startingAttempt + 1
          }/${maxRetries})`,
        );

        const canRetry = await sleepWithAbort(delayMs, request.signal);
        if (!canRetry) {
          return response;
        }

        reqWithAttempt._rateLimitAttempt = startingAttempt + 1;

        let retryRequest = request;
        try {
          retryRequest = request.clone();
        } catch {
          logger.debug({url: request.url}, `${tag} Could not clone request for retry; retrying with original request`);
        }

        return fetchFn(retryRequest);
      }

      // Fallback path: if ctx.fetch is not provided, handle retries in this invocation.
      let lastResponse = response;
      let attempt = startingAttempt;

      while (statusCodes.includes(lastResponse.status) && attempt < maxRetries) {
        const retryAfterHeader = lastResponse.headers.get('Retry-After');
        let delayMs = parseRetryAfter(retryAfterHeader);

        if (delayMs === undefined) {
          delayMs = computeBackoffDelayMs(attempt, baseDelayMs, maxDelayMs);
        } else {
          delayMs = Math.min(delayMs, maxDelayMs);
        }

        logger.warn(
          {
            status: lastResponse.status,
            attempt: attempt + 1,
            maxRetries,
            delayMs,
            retryAfter: retryAfterHeader ?? undefined,
            url: request.url,
          },
          `${tag} Rate limit encountered, retrying request after ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`,
        );

        const canRetry = await sleepWithAbort(delayMs, request.signal);
        if (!canRetry) {
          return lastResponse;
        }

        attempt += 1;
        reqWithAttempt._rateLimitAttempt = attempt;

        let retryRequest = request;
        try {
          retryRequest = request.clone();
        } catch {
          logger.debug({url: request.url}, `${tag} Could not clone request for retry; retrying with original request`);
        }

        lastResponse = await fetchFn(retryRequest);
      }

      if (statusCodes.includes(lastResponse.status) && attempt >= maxRetries) {
        logger.debug(
          {status: lastResponse.status, attempt, maxRetries},
          `${tag} Max retries reached, not retrying request`,
        );
      }

      return lastResponse;
    },
  };
}

/**
 * Configuration for logging middleware.
 */
export interface LoggingMiddlewareConfig {
  /**
   * Prefix for log messages (e.g., 'OCAPI', 'SLAS', 'MRT').
   */
  prefix?: string;

  /**
   * Body keys to mask in logs (replaced with '...' placeholder).
   * Useful for large payloads like base64-encoded file data.
   * @example ['data', 'password', 'secret']
   */
  maskBodyKeys?: string[];
}

/**
 * Masks specified keys in an object for logging.
 * Only masks top-level keys, replaces values with '...' placeholder.
 */
function maskBody(body: unknown, keysToMask?: string[]): unknown {
  if (!keysToMask || keysToMask.length === 0 || typeof body !== 'object' || body === null) {
    return body;
  }

  const masked = {...(body as Record<string, unknown>)};
  for (const key of keysToMask) {
    if (key in masked) {
      masked[key] = '...';
    }
  }
  return masked;
}

/**
 * Creates logging middleware for openapi-fetch clients.
 *
 * Logs request/response details at debug and trace levels.
 *
 * @param config - Logging configuration or prefix string for backwards compatibility
 * @returns Middleware that logs requests and responses
 *
 * @example
 * // Simple usage with just a prefix
 * client.use(createLoggingMiddleware('OCAPI'));
 *
 * @example
 * // With body masking for large payloads
 * client.use(createLoggingMiddleware({
 *   prefix: 'MRT',
 *   maskBodyKeys: ['data']  // Masks base64-encoded bundle data
 * }));
 */
export function createLoggingMiddleware(config?: string | LoggingMiddlewareConfig): Middleware {
  // Support both string (prefix) and config object for backwards compatibility
  const {prefix, maskBodyKeys} =
    typeof config === 'string' ? {prefix: config, maskBodyKeys: undefined} : (config ?? {});

  const reqTag = prefix ? `[${prefix} REQ]` : '';
  const respTag = prefix ? `[${prefix} RESP]` : '';

  return {
    async onRequest({request}) {
      const logger = getLogger();
      const url = request.url;

      logger.debug({method: request.method, url}, `${reqTag} ${request.method} ${url}`);

      // Read body from the request (already serialized by openapi-fetch)
      let body: unknown;
      if (request.body) {
        const clonedRequest = request.clone();
        const text = await clonedRequest.text();
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      // Mask sensitive/large body keys before logging
      const maskedBody = maskBody(body, maskBodyKeys);
      logger.trace(
        {method: request.method, url, headers: headersToObject(request.headers), body: maskedBody},
        `${reqTag} ${request.method} ${url} body`,
      );

      (request as Request & {_startTime?: number})._startTime = Date.now();

      return request;
    },

    async onResponse({request, response}) {
      const logger = getLogger();
      const startTime = (request as Request & {_startTime?: number})._startTime ?? Date.now();
      const duration = Date.now() - startTime;
      const url = request.url;

      logger.debug(
        {method: request.method, url, status: response.status, duration},
        `${respTag} ${request.method} ${url} ${response.status} ${duration}ms`,
      );

      const clonedResponse = response.clone();
      let responseBody: unknown;
      // Read as text first, then try to parse as JSON.
      // This avoids a bug where json() consumes the body stream even when parsing fails,
      // making subsequent text() calls fail with "Body has already been read".
      const text = await clonedResponse.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }

      // Mask sensitive/large body keys before logging
      const maskedResponseBody = maskBody(responseBody, maskBodyKeys);
      logger.trace(
        {method: request.method, url, headers: headersToObject(response.headers), body: maskedResponseBody},
        `${respTag} ${request.method} ${url} body`,
      );

      return response;
    },
  };
}

/**
 * Creates middleware that adds extra query parameters and/or body fields to requests.
 *
 * This is useful for internal/power-user scenarios where you need to pass
 * parameters that aren't in the typed OpenAPI schema.
 *
 * @param config - Configuration with extra query and/or body params
 * @returns Middleware that adds extra params to requests
 *
 * @example
 * ```typescript
 * const client = createOdsClient(config, auth);
 * client.use(createExtraParamsMiddleware({
 *   query: { debug: 'true', internal_flag: '1' },
 *   body: { _internal: { trace: true } }
 * }));
 * ```
 */
/**
 * Configuration for User-Agent middleware.
 */
export interface UserAgentConfig {
  /**
   * The User-Agent string to set on requests.
   */
  userAgent: string;
}

/**
 * Creates middleware that sets the User-Agent header on requests.
 *
 * Sets both the standard `User-Agent` header and a custom `sfdc_user_agent` header
 * with the same value.
 *
 * @param config - Configuration with the User-Agent string
 * @returns Middleware that sets the User-Agent headers
 *
 * @example
 * ```typescript
 * const client = createOcapiClient(config, auth);
 * client.use(createUserAgentMiddleware({ userAgent: 'b2c-cli/0.1.0' }));
 * ```
 */
export function createUserAgentMiddleware(config: UserAgentConfig): Middleware {
  return {
    async onRequest({request}) {
      request.headers.set('User-Agent', config.userAgent);
      request.headers.set('sfdc_user_agent', config.userAgent);
      return request;
    },
  };
}

export function createExtraParamsMiddleware(config: ExtraParamsConfig): Middleware {
  const logger = getLogger();

  return {
    async onRequest({request}) {
      let modifiedRequest = request;

      // HTTP methods that don't allow a request body
      const methodsWithoutBody = ['GET', 'HEAD'];
      const canHaveBody = !methodsWithoutBody.includes(modifiedRequest.method.toUpperCase());

      // Add extra headers first (before other modifications)
      if (config.headers && Object.keys(config.headers).length > 0) {
        const newHeaders = new Headers(modifiedRequest.headers);
        for (const [key, value] of Object.entries(config.headers)) {
          newHeaders.set(key, value);
        }
        logger.trace({extraHeaders: config.headers}, '[ExtraParams] Adding extra headers to request');
        modifiedRequest = new Request(modifiedRequest.url, {
          method: modifiedRequest.method,
          headers: newHeaders,
          ...(canHaveBody && modifiedRequest.body ? {body: modifiedRequest.body, duplex: 'half'} : {}),
        } as RequestInit);
      }

      // Add extra query parameters
      if (config.query && Object.keys(config.query).length > 0) {
        const url = new URL(modifiedRequest.url);
        for (const [key, value] of Object.entries(config.query)) {
          if (value !== undefined) {
            url.searchParams.set(key, String(value));
          }
        }
        logger.trace(
          {extraQuery: config.query, originalUrl: modifiedRequest.url, newUrl: url.toString()},
          '[ExtraParams] Adding extra query params to URL',
        );
        modifiedRequest = new Request(url.toString(), {
          method: modifiedRequest.method,
          headers: modifiedRequest.headers,
          ...(canHaveBody && modifiedRequest.body ? {body: modifiedRequest.body, duplex: 'half'} : {}),
        } as RequestInit);
      }

      // Merge extra body fields for JSON requests
      if (config.body && Object.keys(config.body).length > 0) {
        const contentType = modifiedRequest.headers.get('content-type');
        if (contentType?.includes('application/json') && modifiedRequest.body) {
          const clonedRequest = modifiedRequest.clone();
          const originalBody = await clonedRequest.text();
          try {
            const parsedBody = JSON.parse(originalBody) as Record<string, unknown>;
            const mergedBody = {...parsedBody, ...config.body};
            logger.trace(
              {originalBody: parsedBody, extraBody: config.body, mergedBody},
              '[ExtraParams] Merging extra body fields into request',
            );
            modifiedRequest = new Request(modifiedRequest.url, {
              method: modifiedRequest.method,
              headers: modifiedRequest.headers,
              body: JSON.stringify(mergedBody),
            });
          } catch {
            logger.warn('[ExtraParams] Could not parse request body as JSON, skipping body merge');
          }
        } else if (!modifiedRequest.body && canHaveBody) {
          // No existing body, create one with extra fields (only for methods that allow a body)
          logger.trace({body: config.body}, '[ExtraParams] Creating new body with extra fields');
          const headers = new Headers(modifiedRequest.headers);
          headers.set('content-type', 'application/json');
          modifiedRequest = new Request(modifiedRequest.url, {
            method: modifiedRequest.method,
            headers,
            body: JSON.stringify(config.body),
          });
        }
      }

      return modifiedRequest;
    },
  };
}
