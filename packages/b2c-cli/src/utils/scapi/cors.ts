/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createScapiCorsClient, toOrganizationId, type ScapiCorsClient} from '@salesforce/b2c-tooling-sdk/clients';
import {configureLogger, getLogger} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

export {getApiErrorMessage} from '@salesforce/b2c-tooling-sdk/clients';

/**
 * Base command for SCAPI CORS Preferences operations.
 * Provides common helpers for interacting with the CORS Preferences API.
 */
export abstract class ScapiCorsCommand<T extends typeof Command> extends OAuthCommand<T> {
  /**
   * Get the SCAPI CORS client, ensuring short code and tenant ID are configured.
   */
  protected getCorsClient(): ScapiCorsClient {
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
    return createScapiCorsClient({shortCode, tenantId}, oauthStrategy);
  }

  /**
   * Get the organization ID (with f_ecom_ prefix) from resolved config.
   * @throws Error if tenant ID is not configured
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
   * Each CORS command provides its own progress message shown before flag parsing.
   * This ensures the INFO log appears even when parse errors occur (e.g. missing flag values).
   */
  protected abstract getProgressMessage(): string;

  /**
   * Pre-configure the pino logger and emit the progress message before flag parsing starts.
   * This ensures both the INFO progress line and ERROR messages use the proper pino format
   * even for oclif parse errors (which fire before configureLogging() runs in super.init()).
   */
  override async init(): Promise<void> {
    // Route logs to stdout when SFCC_LOG_TO_STDOUT is set, matching base-command behaviour.
    const fd = process.env.SFCC_LOG_TO_STDOUT ? 1 : 2;
    configureLogger({level: 'info', fd});
    this.logger = getLogger();

    if (!this.jsonEnabled()) {
      this.log(this.getProgressMessage());
    }

    return super.init();
  }

  /**
   * Require site-id to be provided, with a helpful error message.
   * @throws Error if site-id is not provided
   */
  protected requireSiteId(): string {
    const siteId = (this.flags as Record<string, unknown>)['site-id'] as string | undefined;
    if (!siteId) {
      this.error(t('error.siteIdRequired', 'site-id is required. Provide via --site-id flag or SFCC_SITE_ID env var.'));
    }
    if (siteId.length > 32) {
      this.error(
        t('error.siteIdTooLong', 'site-id must be between 1 and 32 characters (got {{length}}).', {
          length: siteId.length,
        }),
      );
    }
    return siteId;
  }
}
