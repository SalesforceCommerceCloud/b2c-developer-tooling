/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import * as assert from 'assert';
import {
  canQueryInstanceSilently,
  describeOrderSource,
  moveCartridge,
  pickSiteForCartridges,
  resolveCartridgeOrder,
  shiftCartridge,
  splitCartridgePath,
  type InstanceCartridgePath,
} from '../cartridges/cartridge-order.js';

const c = (name: string) => ({name, src: `/proj/${name}`});
const names = (list: {name: string}[]) => list.map((x) => x.name);

const discovered = [c('modules'), c('app_storefront_base'), c('plugin_wishlists'), c('app_custom')];
const instance: InstanceCartridgePath = {
  hostname: 'my-sandbox.example.com',
  siteId: 'RefArch',
  siteSelection: 'auto',
  cartridges: ['app_custom', 'plugin_wishlists', 'app_storefront_base', 'modules'],
};

suite('cartridge order', () => {
  suite('resolveCartridgeOrder precedence', () => {
    test('guesses when nothing else is available, with base cartridges last', () => {
      const r = resolveCartridgeOrder({discovered});
      assert.strictEqual(r.source, 'guessed');
      assert.deepStrictEqual(names(r.cartridges), ['plugin_wishlists', 'app_custom', 'app_storefront_base', 'modules']);
    });

    test('uses the instance site path over a guess', () => {
      const r = resolveCartridgeOrder({discovered, instance});
      assert.strictEqual(r.source, 'instance');
      assert.strictEqual(r.instance?.siteId, 'RefArch');
      assert.deepStrictEqual(names(r.cartridges), instance.cartridges);
    });

    test('uses the cartridges config over the instance', () => {
      const r = resolveCartridgeOrder({
        discovered,
        instance,
        configured: ['app_storefront_base', 'app_custom', 'plugin_wishlists', 'modules'],
      });
      assert.strictEqual(r.source, 'config');
      assert.deepStrictEqual(names(r.cartridges), ['app_storefront_base', 'app_custom', 'plugin_wishlists', 'modules']);
    });

    test('uses a manual order over everything', () => {
      const r = resolveCartridgeOrder({
        discovered,
        instance,
        configured: ['app_custom'],
        manual: ['modules', 'app_custom', 'app_storefront_base', 'plugin_wishlists'],
      });
      assert.strictEqual(r.source, 'manual');
      assert.deepStrictEqual(names(r.cartridges), ['modules', 'app_custom', 'app_storefront_base', 'plugin_wishlists']);
    });

    test('appends cartridges the source does not name, in guessed order', () => {
      const r = resolveCartridgeOrder({discovered, configured: ['app_custom']});
      assert.deepStrictEqual(names(r.cartridges), ['app_custom', 'plugin_wishlists', 'app_storefront_base', 'modules']);
    });

    test('ignores an empty instance path', () => {
      assert.strictEqual(
        resolveCartridgeOrder({discovered, instance: {...instance, cartridges: []}}).source,
        'guessed',
      );
    });
  });

  suite('pickSiteForCartridges', () => {
    test('picks the site naming the most local cartridges and skips Business Manager', () => {
      const best = pickSiteForCartridges(
        [
          {siteId: 'Sites-Site', cartridges: ['app_custom', 'plugin_wishlists', 'app_storefront_base', 'modules']},
          {siteId: 'SiteA', cartridges: ['app_storefront_base']},
          {siteId: 'SiteB', cartridges: ['app_custom', 'app_storefront_base', 'modules']},
        ],
        names(discovered),
      );
      assert.strictEqual(best?.siteId, 'SiteB');
    });

    test('keeps the first site on a tie and returns undefined when none match', () => {
      const sites = [
        {siteId: 'SiteA', cartridges: ['app_custom']},
        {siteId: 'SiteB', cartridges: ['app_custom']},
      ];
      assert.strictEqual(pickSiteForCartridges(sites, ['app_custom'])?.siteId, 'SiteA');
      assert.strictEqual(pickSiteForCartridges(sites, ['other']), undefined);
    });
  });

  suite('moveCartridge and shiftCartridge', () => {
    const order = ['a', 'b', 'c', 'd'];

    test('moves before a target, or to the end without one', () => {
      assert.deepStrictEqual(moveCartridge(order, 'd', 'b'), ['a', 'd', 'b', 'c']);
      assert.deepStrictEqual(moveCartridge(order, 'a', 'c'), ['b', 'a', 'c', 'd']);
      assert.deepStrictEqual(moveCartridge(order, 'a', undefined), ['b', 'c', 'd', 'a']);
    });

    test('leaves the order unchanged for unknown names or self-drops', () => {
      assert.deepStrictEqual(moveCartridge(order, 'x', 'a'), order);
      assert.deepStrictEqual(moveCartridge(order, 'b', 'b'), order);
    });

    test('shifts by one and stops at the ends', () => {
      assert.deepStrictEqual(shiftCartridge(order, 'c', -1), ['a', 'c', 'b', 'd']);
      assert.deepStrictEqual(shiftCartridge(order, 'a', -1), order);
      assert.deepStrictEqual(shiftCartridge(order, 'd', 1), order);
    });
  });

  suite('helpers', () => {
    test('splitCartridgePath trims and drops empty entries', () => {
      assert.deepStrictEqual(splitCartridgePath(' a:b: :c '), ['a', 'b', 'c']);
      assert.deepStrictEqual(splitCartridgePath(undefined), []);
    });

    test('canQueryInstanceSilently requires client credentials that authMethods allow', () => {
      assert.strictEqual(canQueryInstanceSilently({clientId: 'id'}), false);
      assert.strictEqual(canQueryInstanceSilently({clientId: 'id', clientSecret: 's'}), true);
      assert.strictEqual(
        canQueryInstanceSilently({clientId: 'id', clientSecret: 's', authMethods: ['implicit']}),
        false,
      );
      assert.strictEqual(
        canQueryInstanceSilently({clientId: 'id', clientSecret: 's', authMethods: ['implicit', 'client-credentials']}),
        true,
      );
    });

    test('describeOrderSource names the source', () => {
      assert.strictEqual(describeOrderSource({source: 'instance', instance}), 'Order: RefArch on instance');
      assert.strictEqual(describeOrderSource({source: 'guessed'}), 'Order: guessed');
    });
  });
});
