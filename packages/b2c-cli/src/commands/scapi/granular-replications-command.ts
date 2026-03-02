/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {
  createGranularReplicationsClient,
  type GranularReplicationsClient,
  toOrganizationId,
} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

/**
 * Base command class for Granular Replications API commands.
 *
 * Provides lazy-initialized client with proper OAuth strategy and configuration.
 */
export abstract class GranularReplicationsCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _granularReplicationsClient?: GranularReplicationsClient;

  /**
   * Gets or creates a Granular Replications API client.
   *
   * Requires:
   * - shortCode configuration (via b2c config:set --short-code <code>)
   * - OAuth credentials
   * - organizationId (extracted from tenant-id)
   */
  protected get granularReplicationsClient(): GranularReplicationsClient {
    if (!this._granularReplicationsClient) {
      const shortCode = this.resolvedConfig.values.shortCode;
      const organizationId = this.getOrganizationId();

      if (!shortCode) {
        this.error('shortCode configuration is required. Run: b2c config:set --short-code <code>');
      }

      this._granularReplicationsClient = createGranularReplicationsClient(
        {shortCode, organizationId},
        this.getOAuthStrategy(),
      );
    }
    return this._granularReplicationsClient;
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
