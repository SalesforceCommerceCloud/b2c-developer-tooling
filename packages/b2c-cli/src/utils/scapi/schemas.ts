/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createScapiSchemasClient, toOrganizationId, type ScapiSchemasClient} from '@salesforce/b2c-tooling-sdk/clients';
import {t} from '../../i18n/index.js';

/**
 * Format API error for display.
 */
export function formatApiError(error: unknown): string {
  return typeof error === 'object' ? JSON.stringify(error) : String(error);
}

/**
 * Base command for SCAPI Schemas operations.
 * Provides common flags and helper methods for interacting with the SCAPI Schemas API.
 */
export abstract class ScapiSchemasCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'tenant-id': Flags.string({
      description: t('flags.tenantId.description', 'Organization/tenant ID'),
      env: 'SFCC_TENANT_ID',
      required: true,
    }),
  };

  /**
   * Get the organization ID from the tenant-id flag.
   */
  protected getOrganizationId(): string {
    const tenantId = (this.flags as Record<string, string>)['tenant-id'];
    return toOrganizationId(tenantId);
  }

  /**
   * Get the SCAPI Schemas client, ensuring short code is configured.
   */
  protected getSchemasClient(): ScapiSchemasClient {
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
    return createScapiSchemasClient({shortCode, tenantId}, oauthStrategy);
  }
}
