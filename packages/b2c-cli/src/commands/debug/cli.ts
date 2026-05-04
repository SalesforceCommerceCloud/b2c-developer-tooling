/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {Flags} from '@oclif/core';
import {InstanceCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import {
  DebugSessionManager,
  createSourceMapper,
  type DebugSessionCallbacks,
} from '@salesforce/b2c-tooling-sdk/operations/debug';
import {DebugRepl} from '../../utils/debug/repl.js';
import {DebugRpc} from '../../utils/debug/rpc.js';

export default class DebugCli extends InstanceCommand<typeof DebugCli> {
  static description =
    'Start an interactive CLI debug session for B2C Commerce script debugging. ' +
    'Use --rpc for JSONL-over-stdio RPC mode suitable for headless scripts and agents.';

  static examples = [
    '<%= config.bin %> debug cli',
    '<%= config.bin %> debug cli --cartridge-path ./cartridges',
    '<%= config.bin %> debug cli --client-id my-debugger',
    '<%= config.bin %> debug cli --rpc',
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
    rpc: Flags.boolean({
      description: 'Run in RPC mode: JSONL commands on stdin, JSONL responses on stdout',
      default: false,
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

    const sourceMapper = createSourceMapper(cartridges);

    const isRpc = this.flags.rpc;
    const holder: {handler?: DebugRepl | DebugRpc} = {};

    const callbacks: DebugSessionCallbacks = {
      onConnected: (host) => this.logger.debug(`Connected to script debugger on ${host}`),
      onDisconnected: () => this.logger.debug('Script debugger disconnected'),
      onDebuggerDisabled: () => this.logger.debug('Script debugger was disabled externally'),
      onThreadStopped(thread) {
        holder.handler?.onThreadStopped(thread);
      },
    };

    const manager = new DebugSessionManager(
      {
        hostname,
        username,
        password,
        clientId: this.flags['client-id'],
        cartridgeRoots: cartridges,
      },
      callbacks,
    );

    await manager.connect();

    if (isRpc) {
      const rpc = new DebugRpc({
        manager,
        sourceMapper,
        cartridges,
        output: process.stdout,
        input: process.stdin,
      });
      holder.handler = rpc;

      try {
        await rpc.run();
      } finally {
        await manager.disconnect();
      }
    } else {
      const repl = new DebugRepl({
        manager,
        sourceMapper,
        cartridges,
        output: process.stderr,
        input: process.stdin,
      });
      holder.handler = repl;

      try {
        await repl.run();
      } finally {
        await manager.disconnect();
      }
    }
  }
}
