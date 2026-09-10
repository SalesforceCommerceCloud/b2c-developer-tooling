/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {BaseCommand} from './base-command.js';
import {loadConfig, extractMrtFlags} from './config.js';
import type {LoadConfigOptions} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import type {AuthStrategy} from '../auth/types.js';
import {t} from '../i18n/index.js';
import {DEFAULT_MRT_ORIGIN, MrtMaintenanceError, runWithMrtReadOnlyListener} from '../clients/mrt.js';

/** Trust status page, surfaced so users can check status and ETA. */
const MRT_STATUS_URL = 'https://status.salesforce.com/instances/MANAGEDRUNTIMEADMIN';

/**
 * Base command for Managed Runtime (MRT) operations.
 * Uses API key authentication.
 *
 * API key resolution order:
 * 1. --api-key flag
 * 2. MRT_API_KEY environment variable (SFCC_MRT_API_KEY also supported)
 * 3. ~/.mobify config file (api_key field), or ~/.mobify--[hostname] if --cloud-origin is set
 *
 * Project/environment resolution order:
 * 1. --project (alias: --storefront) / --environment flags
 * 2. MRT_PROJECT / MRT_ENVIRONMENT environment variables (SFCC_-prefixed, MRT_STOREFRONT / SFCC_MRT_STOREFRONT, and MRT_TARGET also supported)
 * 3. dw.json (mrtProject / mrtEnvironment fields)
 *
 * Cloud origin resolution:
 * 1. --cloud-origin flag
 * 2. MRT_CLOUD_ORIGIN environment variable (SFCC_MRT_CLOUD_ORIGIN also supported)
 * 3. dw.json (mrtOrigin field)
 * 4. Default: https://cloud.mobify.com
 */
export abstract class MrtCommand<T extends typeof Command> extends BaseCommand<T> {
  static baseFlags = {
    ...BaseCommand.baseFlags,
    'api-key': Flags.string({
      description: 'MRT API key',
      env: 'MRT_API_KEY',
      default: async () => process.env.SFCC_MRT_API_KEY || undefined,
      helpGroup: 'AUTH',
    }),
    project: Flags.string({
      char: 'p',
      aliases: ['storefront'],
      description: 'MRT storefront/project slug (alias: --storefront; or set mrtProject in dw.json)',
      env: 'MRT_PROJECT',
      default: async () =>
        process.env.SFCC_MRT_PROJECT || process.env.MRT_STOREFRONT || process.env.SFCC_MRT_STOREFRONT || undefined,
    }),
    environment: Flags.string({
      char: 'e',
      aliases: ['target'],
      description: 'MRT environment (e.g., staging, production; or set mrtEnvironment in dw.json)',
      env: 'MRT_ENVIRONMENT',
      default: async () => process.env.SFCC_MRT_ENVIRONMENT || process.env.MRT_TARGET || undefined,
    }),
    'cloud-origin': Flags.string({
      char: 'o',
      description: `MRT cloud origin URL (or set mrtOrigin in dw.json; default: ${DEFAULT_MRT_ORIGIN})`,
      env: 'MRT_CLOUD_ORIGIN',
      default: async () => process.env.SFCC_MRT_CLOUD_ORIGIN || undefined,
    }),
    'credentials-file': Flags.string({
      char: 'c',
      description: 'Path to MRT credentials file (overrides default ~/.mobify)',
      env: 'MRT_CREDENTIALS_FILE',
    }),
  };

  /** Ensures the read-only warning prints at most once per command run. */
  private mrtReadOnlyWarned = false;

  /** Warn once if any read is served while Managed Runtime is in read-only mode. */
  public async _run<R>(): Promise<R> {
    return runWithMrtReadOnlyListener(
      () => this.warnReadOnlyOnce(),
      () => super._run<R>(),
    );
  }

  protected override async loadConfiguration(): Promise<ResolvedB2CConfig> {
    const mrt = extractMrtFlags(this.flags as Record<string, unknown>);
    const options: LoadConfigOptions = {
      ...this.getBaseConfigOptions(),
      ...mrt.options,
    };

    return loadConfig(mrt.config, options);
  }

  /**
   * Gets an API key auth strategy for MRT.
   */
  protected getMrtAuth(): AuthStrategy {
    if (this.resolvedConfig.hasMrtConfig()) {
      return this.resolvedConfig.createMrtAuth();
    }

    throw new Error(
      t('error.mrtApiKeyRequired', 'MRT API key required. Provide --api-key, set MRT_API_KEY, or configure ~/.mobify'),
    );
  }

  /**
   * Check if MRT credentials are available.
   */
  protected hasMrtCredentials(): boolean {
    return this.resolvedConfig.hasMrtConfig();
  }

  /**
   * Validates that MRT credentials are configured, errors if not.
   * @throws {Error} If MRT API key is not configured
   */
  protected requireMrtCredentials(): void {
    if (!this.hasMrtCredentials()) {
      this.error(
        t(
          'error.mrtApiKeyRequired',
          'MRT API key required. Provide --api-key, set MRT_API_KEY, or configure ~/.mobify',
        ),
      );
    }
  }

  /** Warn once (to stderr) that reads are served from a read-only Managed Runtime. */
  protected warnReadOnlyOnce(): void {
    if (this.mrtReadOnlyWarned) {
      return;
    }
    this.mrtReadOnlyWarned = true;
    this.warn(
      t(
        'warning.mrtReadOnly',
        'Managed Runtime is in maintenance mode. Reads still work, but write operations are temporarily disabled.\n\nCheck status and ETA: {{statusUrl}}',
        {statusUrl: MRT_STATUS_URL},
      ),
    );
  }

  /** Replace a read-only write rejection with actionable guidance; other errors pass through. */
  protected async catch(err: Error & {exitCode?: number}): Promise<never> {
    if (err instanceof MrtMaintenanceError) {
      // Keep the raw detail off the user-facing message.
      if (!err.cause && err.detail) {
        err.cause = err.detail;
      }
      // e.g. "mrt bundle deploy"
      const commandRef = this.id ? this.id.split(':').join(' ') : 'This mrt command';
      err.message = t(
        'error.mrtReadOnly',
        'Managed Runtime is in maintenance mode. This command was not run.\n\n{{command}} requires write access, which is temporarily disabled. Read commands (list, get) still work.\n\nCheck status and ETA: {{statusUrl}}',
        {command: commandRef, statusUrl: MRT_STATUS_URL},
      );
    }

    return super.catch(err);
  }
}
