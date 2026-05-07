/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createGranularReplicationsClient, type GranularReplicationsClient} from '@salesforce/b2c-tooling-sdk';
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
   * - short code (--short-code, SFCC_SHORTCODE, or dw.json)
   * - OAuth credentials
   * - tenant ID (--tenant-id, SFCC_TENANT_ID, or dw.json)
   */
  protected get granularReplicationsClient(): GranularReplicationsClient {
    if (!this._granularReplicationsClient) {
      const shortCode = this.resolvedConfig.values.shortCode;
      const tenantId = this.requireTenantId();

      if (!shortCode) {
        this.error(
          t(
            'error.shortCodeRequired',
            'SCAPI short code required. Provide --short-code, set SFCC_SHORTCODE, or configure short-code in dw.json.',
          ),
        );
      }

      this._granularReplicationsClient = createGranularReplicationsClient(
        {shortCode, tenantId},
        this.getOAuthStrategy(),
      );
    }
    return this._granularReplicationsClient;
  }
}
