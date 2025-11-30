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
 * Creates logging middleware for openapi-fetch clients.
 *
 * Logs request/response details at debug and trace levels.
 *
 * @param prefix - Optional prefix for log messages (e.g., 'OCAPI', 'SLAS')
 * @returns Middleware that logs requests and responses
 */
export function createLoggingMiddleware(prefix?: string): Middleware {
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
      logger.trace({headers: headersToObject(request.headers), body}, `${reqTag} ${request.method} ${url} body`);

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

      logger.trace(
        {headers: headersToObject(response.headers), body: responseBody},
        `${respTag} ${request.method} ${url} body`,
      );

      return response;
    },
  };
}
