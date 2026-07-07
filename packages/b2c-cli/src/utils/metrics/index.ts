/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createMetricsClient, type MetricsClient} from '@salesforce/b2c-tooling-sdk/clients';
import {t} from '../../i18n/index.js';

// Re-export formatApiError alias for consistency with scapi utils
export {getApiErrorMessage as formatApiError} from '@salesforce/b2c-tooling-sdk/clients';

/**
 * Base command for Metrics API operations.
 * Provides common flags and helper methods for interacting with the SCAPI Metrics API.
 *
 * ⚠️ **CLOSED BETA:** The Metrics API is a closed beta feature. It must be enabled for your
 * organization, and its behavior, output, and OAuth scopes may change without notice.
 */
export abstract class MetricsCommand<T extends typeof Command> extends OAuthCommand<T> {
  /**
   * Get the Metrics client, ensuring short code and tenant ID are configured.
   */
  protected getMetricsClient(): MetricsClient {
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
    return createMetricsClient({shortCode, tenantId}, oauthStrategy);
  }
}
