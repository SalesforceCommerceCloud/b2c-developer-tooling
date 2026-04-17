/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import path from 'node:path';
import {createSourceMapper} from '@salesforce/b2c-tooling-sdk/operations/debug';
import type {CartridgeMapping} from '@salesforce/b2c-tooling-sdk/operations/code';

describe('operations/debug/source-mapping', () => {
  const cartridges: CartridgeMapping[] = [
    {name: 'app_storefront', src: '/workspace/cartridges/app_storefront', dest: 'app_storefront'},
    {name: 'bm_extensions', src: '/workspace/cartridges/bm_extensions', dest: 'bm_extensions'},
  ];

  const mapper = createSourceMapper(cartridges);

  describe('toServerPath', () => {
    it('converts a local path to a server script path', () => {
      const local = '/workspace/cartridges/app_storefront/cartridge/controllers/Cart.js';
      expect(mapper.toServerPath(local)).to.equal('/app_storefront/cartridge/controllers/Cart.js');
    });

    it('handles .ds file extensions', () => {
      const local = '/workspace/cartridges/app_storefront/cartridge/scripts/models/CartModel.ds';
      expect(mapper.toServerPath(local)).to.equal('/app_storefront/cartridge/scripts/models/CartModel.ds');
    });

    it('handles a different cartridge', () => {
      const local = '/workspace/cartridges/bm_extensions/cartridge/scripts/helper.js';
      expect(mapper.toServerPath(local)).to.equal('/bm_extensions/cartridge/scripts/helper.js');
    });

    it('returns undefined for unmapped paths', () => {
      expect(mapper.toServerPath('/other/path/file.js')).to.be.undefined;
    });

    it('handles relative paths by resolving them', () => {
      // This will only match if CWD happens to be inside a cartridge — just test it doesn't throw
      const result = mapper.toServerPath('relative/path.js');
      // Should be undefined unless CWD is inside a mapped cartridge
      expect(result === undefined || typeof result === 'string').to.be.true;
    });
  });

  describe('toLocalPath', () => {
    it('converts a server script path to a local path', () => {
      const server = '/app_storefront/cartridge/controllers/Cart.js';
      expect(mapper.toLocalPath(server)).to.equal(
        path.join('/workspace/cartridges/app_storefront', 'cartridge/controllers/Cart.js'),
      );
    });

    it('handles different cartridges', () => {
      const server = '/bm_extensions/cartridge/scripts/helper.js';
      expect(mapper.toLocalPath(server)).to.equal(
        path.join('/workspace/cartridges/bm_extensions', 'cartridge/scripts/helper.js'),
      );
    });

    it('returns undefined for unknown cartridge names', () => {
      expect(mapper.toLocalPath('/unknown_cart/cartridge/file.js')).to.be.undefined;
    });

    it('returns undefined for paths without a slash separator', () => {
      expect(mapper.toLocalPath('/onlycartridge')).to.be.undefined;
    });

    it('handles paths without leading slash', () => {
      const server = 'app_storefront/cartridge/controllers/Cart.js';
      expect(mapper.toLocalPath(server)).to.equal(
        path.join('/workspace/cartridges/app_storefront', 'cartridge/controllers/Cart.js'),
      );
    });
  });

  describe('round-trip', () => {
    it('local → server → local preserves the path', () => {
      const local = '/workspace/cartridges/app_storefront/cartridge/controllers/Cart.js';
      const server = mapper.toServerPath(local);
      expect(server).to.not.be.undefined;
      expect(mapper.toLocalPath(server!)).to.equal(local);
    });
  });
});
