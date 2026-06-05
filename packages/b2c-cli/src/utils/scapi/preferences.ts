/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command} from '@oclif/core';
import {OAuthCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {createPreferencesClient, type PreferencesClient} from '@salesforce/b2c-tooling-sdk';
import {t} from '../../i18n/index.js';

/**
 * Base command class for SCAPI Configuration Preferences API commands.
 *
 * Provides lazy-initialized read-only and read-write clients with proper
 * OAuth strategy and configuration.
 */
export abstract class PreferencesCommand<T extends typeof Command> extends OAuthCommand<T> {
  private _preferencesClient?: PreferencesClient;
  private _preferencesRwClient?: PreferencesClient;

  /** Returns a read-only Preferences API client. */
  protected get preferencesClient(): PreferencesClient {
    if (!this._preferencesClient) {
      this._preferencesClient = createPreferencesClient(this.preferencesClientConfig(), this.getOAuthStrategy());
    }
    return this._preferencesClient;
  }

  /** Returns a read-write Preferences API client. */
  protected get preferencesRwClient(): PreferencesClient {
    if (!this._preferencesRwClient) {
      this._preferencesRwClient = createPreferencesClient(this.preferencesClientConfig(), this.getOAuthStrategy(), {
        readWrite: true,
      });
    }
    return this._preferencesRwClient;
  }

  private preferencesClientConfig() {
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

    return {shortCode, tenantId};
  }
}
