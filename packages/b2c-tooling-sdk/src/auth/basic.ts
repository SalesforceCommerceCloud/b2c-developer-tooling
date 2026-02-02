/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy, FetchInit} from './types.js';
import {getLogger} from '../logging/logger.js';

export class BasicAuthStrategy implements AuthStrategy {
  private encoded: string;

  constructor(user: string, pass: string) {
    this.encoded = Buffer.from(`${user}:${pass}`).toString('base64');

    const logger = getLogger();
    logger.debug({username: user}, `[Auth] Using Basic authentication for user: ${user}`);
  }

  async fetch(url: string, init: FetchInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Basic ${this.encoded}`);
    // Pass through dispatcher for TLS/mTLS support
    // Node.js fetch accepts dispatcher as an undocumented option
    return fetch(url, {...init, headers} as RequestInit);
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Basic ${this.encoded}`;
  }
}
