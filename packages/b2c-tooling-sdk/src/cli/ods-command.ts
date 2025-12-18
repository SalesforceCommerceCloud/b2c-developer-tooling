/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {createOdsClient, type OdsClient} from '../clients/ods.js';
import {DEFAULT_ODS_HOST} from '../defaults.js';

/**
 * Base command for ODS (On-Demand Sandbox) operations.
 * Use this for commands that interact with the Developer Sandbox API
 * (sandbox creation, deletion, start/stop, realm info, etc.)
 *
 * Environment variables:
 * - SFCC_SANDBOX_API_HOST: ODS API hostname
 * - Plus all from OAuthCommand (SFCC_CLIENT_ID, SFCC_CLIENT_SECRET)
 *
 * Provides:
 * - Host configuration flag with env var support
 * - Typed ODS API client via `this.odsClient`
 *
 * @example
 * export default class MySandboxCommand extends OdsCommand<typeof MySandboxCommand> {
 *   async run(): Promise<void> {
 *     const { data } = await this.odsClient.GET('/me', {});
 *     console.log('User:', data?.data?.user?.name);
 *   }
 * }
 */
export abstract class OdsCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    'sandbox-api-host': Flags.string({
      description: 'ODS API hostname',
      env: 'SFCC_SANDBOX_API_HOST',
      default: DEFAULT_ODS_HOST,
      // helpGroup: 'ODS',
    }),
  };

  private _odsClient?: OdsClient;

  /**
   * Gets the ODS API client for this command.
   *
   * The client is lazily created using the configured host and OAuth credentials.
   * It provides typed methods for all ODS API operations.
   *
   * @example
   * // Get user info
   * const { data } = await this.odsClient.GET('/me', {});
   *
   * // List sandboxes
   * const { data } = await this.odsClient.GET('/sandboxes', {});
   *
   * // Create a sandbox operation
   * const { data } = await this.odsClient.POST('/sandboxes/{sandboxId}/operations', {
   *   params: { path: { sandboxId: 'uuid' } },
   *   body: { operation: 'start' }
   * });
   */
  protected get odsClient(): OdsClient {
    if (!this._odsClient) {
      this.requireOAuthCredentials();
      const authStrategy = this.getOAuthStrategy();
      this._odsClient = createOdsClient(
        {
          host: this.odsHost,
          extraParams: this.getExtraParams(),
        },
        authStrategy,
      );
    }
    return this._odsClient;
  }

  /**
   * Gets the configured ODS API host.
   */
  protected get odsHost(): string {
    return this.flags['sandbox-api-host'] ?? DEFAULT_ODS_HOST;
  }
}
