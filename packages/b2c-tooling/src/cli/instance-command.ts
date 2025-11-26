import {Command, Flags} from '@oclif/core';
import {OAuthCommand} from './oauth-command.js';
import {loadConfig} from './config.js';
import type {ResolvedConfig, LoadConfigOptions} from './config.js';
import type {AuthStrategy} from '../auth/types.js';
import {BasicAuthStrategy} from '../auth/basic.js';
import {OAuthStrategy} from '../auth/oauth.js';
import {B2CInstance} from '../instance/index.js';
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
 * - Helper methods for creating B2CInstance
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
      description: 'Separate hostname for WebDAV (if different)',
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
    };

    return loadConfig(flagConfig, options);
  }

  /**
   * Gets an auth strategy for WebDAV operations.
   * Prefers Basic auth for performance, falls back to OAuth.
   */
  protected getWebDavAuth(): AuthStrategy {
    const config = this.resolvedConfig;

    // Prefer Basic auth for WebDAV
    if (config.username && config.password) {
      return new BasicAuthStrategy(config.username, config.password);
    }

    // Fall back to OAuth
    if (config.clientId && config.clientSecret) {
      return new OAuthStrategy({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: config.scopes,
      });
    }

    throw new Error(
      t(
        'error.webdavCredentialsRequired',
        'WebDAV credentials required. Provide --username/--password or --client-id/--client-secret, or set SFCC_USERNAME/SFCC_PASSWORD or SFCC_CLIENT_ID/SFCC_CLIENT_SECRET.',
      ),
    );
  }

  /**
   * Gets an auth strategy for OCAPI operations.
   * Always uses OAuth.
   */
  protected getApiAuth(): AuthStrategy {
    return this.getOAuthStrategy();
  }

  /**
   * Creates a B2CInstance configured for WebDAV operations.
   */
  protected createWebDavInstance(): B2CInstance {
    this.requireServer();

    return new B2CInstance(
      {
        hostname: this.resolvedConfig.hostname!,
        codeVersion: this.resolvedConfig.codeVersion,
        webdavHostname: this.resolvedConfig.webdavHostname,
      },
      this.getWebDavAuth(),
    );
  }

  /**
   * Creates a B2CInstance configured for OCAPI operations.
   */
  protected createApiInstance(): B2CInstance {
    this.requireServer();
    this.requireOAuthCredentials();

    return new B2CInstance(
      {
        hostname: this.resolvedConfig.hostname!,
        codeVersion: this.resolvedConfig.codeVersion,
      },
      this.getApiAuth(),
    );
  }

  /**
   * Check if WebDAV credentials are available.
   */
  protected hasWebDavCredentials(): boolean {
    const config = this.resolvedConfig;
    return Boolean((config.username && config.password) || (config.clientId && config.clientSecret));
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
