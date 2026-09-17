/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {findCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';

describe('operations/code/cartridges', () => {
  describe('findCartridges', () => {
    it('returns empty array when no cartridges exist', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
      try {
        const result = findCartridges(dir);
        expect(result).to.deep.equal([]);
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    });

    it('finds cartridges by locating .project files and maps name/src/dest', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
      try {
        const c1 = path.join(dir, 'app_storefront_base');
        const c2 = path.join(dir, 'bm_tools');

        fs.mkdirSync(c1, {recursive: true});
        fs.mkdirSync(c2, {recursive: true});

        fs.writeFileSync(path.join(c1, '.project'), '<xml/>');
        fs.writeFileSync(path.join(c2, '.project'), '<xml/>');

        const result = findCartridges(dir);
        const names = result.map((c) => c.name).sort();

        expect(names).to.deep.equal(['app_storefront_base', 'bm_tools']);

        const sfra = result.find((c) => c.name === 'app_storefront_base')!;
        expect(sfra.dest).to.equal('app_storefront_base');
        expect(sfra.src).to.equal(c1);
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    });

    it('applies include filter when include list is provided', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
      try {
        const c1 = path.join(dir, 'a');
        const c2 = path.join(dir, 'b');

        fs.mkdirSync(c1, {recursive: true});
        fs.mkdirSync(c2, {recursive: true});

        fs.writeFileSync(path.join(c1, '.project'), '<xml/>');
        fs.writeFileSync(path.join(c2, '.project'), '<xml/>');

        const result = findCartridges(dir, {include: ['b']});
        expect(result.map((c) => c.name)).to.deep.equal(['b']);
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    });

    it('applies exclude filter when exclude list is provided', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
      try {
        const c1 = path.join(dir, 'a');
        const c2 = path.join(dir, 'b');

        fs.mkdirSync(c1, {recursive: true});
        fs.mkdirSync(c2, {recursive: true});

        fs.writeFileSync(path.join(c1, '.project'), '<xml/>');
        fs.writeFileSync(path.join(c2, '.project'), '<xml/>');

        const result = findCartridges(dir, {exclude: ['a']});
        expect(result.map((c) => c.name)).to.deep.equal(['b']);
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    });

    it('handles empty include/exclude lists as no-op', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
      try {
        const c1 = path.join(dir, 'a');
        fs.mkdirSync(c1, {recursive: true});
        fs.writeFileSync(path.join(c1, '.project'), '<xml/>');

        const result = findCartridges(dir, {include: [], exclude: []});
        expect(result.map((c) => c.name)).to.deep.equal(['a']);
      } finally {
        fs.rmSync(dir, {recursive: true, force: true});
      }
    });

    describe('maxDepth option', () => {
      it('finds cartridges within the depth bound and ignores deeper ones', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          // cartridges/<name>/.project => depth 3 relative to dir
          const shallow = path.join(dir, 'cartridges', 'app_storefront_base');
          // a/b/c/deep_cart/.project => depth 5 relative to dir
          const deep = path.join(dir, 'a', 'b', 'c', 'deep_cart');
          fs.mkdirSync(shallow, {recursive: true});
          fs.mkdirSync(deep, {recursive: true});
          fs.writeFileSync(path.join(shallow, '.project'), '<xml/>');
          fs.writeFileSync(path.join(deep, '.project'), '<xml/>');

          const bounded = findCartridges(dir, {maxDepth: 3});
          expect(bounded.map((c) => c.name)).to.deep.equal(['app_storefront_base']);

          // Unbounded (default) still finds the deep cartridge.
          const unbounded = findCartridges(dir);
          expect(unbounded.map((c) => c.name).sort()).to.deep.equal(['app_storefront_base', 'deep_cart']);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('returns empty when all cartridges are deeper than the bound', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const deep = path.join(dir, 'a', 'b', 'c', 'deep_cart');
          fs.mkdirSync(deep, {recursive: true});
          fs.writeFileSync(path.join(deep, '.project'), '<xml/>');

          expect(findCartridges(dir, {maxDepth: 3})).to.deep.equal([]);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });
    });

    describe('cartridge/*.properties fallback', () => {
      it('finds cartridges by .properties when no .project files exist', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'app_pwakit_base', 'cartridge');
          const c2 = path.join(dir, 'app_storefrontnext_base', 'cartridge');
          fs.mkdirSync(c1, {recursive: true});
          fs.mkdirSync(c2, {recursive: true});
          fs.writeFileSync(path.join(c1, 'app_pwakit_base.properties'), '');
          fs.writeFileSync(path.join(c2, 'app_storefrontnext_base.properties'), '');

          const result = findCartridges(dir);
          const names = result.map((c) => c.name).sort();
          expect(names).to.deep.equal(['app_pwakit_base', 'app_storefrontnext_base']);

          const pkg = result.find((c) => c.name === 'app_pwakit_base')!;
          expect(pkg.dest).to.equal('app_pwakit_base');
          expect(pkg.src).to.equal(path.join(dir, 'app_pwakit_base'));
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('prefers .project over .properties when both are present', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          // .project cartridge
          const c1 = path.join(dir, 'app_storefront_base');
          fs.mkdirSync(c1, {recursive: true});
          fs.writeFileSync(path.join(c1, '.project'), '<xml/>');

          // .properties cartridge — should NOT be discovered when .project exists
          const c2 = path.join(dir, 'app_pwakit_base', 'cartridge');
          fs.mkdirSync(c2, {recursive: true});
          fs.writeFileSync(path.join(c2, 'app_pwakit_base.properties'), '');

          const result = findCartridges(dir);
          expect(result.map((c) => c.name)).to.deep.equal(['app_storefront_base']);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('does not fall back to .properties when .project files exist but are excluded', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'excluded_cart');
          fs.mkdirSync(c1, {recursive: true});
          fs.writeFileSync(path.join(c1, '.project'), '<xml/>');

          // Would be found via .properties fallback if we accidentally fell through
          const c2 = path.join(dir, 'props_cart', 'cartridge');
          fs.mkdirSync(c2, {recursive: true});
          fs.writeFileSync(path.join(c2, 'props_cart.properties'), '');

          const result = findCartridges(dir, {exclude: ['excluded_cart']});
          expect(result).to.deep.equal([]);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('applies include/exclude filters to .properties-based discovery', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          for (const name of ['app_a', 'app_b', 'app_c']) {
            const cartDir = path.join(dir, name, 'cartridge');
            fs.mkdirSync(cartDir, {recursive: true});
            fs.writeFileSync(path.join(cartDir, `${name}.properties`), '');
          }

          const included = findCartridges(dir, {include: ['app_b']});
          expect(included.map((c) => c.name)).to.deep.equal(['app_b']);

          const excluded = findCartridges(dir, {exclude: ['app_a', 'app_c']});
          expect(excluded.map((c) => c.name)).to.deep.equal(['app_b']);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('firstMatchOnly falls back to .properties when no .project files exist', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'app_pwakit_base', 'cartridge');
          fs.mkdirSync(c1, {recursive: true});
          fs.writeFileSync(path.join(c1, 'app_pwakit_base.properties'), '');

          const result = findCartridges(dir, {firstMatchOnly: true});
          expect(result).to.have.length(1);
          expect(result[0].name).to.equal('app_pwakit_base');
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('firstMatchOnly does not fall back to .properties when .project files exist', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'excluded_cart');
          fs.mkdirSync(c1, {recursive: true});
          fs.writeFileSync(path.join(c1, '.project'), '<xml/>');

          const c2 = path.join(dir, 'app_pwakit_base', 'cartridge');
          fs.mkdirSync(c2, {recursive: true});
          fs.writeFileSync(path.join(c2, 'app_pwakit_base.properties'), '');

          const result = findCartridges(dir, {firstMatchOnly: true, exclude: ['excluded_cart']});
          expect(result).to.deep.equal([]);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('maxDepth applies correctly for .properties fallback (adds 1 to depth)', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          // cartridges/<name>/cartridge/<name>.properties => depth 4 (equiv to .project depth 3)
          const shallow = path.join(dir, 'cartridges', 'app_storefront_base', 'cartridge');
          fs.mkdirSync(shallow, {recursive: true});
          fs.writeFileSync(path.join(shallow, 'app_storefront_base.properties'), '');

          // a/b/c/deep_cart/cartridge/deep_cart.properties => depth 6
          const deep = path.join(dir, 'a', 'b', 'c', 'deep_cart', 'cartridge');
          fs.mkdirSync(deep, {recursive: true});
          fs.writeFileSync(path.join(deep, 'deep_cart.properties'), '');

          // maxDepth: 3 → properties scanned to depth 4 → finds shallow, skips deep
          const bounded = findCartridges(dir, {maxDepth: 3});
          expect(bounded.map((c) => c.name)).to.deep.equal(['app_storefront_base']);

          const unbounded = findCartridges(dir);
          expect(unbounded.map((c) => c.name).sort()).to.deep.equal(['app_storefront_base', 'deep_cart']);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });
    });

    describe('firstMatchOnly option', () => {
      it('returns a single cartridge that satisfies the filters', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'a');
          const c2 = path.join(dir, 'b');
          fs.mkdirSync(c1, {recursive: true});
          fs.mkdirSync(c2, {recursive: true});
          fs.writeFileSync(path.join(c1, '.project'), '<xml/>');
          fs.writeFileSync(path.join(c2, '.project'), '<xml/>');

          const result = findCartridges(dir, {firstMatchOnly: true});
          expect(result).to.have.length(1);
          expect(['a', 'b']).to.include(result[0].name);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('honors include filter while short-circuiting', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'a');
          const c2 = path.join(dir, 'app_storefront_base');
          fs.mkdirSync(c1, {recursive: true});
          fs.mkdirSync(c2, {recursive: true});
          fs.writeFileSync(path.join(c1, '.project'), '<xml/>');
          fs.writeFileSync(path.join(c2, '.project'), '<xml/>');

          const result = findCartridges(dir, {firstMatchOnly: true, include: ['app_storefront_base']});
          expect(result.map((c) => c.name)).to.deep.equal(['app_storefront_base']);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });

      it('returns empty when no cartridge matches the filters', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
        try {
          const c1 = path.join(dir, 'a');
          fs.mkdirSync(c1, {recursive: true});
          fs.writeFileSync(path.join(c1, '.project'), '<xml/>');

          const result = findCartridges(dir, {firstMatchOnly: true, include: ['does_not_exist']});
          expect(result).to.deep.equal([]);
        } finally {
          fs.rmSync(dir, {recursive: true, force: true});
        }
      });
    });
  });
});
