/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {loadConfig, extractInstanceFlags} from './config.js';
import type {ResolvedB2CConfig} from '../config/index.js';
import type {B2CInstance} from '../instance/index.js';
import {t} from '../i18n/index.js';
import {
  B2CLifecycleRunner,
  createB2COperationContext,
  type B2COperationType,
  type B2COperationContext,
  type B2COperationResult,
  type BeforeB2COperationResult,
  type B2COperationLifecycleHookOptions,
  type B2COperationLifecycleHookResult,
} from './lifecycle.js';

/**
 * Base command for B2C instance operations.
 * Use this for commands that interact with a specific B2C instance
 * (sites, code upload, jobs, etc.)
 *
 * Environment variables:
 * - SFCC_SERVER: B2C instance hostname
 * - SFCC_WEBDAV_SERVER: Separate WebDAV hostname (optional)
 * - SFCC_CODE_VERSION: Code version
 * - SFCC_USERNAME: Username for Basic Auth
 * - SFCC_PASSWORD: Password/access key for Basic Auth
 * - Plus all from OAuthCommand (SFCC_CLIENT_ID, SFCC_CLIENT_SECRET)
 *
 * Provides:
 * - Server/hostname connection flags
 * - Both Basic auth and OAuth support
 * - Unified B2CInstance with typed API clients
 *
 * @example
 * export default class MySiteCommand extends InstanceCommand<typeof MySiteCommand> {
 *   async run(): Promise<void> {
 *     // Single instance for all operations
 *     const { data } = await this.instance.ocapi.GET('/sites', {});
 *     await this.instance.webdav.mkcol('Cartridges/v1');
 *   }
 * }
 */
export abstract class InstanceCommand<T extends typeof Command> extends OAuthCommand<T> {
  static baseFlags = {
    ...OAuthCommand.baseFlags,
    server: Flags.string({
      char: 's',
      description: 'B2C instance hostname',
      env: 'SFCC_SERVER',
      helpGroup: 'INSTANCE',
    }),
    'webdav-server': Flags.string({
      description: 'Separate hostname for WebDAV (cert. hostname, etc)',
      env: 'SFCC_WEBDAV_SERVER',
      helpGroup: 'INSTANCE',
    }),
    'code-version': Flags.string({
      char: 'v',
      description: 'Code version',
      env: 'SFCC_CODE_VERSION',
      helpGroup: 'INSTANCE',
    }),
    username: Flags.string({
      char: 'u',
      description: 'Username for Basic Auth (WebDAV)',
      env: 'SFCC_USERNAME',
      helpGroup: 'AUTH',
    }),
    password: Flags.string({
      char: 'p',
      description: 'Password/access key for Basic Auth (WebDAV)',
      env: 'SFCC_PASSWORD',
      helpGroup: 'AUTH',
    }),
    certificate: Flags.string({
      description: 'Path to PKCS12 certificate for two-factor auth',
      env: 'SFCC_CERTIFICATE',
      helpGroup: 'AUTH',
    }),
    passphrase: Flags.string({
      description: 'Passphrase for the certificate',
      env: 'SFCC_CERTIFICATE_PASSPHRASE',
      helpGroup: 'AUTH',
    }),
    selfsigned: Flags.boolean({
      description: 'Allow self-signed server certificates',
      env: 'SFCC_SELFSIGNED',
      helpGroup: 'AUTH',
      default: false,
    }),
    verify: Flags.boolean({
      description: 'Verify SSL certificates',
      default: true,
      allowNo: true,
      helpGroup: 'AUTH',
    }),
  };

  private _instance?: B2CInstance;

  /** Lifecycle runner for B2C operation hooks */
  protected lifecycleRunner?: B2CLifecycleRunner;

  /**
   * Override init to collect lifecycle providers from plugins.
   */
  public async init(): Promise<void> {
    await super.init();
    await this.collectLifecycleProviders();
  }

