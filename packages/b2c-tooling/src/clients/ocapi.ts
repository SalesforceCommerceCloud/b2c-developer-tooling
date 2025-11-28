/**
 * OCAPI client for B2C Commerce Data API operations.
 *
 * Provides a fully typed client for OCAPI Data API operations using
 * openapi-fetch, with proper error handling and authentication.
 *
 * @module clients/ocapi
 */
import createClient, {type Client} from 'openapi-fetch';
import type {AuthStrategy} from '../auth/types.js';
import type {paths, components} from './ocapi.generated.js';

const DEFAULT_API_VERSION = 'v25_6';

/**
 * Re-export generated types for external use.
 */
export type {paths, components};

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
 * OCAPI client for B2C Commerce Data API.
 *
 * Provides a fully typed client based on the OpenAPI specification.
 * All operations are type-safe with request/response validation.
 *
 * @example
 * const client = new OcapiClient('sandbox.demandware.net', authStrategy);
 *
 * // Typed GET request
 * const { data, error } = await client.GET('/sites', {});
 *
 * // Typed POST request with body
 * const { data, error } = await client.POST('/jobs/{job_id}/executions', {
 *   params: { path: { job_id: 'my-job' } },
 *   body: {},
 * });
 */
export class OcapiClient {
  private client: Client<paths>;

  /**
   * Creates a new OCAPI client.
   *
   * @param hostname - B2C instance hostname
   * @param auth - OAuth authentication strategy
   * @param apiVersion - API version (defaults to v24_5)
   */
  constructor(
    hostname: string,
    private auth: AuthStrategy,
    apiVersion: string = DEFAULT_API_VERSION,
  ) {
    const baseUrl = `https://${hostname}/s/-/dw/data/${apiVersion}`;

    // Create the openapi-fetch client with custom fetch that handles auth
    this.client = createClient<paths>({
      baseUrl,
      fetch: this.authenticatedFetch.bind(this),
    });
  }

  /**
   * Custom fetch function that adds authentication headers.
   */
  private async authenticatedFetch(request: Request): Promise<Response> {
    return this.auth.fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: request.body ? 'half' : undefined,
    } as RequestInit);
  }

  /**
   * Performs a typed GET request.
   *
   * @example
   * const { data, error } = await client.GET('/sites', {});
   * const { data, error } = await client.GET('/sites/{site_id}', {
   *   params: { path: { site_id: 'RefArch' } }
   * });
   */
  get GET() {
    return this.client.GET.bind(this.client);
  }

  /**
   * Performs a typed POST request.
   *
   * @example
   * const { data, error } = await client.POST('/site_search', {
   *   body: { query: { text_query: { fields: ['id'], search_phrase: 'RefArch' } } }
   * });
   */
  get POST() {
    return this.client.POST.bind(this.client);
  }

  /**
   * Performs a typed PUT request.
   *
   * @example
   * const { data, error } = await client.PUT('/sites/{site_id}', {
   *   params: { path: { site_id: 'RefArch' } },
   *   body: { ... }
   * });
   */
  get PUT() {
    return this.client.PUT.bind(this.client);
  }

  /**
   * Performs a typed PATCH request.
   *
   * @example
   * const { data, error } = await client.PATCH('/code_versions/{code_version_id}', {
   *   params: { path: { code_version_id: 'v1' } },
   *   body: { active: true }
   * });
   */
  get PATCH() {
    return this.client.PATCH.bind(this.client);
  }

  /**
   * Performs a typed DELETE request.
   *
   * @example
   * const { data, error } = await client.DELETE('/code_versions/{code_version_id}', {
   *   params: { path: { code_version_id: 'old-version' } }
   * });
   */
  get DELETE() {
    return this.client.DELETE.bind(this.client);
  }

  /**
   * Gets the underlying openapi-fetch client for advanced use cases.
   */
  get raw(): Client<paths> {
    return this.client;
  }
}
