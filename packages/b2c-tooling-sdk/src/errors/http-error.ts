/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Custom error class for HTTP errors from API clients.
 *
 * Wraps the Response object directly for full access to response details.
 *
 * @example
 * try {
 *   await webdav.delete('some/path');
 * } catch (error) {
 *   if (error instanceof HTTPError && error.response.status === 404) {
 *     // Handle not found
 *   }
 *   throw error;
 * }
 *
 * @module errors/http-error
 */

/**
 * Error thrown when an HTTP request fails.
 *
 * Wraps the original Response for access to status, headers, and body.
 */
export class HTTPError extends Error {
  /**
   * The original Response object from the failed request.
   * Note: Body can only be read once via response.text(), response.json(), etc.
   */
  readonly response: Response;

  /**
   * HTTP method used for the request (GET, POST, PUT, DELETE, etc.).
   */
  readonly method: string;

  constructor(message: string, response: Response, method: string) {
    super(message);
    this.name = 'HTTPError';
    this.response = response;
    this.method = method;
  }
}
