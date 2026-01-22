/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
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
 * Provides tenant-id flag and lazy-loaded CDN Zones client.
 */
export abstract class EcdnCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'tenant-id': Flags.string({
      description: t('flags.tenantId.description', 'Organization/tenant ID'),
      env: 'SFCC_TENANT_ID',
      required: true,
    }),
  };

  private _cdnZonesClient?: CdnZonesClient;
  private _cdnZonesRwClient?: CdnZonesClient;

  /**
   * Get the CDN Zones client (read-only).
   */
  protected getCdnZonesClient(): CdnZonesClient {
    if (!this._cdnZonesClient) {
      const {shortCode} = this.resolvedConfig.values;
      const tenantId = (this.flags as Record<string, string>)['tenant-id'];

      if (!shortCode) {
        this.error(
          t(
            'error.shortCodeRequired',
            'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
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
      const {shortCode} = this.resolvedConfig.values;
      const tenantId = (this.flags as Record<string, string>)['tenant-id'];

      if (!shortCode) {
        this.error(
          t(
            'error.shortCodeRequired',
            'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
          ),
        );
      }

      const oauthStrategy = this.getOAuthStrategy();
      this._cdnZonesRwClient = createCdnZonesClient({shortCode, tenantId}, oauthStrategy, {readWrite: true});
    }
    return this._cdnZonesRwClient;
  }

  /**
   * Get the organization ID from the tenant-id flag.
   */
  protected getOrganizationId(): string {
    const tenantId = (this.flags as Record<string, string>)['tenant-id'];
    return toOrganizationId(tenantId);
  }
}
