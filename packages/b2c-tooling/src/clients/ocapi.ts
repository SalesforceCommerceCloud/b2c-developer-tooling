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
 * The typed OCAPI client - this is the openapi-fetch Client with full type safety.
 *
 * **Note:** This client is typically accessed via `B2CInstance.ocapi` rather
 * than created directly. The `B2CInstance` class handles authentication setup.
 *
 * @see {@link createOcapiClient} for direct instantiation
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
 * Converts Headers to a plain object for logging.
 */
function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function createLoggingMiddleware(): Middleware {
  return {
    async onRequest({request, options}) {
      const logger = getLogger();
      const url = request.url;

      // Debug: Log request start
      logger.debug({method: request.method, url}, `[OCAPI REQ] ${request.method} ${url}`);

      // Trace: Log request details (body is in options for openapi-fetch)
      const body = (options as {body?: unknown}).body;
      logger.trace({headers: headersToObject(request.headers), body}, `[OCAPI REQ BODY] ${request.method} ${url}`);

      // Store start time for duration calculation
      (request as Request & {_startTime?: number})._startTime = Date.now();

      return request;
    },

    async onResponse({request, response}) {
      const logger = getLogger();
      const startTime = (request as Request & {_startTime?: number})._startTime ?? Date.now();
      const duration = Date.now() - startTime;
      const url = request.url;

      // Debug: Log response summary
      logger.debug(
        {method: request.method, url, status: response.status, duration},
        `[OCAPI RESP] ${request.method} ${url} ${response.status} ${duration}ms`,
      );

      // Trace: Log response details
      const clonedResponse = response.clone();
      let responseBody: unknown;
      try {
        responseBody = await clonedResponse.json();
      } catch {
        responseBody = await clonedResponse.text();
      }

      logger.trace(
        {headers: headersToObject(response.headers), body: responseBody},
        `[OCAPI RESP BODY] ${request.method} ${url}`,
      );

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
 * **Note:** This client is typically accessed via `B2CInstance.ocapi` rather
 * than created directly. The `B2CInstance` class handles authentication setup.
 *
 * @param hostname - B2C instance hostname
 * @param auth - Authentication strategy (typically OAuth)
 * @param apiVersion - API version (defaults to v25_6)
 * @returns Typed openapi-fetch client
 *
 * @example
 * // Via B2CInstance (recommended)
 * const instance = B2CInstance.fromDwJson();
 * const { data, error } = await instance.ocapi.GET('/sites', {});
 *
 * @example
 * // Direct instantiation (advanced)
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
