/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {byPluginName} from '../../src/cli/hooks.js';

describe('cli/hooks', () => {
  describe('byPluginName', () => {
    it('orders hook results by plugin name, whatever order the plugins finished in', () => {
      const finished = [
        {plugin: {name: 'b2c-plugin-password-store'}, result: 1},
        {plugin: {name: 'b2c-plugin-macos-keychain'}, result: 2},
        {plugin: {name: '@scope/b2c-plugin'}, result: 3},
      ];
      expect(byPluginName(finished).map((success) => success.plugin.name)).to.deep.equal([
        '@scope/b2c-plugin',
        'b2c-plugin-macos-keychain',
        'b2c-plugin-password-store',
      ]);
      expect(finished[0].plugin.name).to.equal('b2c-plugin-password-store');
    });
  });
});
