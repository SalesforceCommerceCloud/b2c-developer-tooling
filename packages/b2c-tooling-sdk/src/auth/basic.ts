/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy, FetchInit} from './types.js';
import {dispatchFetch} from './dispatch-fetch.js';
import {getLogger} from '../logging/logger.js';

/**
 * Basic authentication strategy for WebDAV operations.
 *
 * Encodes username and access key as Base64 for HTTP Basic auth.
 * Implements the {@link AuthStrategy} interface.
 *
 * @example
 * ```typescript
 * import { BasicAuthStrategy } from '@salesforce/b2c-tooling-sdk';
 *
 * const auth = new BasicAuthStrategy('username', 'access-key');
 * const response = await auth.fetch('https://webdav.example.com/path');
 * ```
 */
export class BasicAuthStrategy implements AuthStrategy {
  private encoded: string;

  /**
   * Creates a new BasicAuthStrategy instance for HTTP Basic authentication.
   *
   * @param user - The username for Basic authentication
   * @param pass - The password or access key for Basic authentication
   */
  constructor(user: string, pass: string) {
    this.encoded = Buffer.from(`${user}:${pass}`).toString('base64');

    const logger = getLogger();
    logger.debug({username: user}, `[Auth] Using Basic authentication for user: ${user}`);
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Basic ${this.encoded}`);
    // Pass through dispatcher for TLS/mTLS support (see dispatchFetch)
    return dispatchFetch(url, {...init, headers});
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Basic ${this.encoded}`;
  }
}
