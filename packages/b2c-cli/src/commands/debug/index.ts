/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import {B2CScriptDebugAdapter, type DebugSessionCallbacks} from '@salesforce/b2c-tooling-sdk/operations/debug';

export default class Debug extends InstanceCommand<typeof Debug> {
  static description = 'Start a DAP debug adapter for B2C Commerce script debugging';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --cartridge-path ./cartridges',
    '<%= config.bin %> <%= command.id %> --client-id my-debugger',
  ];

  static flags = {
    ...InstanceCommand.baseFlags,
    'cartridge-path': Flags.string({
      description: 'Path to cartridges directory',
      default: '.',
    }),
    'client-id': Flags.string({
      description: 'Client ID for the debugger API',
      default: 'b2c-cli',
    }),
  };

  async run(): Promise<void> {
    this.requireServer();

    const hostname = this.resolvedConfig.values.hostname!;
    const username = this.resolvedConfig.values.username;
    const password = this.resolvedConfig.values.password;

    if (!username || !password) {
      this.error(
        'Basic auth credentials (username/password) are required for the script debugger. ' +
          'Set via --username/--password flags, SFCC_USERNAME/SFCC_PASSWORD env vars, or dw.json.',
      );
    }

    const cartridgePath = this.flags['cartridge-path'] ?? '.';
    const cartridges = findCartridges(cartridgePath);
    if (cartridges.length === 0) {
      this.warn(`No cartridges found in ${cartridgePath}`);
    }

    this.logger.info(
      `Mapped ${cartridges.length} cartridge(s): ${cartridges.map((c) => c.name).join(', ') || '(none)'}`,
    );

    const callbacks: DebugSessionCallbacks = {
      onConnected: (host) => this.logger.debug(`Connected to script debugger on ${host}`),
      onDisconnected: () => this.logger.debug('Script debugger disconnected'),
      onDebuggerDisabled: () => this.logger.debug('Script debugger was disabled externally'),
    };

    const adapter = new B2CScriptDebugAdapter(
      {
        hostname,
        username,
        password,
        clientId: this.flags['client-id'],
        cartridgeRoots: cartridges,
      },
      callbacks,
    );

    // Run the DAP adapter over stdio
    adapter.start(process.stdin, process.stdout);

    // Wait for the adapter to finish (stdin closes)
    await new Promise<void>((resolve) => {
      process.stdin.on('end', resolve);
      process.stdin.on('close', resolve);
    });
  }
}