  /**
   * Collects lifecycle providers from plugins via the `b2c:operation-lifecycle` hook.
   */
  protected async collectLifecycleProviders(): Promise<void> {
    this.lifecycleRunner = new B2CLifecycleRunner(this.logger);

    const hookOptions: B2COperationLifecycleHookOptions = {
      flags: this.flags as Record<string, unknown>,
    };

    const hookResult = await this.config.runHook('b2c:operation-lifecycle', hookOptions);

    for (const success of hookResult.successes) {
      const result = success.result as B2COperationLifecycleHookResult | undefined;
      if (!result?.providers?.length) continue;
      this.lifecycleRunner.addProviders(result.providers);
    }

    for (const failure of hookResult.failures) {
      this.logger?.warn(`Plugin ${failure.plugin.name} b2c:operation-lifecycle hook failed: ${failure.error.message}`);
    }

    if (this.lifecycleRunner.size > 0) {
      this.logger?.debug(`Registered ${this.lifecycleRunner.size} lifecycle provider(s)`);
    }
  }

  /**
   * Creates a B2C operation context for lifecycle hooks.
   *
   * @param operationType - Type of B2C operation
   * @param metadata - Operation-specific metadata
   * @returns B2C operation context
   */
  protected createContext(operationType: B2COperationType, metadata: Record<string, unknown>): B2COperationContext {
    return createB2COperationContext(operationType, metadata, this.instance);
  }

  /**
   * Runs beforeOperation hooks for all providers.
   *
   * @param context - B2C operation context
   * @returns Result indicating if operation should be skipped
   */
  protected async runBeforeHooks(context: B2COperationContext): Promise<BeforeB2COperationResult> {
    if (!this.lifecycleRunner) {
      return {};
    }
    return this.lifecycleRunner.runBefore(context);
  }

  /**
   * Runs afterOperation hooks for all providers.
   *
   * @param context - B2C operation context
   * @param result - Operation result
   */
  protected async runAfterHooks(context: B2COperationContext, result: B2COperationResult): Promise<void> {
    if (!this.lifecycleRunner) {
      return;
    }
    await this.lifecycleRunner.runAfter(context, result);
  }

  protected override loadConfiguration(): ResolvedB2CConfig {
    return loadConfig(extractInstanceFlags(this.flags as Record<string, unknown>), this.getBaseConfigOptions());
  }

  /**
   * Gets the B2CInstance for this command.
   *
   * The instance is lazily created from the resolved configuration.
   * It provides typed API clients for WebDAV and OCAPI operations.
   *
   * @example
   * // WebDAV operations (uses Basic auth if available)
   * await this.instance.webdav.mkcol('Cartridges/v1');
   *
   * // OCAPI operations (uses OAuth)
   * const { data } = await this.instance.ocapi.GET('/sites', {});
   */
  protected get instance(): B2CInstance {
    if (!this._instance) {
      this.requireServer();
      this._instance = this.resolvedConfig.createB2CInstance();
    }
    return this._instance;
  }

  /**
   * Check if WebDAV credentials are available (Basic or OAuth including implicit).
   */
  protected hasWebDavCredentials(): boolean {
    // Basic auth, or OAuth (client-credentials needs secret, implicit only needs clientId)
    return this.resolvedConfig.hasBasicAuthConfig() || this.resolvedConfig.hasOAuthConfig();
  }

  /**
   * Validates that server is configured, errors if not.
   */
  protected requireServer(): void {
    if (!this.resolvedConfig.hasB2CInstanceConfig()) {
      this.error(t('error.serverRequired', 'Server is required. Set via --server, SFCC_SERVER env var, or dw.json.'));
    }
  }

  /**
   * Validates that code version is configured, errors if not.
   */
  protected requireCodeVersion(): void {
    if (!this.resolvedConfig.values.codeVersion) {
      this.error(
        t(
          'error.codeVersionRequired',
          'Code version is required. Set via --code-version, SFCC_CODE_VERSION env var, or dw.json.',
        ),
      );
    }
  }

  /**
   * Validates that WebDAV credentials are configured, errors if not.
   */
  protected requireWebDavCredentials(): void {
    if (!this.hasWebDavCredentials()) {
      this.error(
        t(
          'error.webdavCredentialsRequiredShort',
          'WebDAV credentials required. Provide --username/--password or --client-id/--client-secret, or set corresponding SFCC_* env vars.',
        ),
      );
    }
  }
}
