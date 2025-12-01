/**
 * OCAPI client for B2C Commerce Data API operations.
 *
 * Provides a fully typed client for OCAPI Data API operations using
 * openapi-fetch with authentication middleware.
 *
 * @module clients/ocapi
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './ocapi.generated.js';
import {createAuthMiddleware, createLoggingMiddleware} from './middleware.js';

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
    arguments?: Record<string, unknown>;
  };
}

/**
 * Type guard to check if an error is an OCAPI error response.
 */
export function isOcapiError(error: unknown): error is OcapiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'fault' in error &&
    typeof (error as OcapiError).fault === 'object' &&
    typeof (error as OcapiError).fault?.message === 'string'
  );
}

/**
 * Formats an OCAPI error for display.
 *
 * Extracts the error message from OCAPI error responses, falling back
 * to standard error handling for other error types.
 *
 * @param error - Error from OCAPI response
 * @returns Human-readable error message
 *
 * @example
 * ```typescript
 * const { error } = await client.DELETE('/code_versions/{id}', {...});
 * if (error) {
 *   throw new Error(formatOcapiError(error));
 * }
 * ```
 */
export function formatOcapiError(error: unknown): string {
  if (isOcapiError(error)) {
    return error.fault.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // Last resort - try JSON stringify for objects
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

// Re-export middleware for backwards compatibility
export {createAuthMiddleware, createLoggingMiddleware};

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

  client.use(createLoggingMiddleware('OCAPI'));
  client.use(createAuthMiddleware(auth));

  return client;
}
