import type {AuthStrategy} from './types.js';
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

  constructor(key: string, headerName = 'x-api-key') {
    const logger = getLogger();
    this.headerName = headerName;

    // For Authorization header, use Bearer prefix (standard for MRT API)
    // For other headers (like x-api-key), use the key directly
    this.headerValue = headerName === 'Authorization' ? `Bearer ${key}` : key;

    // Show partial key for identification (first 8 chars)
    const keyPreview = key.length > 8 ? `${key.slice(0, 8)}...` : key;
    logger.debug({headerName}, `[Auth] Using API Key authentication (${headerName}): ${keyPreview}`);
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set(this.headerName, this.headerValue);
    return fetch(url, {...init, headers});
  }

  /**
   * Returns the authorization header value for use with openapi-fetch middleware.
   */
  async getAuthorizationHeader(): Promise<string> {
    return this.headerValue;
  }
}
