/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {AuthStrategy} from '../auth/types.js';

export interface OdsConfig {
  region?: string;
}

/**
 * Client for ODS (Operational Data Store) operations.
 * Handles global platform operations.
 */
export class OdsClient {
  constructor(
    public readonly config: OdsConfig,
    public readonly auth: AuthStrategy,
  ) {}

  /**
   * Helper to make requests to the ODS API.
   */
  async request(path: string, init?: RequestInit): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // TODO: Update with actual ODS API base URL
    const url = `https://api.commercecloud.salesforce.com/ods/${cleanPath}`;
    return this.auth.fetch(url, init);
  }
}
