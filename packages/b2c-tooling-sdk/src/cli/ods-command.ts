/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {loadConfig, extractOdsFlags} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import {createOdsClient, type OdsClient} from '../clients/ods.js';
import {DEFAULT_ODS_HOST} from '../defaults.js';
import {isUuid, parseFriendlySandboxId, SandboxNotFoundError} from '../operations/ods/sandbox-lookup.js';

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

  protected override loadConfiguration(): ResolvedB2CConfig {
    return loadConfig(
      extractOdsFlags(this.flags as Record<string, unknown>),
      this.getBaseConfigOptions(),
      this.getPluginSources(),
    );
  }

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
    return this.resolvedConfig.values.sandboxApiHost ?? DEFAULT_ODS_HOST;
  }

  /**
   * Resolves a sandbox identifier to a UUID.
   *
   * Supports both UUID format and friendly format (realm-instance, e.g., "abcd-123" or "abcd_123").
   * If given a UUID, returns it directly. If given a friendly format, queries the API to find
   * the matching sandbox and logs the resolution.
   *
   * @param identifier - Sandbox identifier (UUID or friendly format)
   * @returns The sandbox UUID
   * @throws Error if the sandbox cannot be found (friendly ID not resolved)
   *
   * @example
   * ```typescript
   * // In a command's run() method:
   * const sandboxId = await this.resolveSandboxId(this.args.sandboxId);
   * ```
   */
  protected async resolveSandboxId(identifier: string): Promise<string> {
    // If already a UUID, return directly
    if (isUuid(identifier)) {
      return identifier;
    }

    // Try to parse as friendly ID
    const parsed = parseFriendlySandboxId(identifier);
    if (!parsed) {
      // Not a UUID and not a friendly ID - pass through as-is
      // (let the API return an appropriate error)
      return identifier;
    }

    // Log that we're looking up the sandbox
    this.log(`Looking up sandbox ${identifier}...`);

    // Query sandboxes filtered by realm
    const {data, error} = await this.odsClient.GET('/sandboxes', {
      params: {
        query: {
          filter_params: `realm=${parsed.realm}`,
        },
      },
    });

    if (error || !data?.data) {
      this.error(new SandboxNotFoundError(identifier, parsed.realm, parsed.instance).message);
    }

    // Find sandbox with matching instance
    const sandbox = data.data.find((s) => s.instance?.toLowerCase() === parsed.instance);

    if (!sandbox?.id) {
      this.error(new SandboxNotFoundError(identifier, parsed.realm, parsed.instance).message);
    }

    this.log(`Resolved ${identifier} to sandbox ${sandbox.id}`);
    return sandbox.id;
  }
}
