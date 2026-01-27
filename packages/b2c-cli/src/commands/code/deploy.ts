/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {
  uploadCartridges,
  deleteCartridges,
  getActiveCodeVersion,
  reloadCodeVersion,
  type DeployResult,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

export default class CodeDeploy extends CartridgeCommand<typeof CodeDeploy> {
  static args = {
    ...CartridgeCommand.baseArgs,
  };

  static description = withDocs(
    t('commands.code.deploy.description', 'Deploy cartridges to a B2C Commerce instance'),
    '/cli/code.html#b2c-code-deploy',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./my-cartridges',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net --code-version v1',
    '<%= config.bin %> <%= command.id %> --reload',
    '<%= config.bin %> <%= command.id %> --delete --reload',
    '<%= config.bin %> <%= command.id %> -c app_storefront_base -c plugin_applepay',
    '<%= config.bin %> <%= command.id %> -x test_cartridge',
  ];

  static flags = {
    ...CartridgeCommand.baseFlags,
    ...CartridgeCommand.cartridgeFlags,
    reload: Flags.boolean({
      char: 'r',
      description: 'Reload (re-activate) code version after deploy',
      default: false,
    }),
    delete: Flags.boolean({
      description: 'Delete existing cartridges before upload',
      default: false,
    }),
  };

  protected operations = {
    uploadCartridges,
    deleteCartridges,
    getActiveCodeVersion,
    reloadCodeVersion,
  };

  async run(): Promise<DeployResult> {
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    let version = this.resolvedConfig.values.codeVersion;

    // OAuth is only required if:
    // 1. No code version specified (need to auto-discover via OCAPI)
    // 2. --reload flag is set (need to call OCAPI to reload)
    const needsOAuth = !version || this.flags.reload;
    if (needsOAuth && !this.hasOAuthCredentials()) {
      const reason = version
        ? t(
            'commands.code.deploy.oauthRequiredForReload',
            'The --reload flag requires OAuth credentials to reload the code version via OCAPI.',
          )
        : t(
            'commands.code.deploy.oauthRequiredForDiscovery',
            'No code version specified. OAuth credentials are required to auto-discover the active code version.',
          );
      this.error(
        t(
          'commands.code.deploy.oauthRequired',
          '{{reason}}\n\nProvide --code-version to use basic auth only, or configure OAuth credentials.\nSee: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html',
          {reason},
        ),
      );
    }

    // If no code version specified, discover the active one
    if (!version) {
      this.warn(
        t('commands.code.deploy.noCodeVersion', 'No code version specified, discovering active code version...'),
      );
      const activeVersion = await this.operations.getActiveCodeVersion(this.instance);
      if (!activeVersion?.id) {
        this.error(
          t('commands.code.deploy.noActiveVersion', 'No active code version found. Specify one with --code-version.'),
        );
      }
      version = activeVersion.id;
      // Update the instance config so findAndDeployCartridges uses it
      this.instance.config.codeVersion = version;
    }

    // Create lifecycle context
    const context = this.createContext('code:deploy', {
      cartridgePath: this.cartridgePath,
      hostname,
      codeVersion: version,
      reload: this.flags.reload,
      delete: this.flags.delete,
      ...this.cartridgeOptions,
    });

    // Run beforeOperation hooks - check for skip
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.code.deploy.skipped', 'Deployment skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      return {
        cartridges: [],
        codeVersion: version,
        reloaded: false,
      };
    }

    // Find cartridges using providers (supports custom discovery plugins)
    const cartridges = await this.findCartridgesWithProviders();

    if (cartridges.length === 0) {
      this.error(t('commands.code.deploy.noCartridges', 'No cartridges found in {{path}}', {path: this.cartridgePath}));
    }

    this.logger?.info(
      {path: this.cartridgePath, server: hostname, codeVersion: version},
      t('commands.code.deploy.deploying', 'Deploying {{path}} to {{hostname}} ({{version}})', {
        path: this.cartridgePath,
        hostname,
        version,
      }),
    );

    // Log found cartridges
    for (const c of cartridges) {
      this.logger?.debug({cartridgeName: c.name, path: c.src}, `  ${c.name}`);
    }

    try {
      // Optionally delete existing cartridges first
      if (this.flags.delete) {
        await this.operations.deleteCartridges(this.instance, cartridges);
      }

      // Upload cartridges
      await this.operations.uploadCartridges(this.instance, cartridges);

      // Optionally reload code version
      let reloaded = false;
      if (this.flags.reload) {
        try {
          await this.operations.reloadCodeVersion(this.instance, version);
          reloaded = true;
        } catch (error) {
          this.logger?.debug(`Could not reload code version: ${error instanceof Error ? error.message : error}`);
        }
      }

      const result: DeployResult = {
        cartridges,
        codeVersion: version,
        reloaded,
      };

      this.logger?.info(
        {codeVersion: result.codeVersion, cartridgeCount: result.cartridges.length},
        t('commands.code.deploy.summary', 'Deployed {{count}} cartridge(s) to {{codeVersion}}', {
          count: result.cartridges.length,
          codeVersion: result.codeVersion,
        }),
      );

      if (result.reloaded) {
        this.log(t('commands.code.deploy.reloaded', 'Code version reloaded'));
      }

      // Run afterOperation hooks with success
      await this.runAfterHooks(context, {
        success: true,
        duration: Date.now() - context.startTime,
        data: result,
      });

      return result;
    } catch (error) {
      // Run afterOperation hooks with failure
      await this.runAfterHooks(context, {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - context.startTime,
      });

      if (error instanceof Error) {
        this.error(t('commands.code.deploy.failed', 'Deployment failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
