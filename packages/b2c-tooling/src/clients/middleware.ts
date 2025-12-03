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
        {headers: headersToObject(request.headers), body: maskedBody},
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
      try {
        responseBody = await clonedResponse.json();
      } catch {
        responseBody = await clonedResponse.text();
      }

      // Mask sensitive/large body keys before logging
      const maskedResponseBody = maskBody(responseBody, maskBodyKeys);
      logger.trace(
        {headers: headersToObject(response.headers), body: maskedResponseBody},
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
export function createExtraParamsMiddleware(config: ExtraParamsConfig): Middleware {
  const logger = getLogger();

  return {
    async onRequest({request}) {
      let modifiedRequest = request;

      // Add extra query parameters
      if (config.query && Object.keys(config.query).length > 0) {
        const url = new URL(request.url);
        for (const [key, value] of Object.entries(config.query)) {
          if (value !== undefined) {
            url.searchParams.set(key, String(value));
          }
        }
        logger.trace(
          {extraQuery: config.query, originalUrl: request.url, newUrl: url.toString()},
          '[ExtraParams] Adding extra query params to URL',
        );
        modifiedRequest = new Request(url.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
          duplex: request.body ? 'half' : undefined,
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
        } else if (!modifiedRequest.body) {
          // No existing body, create one with extra fields
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
