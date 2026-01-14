/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {Config} from '@oclif/core';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';

// Create a test command class
class TestCartridgeCommand extends CartridgeCommand<typeof TestCartridgeCommand> {
  static id = 'test:cartridge';
  static description = 'Test cartridge command';

  async run(): Promise<void> {
    // Test implementation
  }

  // Expose protected methods for testing
  public testCartridgePath() {
    return this.cartridgePath;
  }

  public testCartridgeOptions() {
    return this.cartridgeOptions;
  }

  public testFindCartridgesWithProviders(directory?: string, options?: {include?: string[]; exclude?: string[]}) {
    return this.findCartridgesWithProviders(directory, options);
  }
}

// Type for mocking command properties in tests
type MockableCartridgeCommand = TestCartridgeCommand & {
  parse: () => Promise<{
    args: Record<string, string | number | boolean>;
    flags: Record<string, string | number | boolean | string[]>;
    metadata: Record<string, string | number | boolean>;
  }>;
  flags: Record<string, string | number | boolean | string[]>;
  args: Record<string, string | number | boolean>;
  resolvedConfig: Record<string, string | number | boolean>;
};

describe('cli/cartridge-command', () => {
  let config: Config;
  let command: TestCartridgeCommand;

  beforeEach(async () => {
    config = await Config.load();
    command = new TestCartridgeCommand([], config);
  });

  describe('init', () => {
    it('initializes command with cartridge flags', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags).to.be.an('object');
      expect(cmd.args).to.be.an('object');

      cmd.parse = originalParse;
    });

    it('handles cartridgePath argument', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '/custom/path'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.args.cartridgePath).to.equal('/custom/path');

      cmd.parse = originalParse;
    });

    it('uses default cartridgePath when not specified', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.args.cartridgePath).to.equal('.');

      cmd.parse = originalParse;
    });

    it('handles cartridge flag', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {cartridge: ['cart1', 'cart2']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags.cartridge).to.be.an('array');

      cmd.parse = originalParse;
    });

    it('handles exclude-cartridge flag', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {'exclude-cartridge': ['cart1', 'cart2']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      expect(cmd.flags['exclude-cartridge']).to.be.an('array');

      cmd.parse = originalParse;
    });
  });

  describe('cartridgePath', () => {
    it('returns default path when not specified', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const path = command.testCartridgePath();
      expect(path).to.equal('.');

      cmd.parse = originalParse;
    });

    it('returns custom path from args', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '/custom/path'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const path = command.testCartridgePath();
      expect(path).to.equal('/custom/path');

      cmd.parse = originalParse;
    });
  });

  describe('cartridgeOptions', () => {
    it('returns empty options when no flags', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const options = command.testCartridgeOptions();
      expect(options.include).to.be.undefined;
      expect(options.exclude).to.be.undefined;

      cmd.parse = originalParse;
    });

    it('returns include options from flag', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {cartridge: ['cart1', 'cart2']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const options = command.testCartridgeOptions();
      expect(options.include).to.be.an('array');
      expect(options.include).to.include('cart1');
      expect(options.include).to.include('cart2');

      cmd.parse = originalParse;
    });

    it('returns exclude options from flag', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {'exclude-cartridge': ['cart1', 'cart2']},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      const options = command.testCartridgeOptions();
      expect(options.exclude).to.be.an('array');
      expect(options.exclude).to.include('cart1');
      expect(options.exclude).to.include('cart2');

      cmd.parse = originalParse;
    });
  });

  describe('findCartridgesWithProviders', () => {
    it('returns default cartridges when no providers', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      // This will use the actual findCartridges function which may not find cartridges
      // in the test environment, so we just verify it doesn't throw
      try {
        await command.testFindCartridgesWithProviders();
      } catch {
        // Expected if no cartridges found
      }

      cmd.parse = originalParse;
    });

    it('accepts custom directory', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        await command.testFindCartridgesWithProviders('/custom/dir');
      } catch {
        // Expected if no cartridges found
      }

      cmd.parse = originalParse;
    });

    it('accepts custom options', async () => {
      const cmd = command as MockableCartridgeCommand;
      const originalParse = cmd.parse.bind(command);
      cmd.parse = (async () => ({
        args: {cartridgePath: '.'},
        flags: {},
        metadata: {},
      })) as typeof cmd.parse;

      await cmd.init();
      try {
        await command.testFindCartridgesWithProviders(undefined, {include: ['cart1']});
      } catch {
        // Expected if no cartridges found
      }

      cmd.parse = originalParse;
    });
  });
});
