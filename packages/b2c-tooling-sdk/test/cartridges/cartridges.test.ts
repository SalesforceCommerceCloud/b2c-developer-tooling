/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  CartridgeResolver,
  createNodeFileSystemHost,
  discoverCartridges,
  orderCartridges,
  parseCartridgePath,
  toForwardSlashes,
  type CartridgeFileSystemHost,
} from '@salesforce/b2c-tooling-sdk/cartridges';

/** In-memory host: files are exact-case forward-slash paths; directories are derived from them. */
function memoryHost(files: Record<string, string>, useCaseSensitiveFileNames = true): CartridgeFileSystemHost {
  const paths = Object.keys(files);
  return {
    fileExists: (p) => Object.hasOwn(files, toForwardSlashes(p)),
    readFile: (p) => files[toForwardSlashes(p)],
    getDirectories(dir) {
      const prefix = toForwardSlashes(dir).replace(/\/?$/, '/');
      const names = new Set<string>();
      for (const f of paths) {
        if (!f.startsWith(prefix)) continue;
        const rest = f.slice(prefix.length).split('/');
        if (rest.length > 1) names.add(rest[0]);
      }
      return [...names];
    },
    useCaseSensitiveFileNames,
  };
}

const P = '/proj/cartridges';
const CUSTOM = {name: 'app_custom', src: `${P}/app_custom`};
const BASE = {name: 'app_storefront_base', src: `${P}/app_storefront_base`};
const MODULES = {name: 'modules', src: `${P}/modules`};

