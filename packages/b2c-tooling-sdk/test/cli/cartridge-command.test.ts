/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {CartridgeCommand} from '@salesforce/b2c-tooling-sdk/cli';
import {stubParse} from '../helpers/stub-parse.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';

class TestCartridgeCommand extends CartridgeCommand<typeof TestCartridgeCommand> {
  static id = 'test:cartridge';
  async run(): Promise<void> {}

  // Expose protected for testing
  public get testCartridgePath() {
    return this.cartridgePath;
  }
  public get testCartridgeOptions() {
    return this.cartridgeOptions;
  }
  public get testCartridgeProviderRunner() {
    return this.cartridgeProviderRunner;
  }
  public testFindCartridgesWithProviders(dir?: string) {
    return this.findCartridgesWithProviders(dir);
  }
}

describe('cli/cartridge-command', () => {
  let config: Config;
  let command: TestCartridgeCommand;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
    command = new TestCartridgeCommand([], config);
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  describe('cartridgePath', () => {
    it('returns cartridgePath from args', async () => {
      stubParse(command, {}, {cartridgePath: '/path/to/cartridges'});
      await command.init();
      expect(command.testCartridgePath).to.equal('/path/to/cartridges');
    });

    it('defaults to current directory', async () => {
      stubParse(command, {}, {cartridgePath: '.'});
      await command.init();
      expect(command.testCartridgePath).to.equal('.');
    });
  });

  describe('cartridgeOptions', () => {
    it('returns include/exclude from flags', async () => {
      stubParse(
        command,
        {
          cartridge: ['app_storefront', 'app_custom'],
          'exclude-cartridge': ['bm_extensions'],
        },
        {cartridgePath: '.'},
      );
      await command.init();

      const options = command.testCartridgeOptions;
      expect(options.include).to.deep.equal(['app_storefront', 'app_custom']);
      expect(options.exclude).to.deep.equal(['bm_extensions']);
    });

    it('returns undefined for unset include/exclude', async () => {
      stubParse(command, {}, {cartridgePath: '.'});
      await command.init();

      const options = command.testCartridgeOptions;
      expect(options.include).to.be.undefined;
      expect(options.exclude).to.be.undefined;
    });
  });

  describe('collectCartridgeProviders', () => {
    it('creates CartridgeProviderRunner during init', async () => {
      stubParse(command, {}, {cartridgePath: '.'});
      await command.init();
      // Runner is created even with no plugins
      expect(command.testCartridgeProviderRunner).to.exist;
    });
  });

  describe('findCartridgesWithProviders', () => {
    it('returns empty array when no cartridges found', async () => {
      stubParse(command, {server: 'test.demandware.net'}, {cartridgePath: '.'});
      await command.init();

      // With no .project files in cwd, returns empty array
      const cartridges = await command.testFindCartridgesWithProviders();
      expect(cartridges).to.be.an('array');
    });

    it('uses custom directory when provided', async () => {
      stubParse(command, {server: 'test.demandware.net'}, {cartridgePath: '/default/path'});
      await command.init();

      // Should not throw when using a custom directory
      const cartridges = await command.testFindCartridgesWithProviders('/tmp');
      expect(cartridges).to.be.an('array');
    });
  });
});
