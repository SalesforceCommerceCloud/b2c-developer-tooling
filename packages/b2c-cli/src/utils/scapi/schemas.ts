/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createScapiSchemasClient,
  getApiErrorMessage,
  toOrganizationId,
  type ScapiSchemasClient,
} from '@salesforce/b2c-tooling-sdk/clients';
import {t} from '../../i18n/index.js';

/**
 * Format API error for display.
 */
export function formatApiError(error: unknown, response: Response): string {
  return getApiErrorMessage(error, response);
}

/**
 * Base command for SCAPI Schemas operations.
 * Provides common flags and helper methods for interacting with the SCAPI Schemas API.
 */
export abstract class ScapiSchemasCommand<T extends typeof Command> extends OAuthCommand<T> {
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

  /**
   * Get the SCAPI Schemas client, ensuring short code and tenant ID are configured.
   */
  protected getSchemasClient(): ScapiSchemasClient {
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
    return createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
  }
}