describe('cartridges', () => {
  describe('parseCartridgePath', () => {
    it('splits colon and comma separated strings and trims entries', () => {
      expect(parseCartridgePath('app_custom: app_storefront_base,modules')).to.deep.equal([
        'app_custom',
        'app_storefront_base',
        'modules',
      ]);
    });

    it('accepts arrays and ignores non-string or empty entries', () => {
      expect(parseCartridgePath(['a', '', 3, ' b '])).to.deep.equal(['a', 'b']);
    });

    it('returns an empty list for other values', () => {
      expect(parseCartridgePath(undefined)).to.deep.equal([]);
      expect(parseCartridgePath({})).to.deep.equal([]);
    });
  });

  describe('orderCartridges', () => {
    it('puts configured names first, then the rest in discovery order, dropping unknown names', () => {
      const discovered = [MODULES, BASE, CUSTOM, {name: 'extra', src: '/x'}];
      const ordered = orderCartridges(discovered, ['app_custom', 'missing', 'app_storefront_base']);
      expect(ordered.map((c) => c.name)).to.deep.equal(['app_custom', 'app_storefront_base', 'modules', 'extra']);
    });

    it('sorts known base cartridges last without a configured order', () => {
      const ordered = orderCartridges([MODULES, BASE, CUSTOM]);
      expect(ordered.map((c) => c.name)).to.deep.equal(['app_custom', 'app_storefront_base', 'modules']);
    });

    it('does not modify its input', () => {
      const discovered = [MODULES, CUSTOM];
      orderCartridges(discovered);
      expect(discovered[0]).to.equal(MODULES);
    });
  });

  describe('CartridgeResolver.resolveRequire', () => {
    const files = {
      [`${CUSTOM.src}/cartridge/controllers/Cart.js`]: '',
      [`${CUSTOM.src}/cartridge/scripts/helpers/cartHelpers.js`]: '',
      [`${BASE.src}/cartridge/controllers/Cart.js`]: '',
      [`${BASE.src}/cartridge/scripts/helpers/cartHelpers.js`]: '',
      [`${BASE.src}/cartridge/scripts/middleware/csrf.js`]: '',
      [`${BASE.src}/cartridge/scripts/legacy/Util.ds`]: '',
      [`${BASE.src}/cartridge/scripts/util/index.js`]: '',
      [`${BASE.src}/cartridge/config/countries.json`]: '',
      [`${MODULES.src}/server.js`]: '',
      [`${MODULES.src}/server/middleware.js`]: '',
      [`${MODULES.src}/pkgdir/package.json`]: JSON.stringify({main: './lib/main.js'}),
      [`${MODULES.src}/pkgdir/lib/main.js`]: '',
    };
    const resolver = new CartridgeResolver([CUSTOM, BASE, MODULES], memoryHost(files));
    const fromBase = `${BASE.src}/cartridge/controllers/Cart.js`;
    const fromCustom = `${CUSTOM.src}/cartridge/controllers/Cart.js`;

    it('walks the cartridge path left to right for */, even from a cartridge further right', () => {
      const r = resolver.resolveRequire('*/cartridge/scripts/helpers/cartHelpers', fromBase);
      expect(r).to.deep.equal({
        path: `${CUSTOM.src}/cartridge/scripts/helpers/cartHelpers.js`,
        cartridge: 'app_custom',
        kind: 'cartridge-path',
      });
    });

    it('restricts ~/ to the cartridge that owns the calling file', () => {
      expect(resolver.resolveRequire('~/cartridge/scripts/middleware/csrf', fromCustom)).to.equal(undefined);
      expect(resolver.resolveRequire('~/cartridge/scripts/middleware/csrf', fromBase)?.kind).to.equal(
        'current-cartridge',
      );
    });

    it('returns undefined for ~/ from a file outside any cartridge', () => {
      expect(resolver.resolveRequire('~/cartridge/scripts/middleware/csrf', '/elsewhere/a.js')).to.equal(undefined);
    });

    it('resolves <cartridge>/cartridge/... in that cartridge only', () => {
      const r = resolver.resolveRequire('app_storefront_base/cartridge/controllers/Cart', fromCustom);
      expect(r).to.deep.equal({
        path: `${BASE.src}/cartridge/controllers/Cart.js`,
        cartridge: 'app_storefront_base',
        kind: 'named-cartridge',
      });
    });

    it('tries .js, .json, .ds and index files, and accepts explicit extensions', () => {
      expect(resolver.resolveRequire('*/cartridge/scripts/legacy/Util', fromBase)?.path).to.match(/Util\.ds$/);
      expect(resolver.resolveRequire('*/cartridge/scripts/util', fromBase)?.path).to.match(/util\/index\.js$/);
      expect(resolver.resolveRequire('*/cartridge/config/countries', fromBase)?.path).to.match(/countries\.json$/);
      expect(resolver.resolveRequire('*/cartridge/scripts/middleware/csrf.js', fromBase)?.path).to.match(/csrf\.js$/);
    });

    it('resolves bare specifiers in the modules cartridge, including package.json main', () => {
      expect(resolver.resolveRequire('server', fromBase)).to.deep.equal({
        path: `${MODULES.src}/server.js`,
        cartridge: 'modules',
        kind: 'modules',
      });
      expect(resolver.resolveRequire('server/middleware', fromBase)?.path).to.equal(
        `${MODULES.src}/server/middleware.js`,
      );
      expect(resolver.resolveRequire('pkgdir', fromBase)?.path).to.equal(`${MODULES.src}/pkgdir/lib/main.js`);
    });

    it('honors modules: false and modulesExclude', () => {
      expect(resolver.resolveRequire('server', fromBase, {modules: false})).to.equal(undefined);
      expect(resolver.resolveRequire('server', fromBase, {modulesExclude: new Set(['server'])})).to.equal(undefined);
    });

    it('resolves relative specifiers unless relative: false', () => {
      const r = resolver.resolveRequire('../scripts/middleware/csrf', fromBase);
      expect(r).to.deep.equal({
        path: `${BASE.src}/cartridge/scripts/middleware/csrf.js`,
        cartridge: 'app_storefront_base',
        kind: 'relative',
      });
      expect(resolver.resolveRequire('../scripts/middleware/csrf', fromBase, {relative: false})).to.equal(undefined);
    });

    it('leaves dw/ and unknown specifiers unresolved', () => {
      expect(resolver.resolveRequire('dw/system/Transaction', fromBase)).to.equal(undefined);
      expect(resolver.resolveRequire('*/cartridge/scripts/nope', fromBase)).to.equal(undefined);
      expect(resolver.resolveRequire('lodash', fromBase)).to.equal(undefined);
    });
  });

  describe('CartridgeResolver.resolveSuperModule', () => {
    const OVERLAY = {name: 'plugin_overlay', src: `${P}/plugin_overlay`};
    const files = {
      [`${OVERLAY.src}/cartridge/controllers/Cart.js`]: '',
      [`${CUSTOM.src}/cartridge/controllers/Account.js`]: '',
      [`${BASE.src}/cartridge/controllers/Cart.js`]: '',
      [`${BASE.src}/cartridge/controllers/Account.js`]: '',
      [`${BASE.src}/cartridge/scripts/legacy/Thing.ds`]: '',
      [`${CUSTOM.src}/cartridge/scripts/legacy/Thing.js`]: '',
    };
    const resolver = new CartridgeResolver([OVERLAY, CUSTOM, BASE], memoryHost(files));

    it('finds the same path in the next cartridge to the right that has it, skipping gaps', () => {
      const r = resolver.resolveSuperModule(`${OVERLAY.src}/cartridge/controllers/Cart.js`);
      expect(r).to.deep.equal({
        path: `${BASE.src}/cartridge/controllers/Cart.js`,
        cartridge: 'app_storefront_base',
        kind: 'super-module',
      });
    });

    it('never resolves to a cartridge on the left', () => {
      expect(resolver.resolveSuperModule(`${BASE.src}/cartridge/controllers/Account.js`)).to.equal(undefined);
    });

    it('matches across .js and .ds', () => {
      expect(resolver.resolveSuperModule(`${CUSTOM.src}/cartridge/scripts/legacy/Thing.js`)?.path).to.equal(
        `${BASE.src}/cartridge/scripts/legacy/Thing.ds`,
      );
    });

    it('returns undefined for files outside any cartridge', () => {
      expect(resolver.resolveSuperModule('/elsewhere/Cart.js')).to.equal(undefined);
    });
  });

  describe('CartridgeResolver ownership', () => {
    it('folds case for ownership on case-insensitive hosts but probes with the original case', () => {
      const src = '/Volumes/Proj/app_Core';
      const resolver = new CartridgeResolver(
        [{name: 'app_Core', src}],
        memoryHost({[`${src}/cartridge/scripts/a.js`]: ''}, false),
      );
      const from = '/volumes/proj/APP_CORE/cartridge/controllers/X.js';
      expect(resolver.ownerOf(from)?.name).to.equal('app_Core');
      expect(resolver.resolveRequire('~/cartridge/scripts/a', from)?.path).to.equal(`${src}/cartridge/scripts/a.js`);
    });

    it('prefers the most specific cartridge when roots are nested', () => {
      const resolver = new CartridgeResolver(
        [
          {name: 'outer', src: '/p/outer'},
          {name: 'inner', src: '/p/outer/inner'},
        ],
        memoryHost({}),
      );
      expect(resolver.ownerOf('/p/outer/inner/cartridge/a.js')?.name).to.equal('inner');
      expect(resolver.relativePath('/p/outer/inner/cartridge/a.js')).to.equal('cartridge/a.js');
    });

    it('accepts Windows-style paths', () => {
      const resolver = new CartridgeResolver([{name: 'c', src: 'C:\\proj\\c'}], memoryHost({}, false));
      expect(resolver.isCartridgeFile('c:/proj/c/cartridge/a.js')).to.equal(true);
    });
  });

  describe('discoverCartridges with the Node host', () => {
    let dir: string;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-sdk-cartridges-'));
      for (const rel of [
        'cartridges/app_custom',
        'cartridges/app_storefront_base',
        'node_modules/pkg/c',
        'deep/a/b/c/d',
      ]) {
        fs.mkdirSync(path.join(dir, rel), {recursive: true});
        fs.writeFileSync(path.join(dir, rel, '.project'), '<xml/>');
      }
      fs.mkdirSync(path.join(dir, 'cartridges/app_custom/cartridge/nested'), {recursive: true});
      fs.writeFileSync(path.join(dir, 'cartridges/app_custom/cartridge/nested/.project'), '<xml/>');
    });

    afterEach(() => {
      fs.rmSync(dir, {recursive: true, force: true});
    });

    it('finds cartridges, skips ignored directories, and does not descend into cartridges', () => {
      const found = discoverCartridges(dir, createNodeFileSystemHost());
      expect(found.map((c) => c.name)).to.deep.equal(['app_custom', 'app_storefront_base', 'd']);
    });

    it('honors maxDepth', () => {
      const found = discoverCartridges(dir, createNodeFileSystemHost(), {maxDepth: 2});
      expect(found.map((c) => c.name)).to.deep.equal(['app_custom', 'app_storefront_base']);
    });

    it('resolves against real files', () => {
      const base = path.join(dir, 'cartridges/app_storefront_base');
      fs.mkdirSync(path.join(base, 'cartridge/scripts'), {recursive: true});
      fs.writeFileSync(path.join(base, 'cartridge/scripts/helper.js'), '');
      const host = createNodeFileSystemHost();
      const resolver = new CartridgeResolver(orderCartridges(discoverCartridges(dir, host)), host);
      const r = resolver.resolveRequire('*/cartridge/scripts/helper', path.join(base, 'cartridge/controllers/X.js'));
      expect(r?.path).to.equal(toForwardSlashes(path.join(base, 'cartridge/scripts/helper.js')));
      expect(r?.cartridge).to.equal('app_storefront_base');
    });
  });
});
