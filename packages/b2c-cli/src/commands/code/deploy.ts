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
  activateCodeVersion,
  reloadCodeVersion,
  type DeployResult,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

export default class CodeDeploy extends CartridgeCommand<typeof CodeDeploy> {
  static hiddenAliases = ['code:deploy'];

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
    '<%= config.bin %> <%= command.id %> --activate',
    '<%= config.bin %> <%= command.id %> --delete --activate',
    '<%= config.bin %> <%= command.id %> --reload',
    '<%= config.bin %> <%= command.id %> -c app_storefront_base -c plugin_applepay',
    '<%= config.bin %> <%= command.id %> -x test_cartridge',
  ];

  static flags = {
    ...CartridgeCommand.baseFlags,
    ...CartridgeCommand.cartridgeFlags,
    activate: Flags.boolean({
      char: 'a',
      description: 'Activate code version after deploy',
      default: false,
      exclusive: ['reload'],
    }),
    reload: Flags.boolean({
      char: 'r',
      description: 'Reload (toggle activation to force reload) code version after deploy',
      default: false,
      exclusive: ['activate'],
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
    activateCodeVersion,
    reloadCodeVersion,
  };

  async run(): Promise<DeployResult> {
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    let version = this.resolvedConfig.values.codeVersion;

    // OAuth is required if:
    // 1. No code version specified (need to auto-discover via OCAPI)
    // 2. --activate or --reload flag is set (need to call OCAPI)
    const needsOAuth = !version || this.flags.activate || this.flags.reload;
    if (needsOAuth && !this.hasOAuthCredentials()) {
      const reason = version
        ? t(
            'commands.code.deploy.oauthRequiredForActivate',
            'The --activate/--reload flag requires OAuth credentials to manage the code version via OCAPI.',
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
      activate: this.flags.activate,
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
        activated: false,
        reloaded: false,
      };
    }

    // Find cartridges using providers (supports custom discovery plugins)
    const cartridges = await this.findCartridgesWithProviders();

    if (cartridges.length === 0) {
      this.error(t('commands.code.deploy.noCartridges', 'No cartridges found in {{path}}', {path: this.cartridgePath}));
    }

    this.log(
      t('commands.code.deploy.deploying', 'Deploying {{path}} to {{hostname}} ({{version}})...', {
        path: this.cartridgePath,
        hostname,
        version,
      }),
    );

    // Log found cartridges
    for (const c of cartridges) {
      this.log(`  ${c.name} (${c.src})`);
    }

    // After safety evaluation passes, temporarily allow WebDAV DELETE operations
    // that are part of the deploy flow (cleanup of temp zip, --delete cartridge removal).
    const cleanupSafetyRule = this.safetyGuard.temporarilyAddRule({
      method: 'DELETE',
      path: '**/Cartridges/**',
      action: 'allow',
    });

    try {
      // Optionally delete existing cartridges first
      if (this.flags.delete) {
        this.log(t('commands.code.deploy.deleting', 'Deleting existing cartridges...'));
        await this.operations.deleteCartridges(this.instance, cartridges);
      }

      // Upload cartridges
      await this.operations.uploadCartridges(this.instance, cartridges);

      // Optionally activate or reload code version
      let activated = false;
      let reloaded = false;
      try {
        if (this.flags.activate) {
          await this.operations.activateCodeVersion(this.instance, version);
          activated = true;
        } else if (this.flags.reload) {
          await this.operations.reloadCodeVersion(this.instance, version);
          activated = true;
          reloaded = true;
        }
      } catch (error) {
        const clientId = this.resolvedConfig.values.clientId ?? 'unknown';
        this.error(
          t(
            'commands.code.deploy.activateFailed',
            'Failed to activate code version "{{version}}": {{message}}\n\nEnsure your OCAPI client ({{clientId}}) is configured with Data API permissions.\nSee: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html#ocapi-configuration',
            {version, message: error instanceof Error ? error.message : String(error), clientId},
          ),
        );
      }

      const result: DeployResult = {
        cartridges,
        codeVersion: version,
        activated,
        reloaded,
      };

      this.log(
        t(
          'commands.code.deploy.summary',
          'Deployed {{count}} cartridge(s) to version "{{codeVersion}}" successfully!',
          {
            count: result.cartridges.length,
            codeVersion: result.codeVersion,
          },
        ),
      );

      if (result.activated) {
        this.log(
          result.reloaded
            ? t('commands.code.deploy.reloaded', 'Code version reloaded')
            : t('commands.code.deploy.activated', 'Code version activated'),
        );
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
    } finally {
      cleanupSafetyRule();
    }
  }
}
