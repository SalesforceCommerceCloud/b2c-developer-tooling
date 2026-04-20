/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {
  downloadCartridges,
  getActiveCodeVersion,
  type DownloadResult,
} from '@salesforce/b2c-tooling-sdk/operations/code';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

export default class CodeDownload extends CartridgeCommand<typeof CodeDownload> {
  static hiddenAliases = ['code:download'];

  static args = {
    ...CartridgeCommand.baseArgs,
  };

  static description = withDocs(
    t('commands.code.download.description', 'Download cartridge code from a B2C Commerce instance'),
    '/cli/code.html#b2c-code-download',
  );

  static enableJsonFlag = true;

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -o ./downloaded',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net --code-version v1',
    '<%= config.bin %> <%= command.id %> --mirror',
    '<%= config.bin %> <%= command.id %> -c app_storefront_base -c plugin_applepay',
    '<%= config.bin %> <%= command.id %> -x test_cartridge',
  ];

  static flags = {
    ...CartridgeCommand.baseFlags,
    ...CartridgeCommand.cartridgeFlags,
    output: Flags.string({
      char: 'o',
      description: 'Output directory for downloaded cartridges',
      default: 'cartridges',
      exclusive: ['mirror'],
    }),
    mirror: Flags.boolean({
      char: 'm',
      description: 'Extract cartridges to their local project locations',
      default: false,
      exclusive: ['output'],
    }),
  };

  protected operations = {
    downloadCartridges,
    getActiveCodeVersion,
  };

  async run(): Promise<DownloadResult> {
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    let version = this.resolvedConfig.values.codeVersion;

    const needsOAuth = !version;
    if (needsOAuth && !this.hasOAuthCredentials()) {
      this.error(
        t(
          'commands.code.download.oauthRequired',
          'No code version specified. OAuth credentials are required to auto-discover the active code version.\n\nProvide --code-version to use basic auth only, or configure OAuth credentials.\nSee: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html',
        ),
      );
    }

    // If no code version specified, discover the active one
    if (!version) {
      this.warn(
        t('commands.code.download.noCodeVersion', 'No code version specified, discovering active code version...'),
      );
      const activeVersion = await this.operations.getActiveCodeVersion(this.instance);
      if (!activeVersion?.id) {
        this.error(
          t('commands.code.download.noActiveVersion', 'No active code version found. Specify one with --code-version.'),
        );
      }
      version = activeVersion.id;
      this.instance.config.codeVersion = version;
    }

    // Build mirror map if --mirror flag is set
    let mirror: Map<string, string> | undefined;
    if (this.flags.mirror) {
      const cartridges = await this.findCartridgesWithProviders();
      if (cartridges.length === 0) {
        this.error(
          t('commands.code.download.noLocalCartridges', 'No local cartridges found in {{path}} for mirror mode', {
            path: this.cartridgePath,
          }),
        );
      }
      mirror = new Map(cartridges.map((c) => [c.name, c.src]));
    }

    // Create lifecycle context
    const context = this.createContext('code:download', {
      cartridgePath: this.cartridgePath,
      hostname,
      codeVersion: version,
      mirror: this.flags.mirror,
      output: this.flags.output,
      ...this.cartridgeOptions,
    });

    // Run beforeOperation hooks
    const beforeResult = await this.runBeforeHooks(context);
    if (beforeResult.skip) {
      this.log(
        t('commands.code.download.skipped', 'Download skipped: {{reason}}', {
          reason: beforeResult.skipReason || 'skipped by plugin',
        }),
      );
      return {
        cartridges: [],
        codeVersion: version,
        outputDirectory: this.flags.output ?? 'cartridges',
      };
    }

    this.log(
      t('commands.code.download.downloading', 'Downloading code version "{{version}}" from {{hostname}}...', {
        version,
        hostname,
      }),
    );

    // Temporarily allow DELETE for zip cleanup
    const cleanupSafetyRule = this.safetyGuard.temporarilyAddRule({
      method: 'DELETE',
      path: '**/Cartridges/*.zip',
      action: 'allow',
    });

    try {
      const phaseLabels = {
        zipping: t('commands.code.download.zipping', 'Archiving code version'),
        downloading: t('commands.code.download.downloadingZip', 'Downloading cartridges'),
        cleanup: t('commands.code.download.cleanup', 'Cleaning up'),
        extracting: t('commands.code.download.extracting', 'Extracting cartridges'),
      };

      const result = await this.operations.downloadCartridges(this.instance, this.flags.output ?? 'cartridges', {
        include: this.cartridgeOptions.include,
        exclude: this.cartridgeOptions.exclude,
        mirror,
        onProgress: (info) => {
          if (this.jsonEnabled()) return;
          const label = phaseLabels[info.phase];
          if (info.elapsedSeconds === 0) {
            this.log(`  ${label}...`);
          } else {
            this.log(
              t('commands.code.download.elapsed', '  {{label}}... ({{elapsed}}s elapsed)', {
                label,
                elapsed: String(info.elapsedSeconds),
              }),
            );
          }
        },
      });

      this.log(
        t('commands.code.download.summary', 'Downloaded {{count}} cartridge(s) from version "{{codeVersion}}"', {
          count: result.cartridges.length,
          codeVersion: result.codeVersion,
        }),
      );

      for (const name of result.cartridges) {
        this.log(`  ${name}`);
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
        this.error(t('commands.code.download.failed', 'Download failed: {{message}}', {message: error.message}));
      }
      throw error;
    } finally {
      cleanupSafetyRule();
    }
  }
}
