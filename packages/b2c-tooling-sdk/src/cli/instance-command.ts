/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {loadConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import {B2CInstance} from '../instance/index.js';
import type {AuthConfig} from '../auth/types.js';
import {t} from '../i18n/index.js';

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
  };

  private _instance?: B2CInstance;

  protected override loadConfiguration(): ResolvedConfig {
    const options: LoadConfigOptions = {
      instance: this.flags.instance,
      configPath: this.flags.config,
    };

    const flagConfig: Partial<ResolvedConfig> = {
      hostname: this.flags.server,
      webdavHostname: this.flags['webdav-server'],
      codeVersion: this.flags['code-version'],
      username: this.flags.username,
      password: this.flags.password,
      clientId: this.flags['client-id'],
      clientSecret: this.flags['client-secret'],
      authMethods: this.parseAuthMethods(),
    };

    const config = loadConfig(flagConfig, options);

    // Merge scopes from flags with config file scopes (flags take precedence if provided)
    if (this.flags.scope && this.flags.scope.length > 0) {
      config.scopes = this.flags.scope;
    }

    return config;
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

      const config = this.resolvedConfig;

      const authConfig: AuthConfig = {
        authMethods: config.authMethods,
      };

      if (config.username && config.password) {
        authConfig.basic = {
          username: config.username,
          password: config.password,
        };
      }

      // Only require clientId for OAuth - clientSecret is optional for implicit flow
      if (config.clientId) {
        authConfig.oauth = {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          scopes: config.scopes,
          accountManagerHost: this.accountManagerHost,
        };
      }

      this._instance = new B2CInstance(
        {
          hostname: config.hostname!,
          codeVersion: config.codeVersion,
          webdavHostname: config.webdavHostname,
        },
        authConfig,
      );
    }
    return this._instance;
  }

  /**
   * Check if WebDAV credentials are available (Basic or OAuth including implicit).
   */
  protected hasWebDavCredentials(): boolean {
    const config = this.resolvedConfig;
    // Basic auth, or OAuth (client-credentials needs secret, implicit only needs clientId)
    return Boolean((config.username && config.password) || config.clientId);
  }

  /**
   * Validates that server is configured, errors if not.
   */
  protected requireServer(): void {
    if (!this.resolvedConfig.hostname) {
      this.error(t('error.serverRequired', 'Server is required. Set via --server, SFCC_SERVER env var, or dw.json.'));
    }
  }

  /**
   * Validates that code version is configured, errors if not.
   */
  protected requireCodeVersion(): void {
    if (!this.resolvedConfig.codeVersion) {
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
