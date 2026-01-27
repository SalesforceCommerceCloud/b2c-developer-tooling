/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {watchCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {t, withDocs} from '../../i18n/index.js';

export default class CodeWatch extends CartridgeCommand<typeof CodeWatch> {
  static args = {
    ...CartridgeCommand.baseArgs,
  };

  static description = withDocs(
    t('commands.code.watch.description', 'Watch cartridges and upload changes to an instance'),
    '/cli/code.html#b2c-code-watch',
  );

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./my-cartridges',
    '<%= config.bin %> <%= command.id %> --server my-sandbox.demandware.net --code-version v1',
    '<%= config.bin %> <%= command.id %> -c app_storefront_base',
    '<%= config.bin %> <%= command.id %> -x test_cartridge',
  ];

  static flags = {
    ...CartridgeCommand.baseFlags,
    ...CartridgeCommand.cartridgeFlags,
  };

  protected operations = {
    watchCartridges,
  };

  async run(): Promise<void> {
    this.requireWebDavCredentials();

    const hostname = this.resolvedConfig.values.hostname!;
    const version = this.resolvedConfig.values.codeVersion;

    // OAuth is only required if no code version specified (need to auto-discover via OCAPI)
    if (!version && !this.hasOAuthCredentials()) {
      this.error(
        t(
          'commands.code.watch.oauthRequired',
          'No code version specified. OAuth credentials are required to auto-discover the active code version.\n\nProvide --code-version to use basic auth only, or configure OAuth credentials.\nSee: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html',
        ),
      );
    }

    this.log(t('commands.code.watch.starting', 'Starting watcher for {{path}}', {path: this.cartridgePath}));
    this.log(t('commands.code.watch.target', 'Target: {{hostname}}', {hostname}));
    if (version) {
      this.log(t('commands.code.watch.codeVersion', 'Code Version: {{version}}', {version}));
    }

    try {
      const result = await this.operations.watchCartridges(this.instance, this.cartridgePath, {
        ...this.cartridgeOptions,
        onUpload: (files) => {
          this.log(t('commands.code.watch.uploaded', '[UPLOAD] {{count}} file(s)', {count: files.length}));
        },
        onDelete: (files) => {
          this.log(t('commands.code.watch.deleted', '[DELETE] {{count}} file(s)', {count: files.length}));
        },
        onError: (error) => {
          this.warn(t('commands.code.watch.error', 'Error: {{message}}', {message: error.message}));
        },
      });

      this.log(
        t('commands.code.watch.watching', 'Watching {{count}} cartridge(s)...', {count: result.cartridges.length}),
      );
      this.log(t('commands.code.watch.pressCtrlC', 'Press Ctrl+C to stop'));

      // Keep the process running until interrupted
      await new Promise<void>((resolve) => {
        const cleanup = () => {
          this.log(t('commands.code.watch.stopping', '\nStopping watcher...'));
          result.stop().then(() => {
            resolve();
          });
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
      });
    } catch (error) {
      if (error instanceof Error) {
        this.error(t('commands.code.watch.failed', 'Watch failed: {{message}}', {message: error.message}));
      }
      throw error;
    }
  }
}
