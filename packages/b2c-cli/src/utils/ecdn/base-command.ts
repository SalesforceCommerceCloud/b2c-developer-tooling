/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createCdnZonesClient, toOrganizationId, type CdnZonesClient} from '@salesforce/b2c-tooling-sdk/clients';
import {t} from '../../i18n/index.js';

/**
 * Format API error for display.
 */
export function formatApiError(error: unknown): string {
  return typeof error === 'object' ? JSON.stringify(error) : String(error);
}

/**
 * Base command for eCDN operations.
 * Provides lazy-loaded CDN Zones client.
 */
export abstract class EcdnCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _cdnZonesClient?: CdnZonesClient;
  private _cdnZonesRwClient?: CdnZonesClient;

  /**
   * Get the CDN Zones client (read-only).
   */
  protected getCdnZonesClient(): CdnZonesClient {
    if (!this._cdnZonesClient) {
      const {shortCode, tenantId} = this.resolvedConfig.values;

      if (!shortCode) {
        this.error(
          t(
            'error.shortCodeRequired',
            'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
          ),
        );
      }
      if (!tenantId) {
        this.error(
          t(
            'error.tenantIdRequired',
            'tenant-id is required. Provide via --tenant-id flag, SFCC_TENANT_ID env var, or tenant-id in dw.json.',
          ),
        );
      }

      const oauthStrategy = this.getOAuthStrategy();
      this._cdnZonesClient = createCdnZonesClient({shortCode, tenantId}, oauthStrategy);
    }
    return this._cdnZonesClient;
  }

  /**
   * Get the CDN Zones client (read-write).
   */
  protected getCdnZonesRwClient(): CdnZonesClient {
    if (!this._cdnZonesRwClient) {
      const {shortCode, tenantId} = this.resolvedConfig.values;

      if (!shortCode) {
        this.error(
          t(
            'error.shortCodeRequired',
            'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
          ),
        );
      }
      if (!tenantId) {
        this.error(
          t(
            'error.tenantIdRequired',
            'tenant-id is required. Provide via --tenant-id flag, SFCC_TENANT_ID env var, or tenant-id in dw.json.',
          ),
        );
      }

      const oauthStrategy = this.getOAuthStrategy();
      this._cdnZonesRwClient = createCdnZonesClient({shortCode, tenantId}, oauthStrategy, {readWrite: true});
    }
    return this._cdnZonesRwClient;
  }

  /**
   * Get the organization ID from resolved config.
   * @throws Error if tenant ID is not provided through any source
   */
  protected getOrganizationId(): string {
    const {tenantId} = this.resolvedConfig.values;
    if (!tenantId) {
      this.error(
        t(
          'error.tenantIdRequired',
          'tenant-id is required. Provide via --tenant-id flag, SFCC_TENANT_ID env var, or tenant-id in dw.json.',
        ),
      );
    }
    return toOrganizationId(tenantId);
  }
}
