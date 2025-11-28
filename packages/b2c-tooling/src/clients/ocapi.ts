/**
 * OCAPI client for B2C Commerce Data API operations.
 *
 * Provides typed methods for common OCAPI Data API operations with
 * proper error handling and JSON parsing.
 *
 * @module clients/ocapi
 */
import type {AuthStrategy} from '../auth/types.js';

const DEFAULT_API_VERSION = 'v24_5';

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
 * OCAPI paginated response structure.
 */
export interface OcapiPagedResponse<T> {
  _v: string;
  count: number;
  total: number;
  start?: number;
  data: T[];
  next?: string;
  previous?: string;
}

/**
 * Request options for OCAPI calls.
 */
export interface OcapiRequestOptions {
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Request headers */
  headers?: Record<string, string>;
  /** API version override */
  apiVersion?: string;
}

/**
 * OCAPI client for B2C Commerce Data API.
 *
 * Provides typed HTTP methods for OCAPI Data API operations.
 * Always uses OAuth authentication.
 *
 * @example
 * const client = new OcapiClient('sandbox.demandware.net', authStrategy);
 *
 * // GET request
 * const sites = await client.get<SitesResponse>('sites');
 *
 * // POST request
 * await client.post('jobs/my-job/executions', { ... });
 *
 * // PATCH request
 * await client.patch('code_versions/v1', { active: true });
 */
export class OcapiClient {
  /**
   * Creates a new OCAPI client.
   *
   * @param hostname - B2C instance hostname
   * @param auth - OAuth authentication strategy
   * @param apiVersion - Default API version (defaults to v24_5)
   */
  constructor(
    private hostname: string,
    private auth: AuthStrategy,
    private apiVersion: string = DEFAULT_API_VERSION,
  ) {}

  /**
   * Builds the full URL for an OCAPI Data API path.
   */
  private buildUrl(path: string, options?: OcapiRequestOptions): string {
    const version = options?.apiVersion || this.apiVersion;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    let url = `https://${this.hostname}/s/-/dw/data/${version}/${cleanPath}`;

    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        searchParams.set(key, String(value));
      }
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * Makes a raw OCAPI request.
   *
   * @param path - API path relative to /s/-/dw/data/{version}/
   * @param init - Fetch init options
   * @param options - OCAPI-specific options
   * @returns Response from the server
   */
  async request(path: string, init?: RequestInit, options?: OcapiRequestOptions): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, value);
      }
    }

    return this.auth.fetch(this.buildUrl(path, options), {
      ...init,
      headers,
    });
  }

  /**
   * Handles response and throws on error.
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorBody = (await response.json()) as OcapiError;
        if (errorBody.fault) {
          errorMessage = `${errorBody.fault.type}: ${errorBody.fault.message}`;
        }
      } catch {
        // Response wasn't JSON, use status text
      }
      throw new Error(`OCAPI request failed: ${errorMessage}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Performs a GET request.
   *
   * @param path - API path
   * @param options - Request options
   * @returns Parsed JSON response
   *
   * @example
   * const sites = await client.get<SitesResponse>('sites');
   * const site = await client.get<Site>('sites/RefArch', { params: { select: '(**)' } });
   */
  async get<T>(path: string, options?: OcapiRequestOptions): Promise<T> {
    const response = await this.request(path, {method: 'GET'}, options);
    return this.handleResponse<T>(response);
  }

  /**
   * Performs a POST request.
   *
   * @param path - API path
   * @param body - Request body (will be JSON stringified)
   * @param options - Request options
   * @returns Parsed JSON response
   *
   * @example
   * const result = await client.post<JobExecution>('jobs/my-job/executions', {});
   */
  async post<T>(path: string, body?: unknown, options?: OcapiRequestOptions): Promise<T> {
    const response = await this.request(
      path,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      options,
    );
    return this.handleResponse<T>(response);
  }

  /**
   * Performs a PUT request.
   *
   * @param path - API path
   * @param body - Request body (will be JSON stringified)
   * @param options - Request options
   * @returns Parsed JSON response
   *
   * @example
   * await client.put('sites/RefArch', siteData);
   */
  async put<T>(path: string, body?: unknown, options?: OcapiRequestOptions): Promise<T> {
    const response = await this.request(
      path,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      options,
    );
    return this.handleResponse<T>(response);
  }

  /**
   * Performs a PATCH request.
   *
   * @param path - API path
   * @param body - Request body (will be JSON stringified)
   * @param options - Request options
   * @returns Parsed JSON response
   *
   * @example
   * await client.patch('code_versions/v1', { active: true });
   */
  async patch<T>(path: string, body?: unknown, options?: OcapiRequestOptions): Promise<T> {
    const response = await this.request(
      path,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      options,
    );
    return this.handleResponse<T>(response);
  }

  /**
   * Performs a DELETE request.
   *
   * @param path - API path
   * @param options - Request options
   *
   * @example
   * await client.delete('code_versions/old-version');
   */
  async delete(path: string, options?: OcapiRequestOptions): Promise<void> {
    const response = await this.request(path, {method: 'DELETE'}, options);
    await this.handleResponse<void>(response);
  }
}
