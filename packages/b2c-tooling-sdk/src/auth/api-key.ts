/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy, FetchInit} from './types.js';
import {dispatchFetch} from './dispatch-fetch.js';
import type {HttpTransportOptions} from '../clients/http-transport.js';
import {getLogger} from '../logging/logger.js';

/**
 * API Key authentication strategy.
 *
 * Supports two modes:
 * - Bearer token: When headerName is 'Authorization', formats as 'Bearer {key}'
 * - Direct key: For other headers (e.g., 'x-api-key'), sets the key directly
 *
 * @example
 * // For MRT API (Bearer token)
 * const auth = new ApiKeyStrategy(apiKey, 'Authorization');
 * // Sets: Authorization: Bearer {apiKey}
 *
 * @example
 * // For custom API key header
 * const auth = new ApiKeyStrategy(apiKey, 'x-api-key');
 * // Sets: x-api-key: {apiKey}
 */
export class ApiKeyStrategy implements AuthStrategy {
  private readonly headerValue: string;
  private readonly headerName: string;
  /** See {@link AuthStrategy.selfSignedApi}. @internal */
  readonly selfSignedApi?: boolean;

  /**
   * Creates a new ApiKeyStrategy instance for API key authentication.
   *
   * @param key - The API key value to use for authentication
   * @param headerName - The HTTP header name to populate with the API key. Defaults to 'x-api-key'. When set to 'Authorization', the key will be formatted as a Bearer token ('Bearer {key}'); for other header names, the key is set directly.
   * @param transport - Transport options for API clients built with this strategy.
   */
  constructor(key: string, headerName = 'x-api-key', transport?: HttpTransportOptions) {
    const logger = getLogger();
    this.headerName = headerName;
    this.selfSignedApi = transport?.selfSignedApi;

    // For Authorization header, use Bearer prefix (standard for MRT API)
    // For other headers (like x-api-key), use the key directly
    this.headerValue = headerName === 'Authorization' ? `Bearer ${key}` : key;

    logger.debug({headerName}, `[Auth] Using API Key authentication (${headerName})`);
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set(this.headerName, this.headerValue);
    // Pass through dispatcher for TLS/mTLS support (see dispatchFetch)
    return dispatchFetch(url, {...init, headers});
  }

  /**
   * Returns the authorization header value for use with openapi-fetch middleware.
   */
  async getAuthorizationHeader(): Promise<string> {
    return this.headerValue;
  }
}
