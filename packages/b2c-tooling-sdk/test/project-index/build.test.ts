/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {buildProjectIndex, type IndexedEndpoint} from '@salesforce/b2c-tooling-sdk/project-index';

describe('project-index', () => {
  let dir: string;

  const write = (rel: string, text = '') => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, text);
  };
  const endpoint = (endpoints: IndexedEndpoint[], id: string) => endpoints.find((e) => e.id === id)!;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-project-index-'));
  });

  afterEach(() => {
    fs.rmSync(dir, {recursive: true, force: true});
  });

  describe('SFRA routes', () => {
    beforeEach(() => {
      write('cartridges/app_base/.project');
      write(
        'cartridges/app_base/cartridge/controllers/Account.js',
        [
          "var server = require('server');",
          "var csrfProtection = require('*/cartridge/scripts/middleware/csrf');",
          "var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');",
          "server.post('Save', server.middleware.https, userLoggedIn.validateLoggedInAjax, csrfProtection.validateAjaxRequest, function (req, res, next) { next(); });",
          "server.get('Show', userLoggedIn.validateLoggedIn, function (req, res, next) { next(); });",
          "server.post('Subscribe', function (req, res, next) { next(); });",
          "server.use('Page', function (req, res, next) { next(); });",
          'module.exports = server.exports();',
        ].join('\n'),
      );
      write('cartridges/app_custom/.project');
      write(
        'cartridges/app_custom/cartridge/controllers/Account.js',
        [
          "var server = require('server');",
          "var csrfProtection = require('*/cartridge/scripts/middleware/csrf');",
          'server.extend(module.superModule);',
          "server.prepend('Subscribe', csrfProtection.validateAjaxRequest);",
          "server.append('Show', function (req, res, next) { next(); });",
          "server.replace('Save', function (req, res, next) { var f = req.form; next(); });",
          'module.exports = server.exports();',
        ].join('\n'),
      );
    });

    it('composes routes along the cartridge path', () => {
      const index = buildProjectIndex({root: dir, cartridgePath: ['app_custom', 'app_base']});
      expect(index.cartridges.map((c) => c.name)).to.deep.equal(['app_custom', 'app_base']);
      expect(index.endpoints.map((e) => e.id).sort()).to.deep.equal([
        'Account-Page',
        'Account-Save',
        'Account-Show',
        'Account-Subscribe',
      ]);

      const show = endpoint(index.endpoints, 'Account-Show');
      expect(show).to.include({kind: 'sfra', loginRequired: true, csrf: 'not-applicable', cartridge: 'app_base'});
      expect(show.methods).to.deep.equal(['GET']);
      expect(show.chain!.map((m) => m.id)).to.deep.equal([
        'server.middleware.get',
        'userLoggedIn.validateLoggedIn',
        'function',
        'function',
      ]);
      expect(show.chain!.at(-1)).to.include({via: 'append', cartridge: 'app_custom'});

      const subscribe = endpoint(index.endpoints, 'Account-Subscribe');
      expect(subscribe.csrf, 'an overlay prepends the CSRF check').to.equal('middleware');
      expect(subscribe.steps!.map((s) => `${s.cartridge}:${s.method}`)).to.deep.equal([
        'app_base:post',
        'app_custom:prepend',
      ]);
    });

    it('records what server.replace dropped and that the method check is gone', () => {
      const index = buildProjectIndex({root: dir, cartridgePath: ['app_custom', 'app_base']});
      const save = endpoint(index.endpoints, 'Account-Save');
      expect(save).to.include({cartridge: 'app_custom', https: false, loginRequired: false, csrf: 'none'});
      expect(save.methods).to.deep.equal(['ANY']);
      const replace = save.steps!.find((s) => s.method === 'replace')!;
      expect(replace.replaced!.map((m) => m.id)).to.deep.equal([
        'server.middleware.post',
        'server.middleware.https',
        'userLoggedIn.validateLoggedInAjax',
        'csrf.validateAjaxRequest',
        'function',
      ]);
      expect(save.chain![0]).to.include({id: 'function', readsForm: true});
    });

    it('marks unprotected POST routes and leaves any-method routes as none', () => {
      const index = buildProjectIndex({root: dir, cartridgePath: ['app_base']});
      expect(endpoint(index.endpoints, 'Account-Subscribe').csrf).to.equal('none');
      expect(endpoint(index.endpoints, 'Account-Page').methods).to.deep.equal(['ANY']);
    });

    it('uses discovery order without a cartridge path, so superModule cannot find a base to the left', () => {
      // app_base sorts before app_custom; app_custom's superModule would be to its right, so nothing is composed.
      const index = buildProjectIndex({root: dir});
      expect(index.cartridges.map((c) => c.name)).to.deep.equal(['app_base', 'app_custom']);
      expect(endpoint(index.endpoints, 'Account-Save').cartridge).to.equal('app_base');
    });
  });

  it('indexes SiteGenesis guard controllers, pipelines, hooks, custom APIs, and job steps', () => {
    write('app_storefront_controllers/.project');
    write(
      'app_storefront_controllers/cartridge/controllers/Cart.js',
      [
        "var guard = require('~/cartridge/scripts/guard');",
        'function show() {}',
        'function addCoupon() { var CSRFProtection = require("dw/web/CSRFProtection"); CSRFProtection.validateRequest(); }',
        "exports.Show = guard.ensure(['get', 'https'], show);",
        "exports.AddProduct = guard.ensure(['post'], show);",
        "exports.AddCoupon = guard.ensure(['post', 'https'], addCoupon);",
        "exports.Submit = guard.ensure(['post', 'https', 'loggedIn', 'csrf'], show);",
        'exports.All = guard.all(show);',
      ].join('\n'),
    );
    write('app_storefront_controllers/package.json', JSON.stringify({hooks: './cartridge/scripts/hooks.json'}));
    write(
      'app_storefront_controllers/cartridge/scripts/hooks.json',
      JSON.stringify({hooks: [{name: 'dw.order.calculate', script: './cart/calculate'}]}),
    );
    write('app_storefront_controllers/cartridge/scripts/cart/calculate.js', 'exports.calculate = function () {};');
    write('app_storefront_pipelines/.project');
    write(
      'app_storefront_pipelines/cartridge/pipelines/Wishlist.xml',
      '<pipeline group="ProductList">\n  <branch>\n    <start-node call-mode="private" name="RequireLogin" secure="false"/>\n  </branch>\n  <start-node name="Show" secure="true"/>\n</pipeline>\n',
    );
    write('app_storefront_pipelines/cartridge/pipelines/Cart.xml', '<pipeline><start-node name="Show"/></pipeline>');
    write('int_api/.project');
    write(
      'int_api/cartridge/rest-apis/loyalty/api.json',
      JSON.stringify({endpoints: [{endpoint: 'getPoints', schema: 'schema.yaml', implementation: 'script'}]}),
    );
    write(
      'int_api/steptypes.json',
      JSON.stringify({
        'step-types': {
          'script-module-step': [{'@type-id': 'custom.Export', module: 'int_api/cartridge/scripts/export.js'}],
        },
      }),
    );

    const index = buildProjectIndex({root: dir});

    expect(endpoint(index.endpoints, 'Cart-Show')).to.deep.include({
      kind: 'sg-controller',
      methods: ['GET'],
      https: true,
      csrf: 'not-applicable',
    });
    expect(endpoint(index.endpoints, 'Cart-AddProduct').csrf).to.equal('none');
    expect(endpoint(index.endpoints, 'Cart-AddCoupon').csrf).to.equal('in-handler');
    expect(endpoint(index.endpoints, 'Cart-Submit')).to.include({csrf: 'middleware', loginRequired: true});
    expect(endpoint(index.endpoints, 'Cart-All').methods).to.deep.equal(['ANY']);

    expect(endpoint(index.endpoints, 'Wishlist-Show')).to.include({kind: 'pipeline', https: true, public: true});
    expect(endpoint(index.endpoints, 'Wishlist-RequireLogin')).to.include({public: false, line: 3});
    expect(
      index.endpoints.filter((e) => e.kind === 'pipeline' && e.controller === 'Cart'),
      'controllers win over pipelines',
    ).to.be.empty;

    expect(index.hooks).to.deep.equal([
      {
        name: 'dw.order.calculate',
        cartridge: 'app_storefront_controllers',
        script: './cart/calculate',
        relPath: 'cartridge/scripts/cart/calculate.js',
      },
    ]);
    expect(index.customApis).to.deep.equal([
      {api: 'loyalty', endpoint: 'getPoints', cartridge: 'int_api', schema: 'schema.yaml', implementation: 'script'},
    ]);
    expect(index.jobSteps).to.deep.equal([
      {
        typeId: 'custom.Export',
        kind: 'script-module-step',
        cartridge: 'int_api',
        module: 'int_api/cartridge/scripts/export.js',
      },
    ]);
  });

  it('records controllers that cannot be parsed', () => {
    write('c/.project');
    write('c/cartridge/controllers/Broken.js', 'function (');
    const index = buildProjectIndex({root: dir});
    expect(index.errors).to.have.length(1);
    expect(index.errors[0]).to.include({cartridge: 'c', relPath: 'cartridge/controllers/Broken.js'});
  });

  it('is plain JSON', () => {
    write('c/.project');
    write('c/cartridge/controllers/A.js', "var server = require('server'); server.get('B', function () {});");
    const index = buildProjectIndex({root: dir});
    expect(JSON.parse(JSON.stringify(index))).to.deep.equal(index);
  });
});
