/**
 * OCAPI client for B2C Commerce Data API operations.
 *
 * Provides a fully typed client for OCAPI Data API operations using
 * openapi-fetch with authentication middleware.
 *
 * @module clients/ocapi
 */
import createClient, {type Client, type Middleware} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './ocapi.generated.js';
import {getLogger} from '../logging/logger.js';

const DEFAULT_API_VERSION = 'v25_6';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

/**
 * The typed OCAPI client - this is the actual openapi-fetch Client.
 */
export type OcapiClient = Client<paths>;

/**
 * Helper type to extract response data from an operation.
 */
export type OcapiResponse<T> = T extends {content: {'application/json': infer R}} ? R : never;

/**
 * Standard OCAPI error response structure.
 */
export interface OcapiError {
  _v: string;
  fault: {
    type: string;
    message: string;
  };
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
      // Get the authorization header from the auth strategy
      if (auth.getAuthorizationHeader) {
        const authHeader = await auth.getAuthorizationHeader();
        request.headers.set('Authorization', authHeader);
      }
      return request;
    },
  };
}

/**
 * Creates logging middleware for openapi-fetch.
 *
 * Logs HTTP requests at debug level (summary) and trace level (full details).
 *
 * @returns Middleware that logs requests and responses
 */
export function createLoggingMiddleware(): Middleware {
  return {
    async onRequest({request, options}) {
      const logger = getLogger();
      const url = new URL(request.url);
      const path = url.pathname;

      // Debug: Log request start
      logger.debug({method: request.method, path}, `[OCAPI REQ] ${request.method} ${path}`);

      // Trace: Log request body
      if (options.body) {
        logger.trace({body: options.body}, `[OCAPI REQ BODY] ${request.method} ${path}`);
      }

      // Store start time for duration calculation
      (request as Request & {_startTime?: number})._startTime = Date.now();

      return request;
    },

    async onResponse({request, response}) {
      const logger = getLogger();
      const startTime = (request as Request & {_startTime?: number})._startTime ?? Date.now();
      const duration = Date.now() - startTime;

      const url = new URL(request.url);
      const path = url.pathname;

      // Debug: Log response summary
      logger.debug(
        {method: request.method, path, status: response.status, duration},
        `[OCAPI RESP] ${request.method} ${path} ${response.status} ${duration}ms`,
      );

      // Trace: Log response body
      const clonedResponse = response.clone();
      let responseBody: unknown;
      try {
        responseBody = await clonedResponse.json();
      } catch {
        responseBody = await clonedResponse.text();
      }

      logger.trace({body: responseBody}, `[OCAPI RESP BODY] ${request.method} ${path}`);

      return response;
    },
  };
}

/**
 * Creates a typed OCAPI Data API client.
 *
 * Returns the openapi-fetch client directly, with authentication
 * handled via middleware. This gives full access to all openapi-fetch
 * features with type-safe paths, parameters, and responses.
 *
 * @param hostname - B2C instance hostname
 * @param auth - OAuth authentication strategy
 * @param apiVersion - API version (defaults to v25_6)
 * @returns Typed openapi-fetch client
 *
 * @example
 * const client = createOcapiClient('sandbox.demandware.net', authStrategy);
 *
 * // Fully typed GET request
 * const { data, error } = await client.GET('/sites', {
 *   params: { query: { select: '(**)' } }
 * });
 *
 * // Path parameters are type-checked
 * const { data, error } = await client.GET('/sites/{site_id}', {
 *   params: { path: { site_id: 'RefArch' } }
 * });
 *
 * // Request bodies are typed
 * const { data, error } = await client.PATCH('/code_versions/{code_version_id}', {
 *   params: { path: { code_version_id: 'v1' } },
 *   body: { active: true }
 * });
 */
export function createOcapiClient(
  hostname: string,
  auth: AuthStrategy,
  apiVersion: string = DEFAULT_API_VERSION,
): OcapiClient {
  const client = createClient<paths>({
    baseUrl: `https://${hostname}/s/-/dw/data/${apiVersion}`,
  });

  // Add logging middleware (runs first to capture timing)
  client.use(createLoggingMiddleware());

  // Add authentication middleware
  client.use(createAuthMiddleware(auth));

  return client;
}
