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

    it('lists route event listeners in the order they run', () => {
      write(
        'cartridges/app_base/cartridge/controllers/Login.js',
        [
          "var server = require('server');",
          "server.post('Submit', function (req, res, next) {",
          '  if (req.form.valid) {',
          "    this.on('route:BeforeComplete', function () {});",
          '  }',
          "  this.on('route:Redirect', function () {});",
          '  [1].forEach(() => {',
          "    this.on('route:Complete', function () {});",
          '  });',
          "  helper.on('route:Complete', function () {});",
          "  function inner() { this.on('route:Complete', function () {}); }",
          '  next();',
          '});',
          'module.exports = server.exports();',
        ].join('\n'),
      );
      write(
        'cartridges/app_custom/cartridge/controllers/Login.js',
        [
          "var server = require('server');",
          'server.extend(module.superModule);',
          'var submitAppend = function (req, res, next) {',
          "  this.on('route:BeforeComplete', function () {});",
          '  next();',
          '};',
          "server.append('Submit', submitAppend);",
          'module.exports = server.exports();',
        ].join('\n'),
      );
      const index = buildProjectIndex({root: dir, cartridgePath: ['app_custom', 'app_base']});
      const submit = endpoint(index.endpoints, 'Login-Submit');
      expect(submit.events!.map((e) => `${e.event}@${e.cartridge}:${e.line}`)).to.deep.equal([
        'route:Redirect@app_base:6',
        'route:BeforeComplete@app_base:4',
        'route:BeforeComplete@app_custom:4',
        'route:Complete@app_base:8',
      ]);
      expect(submit.events![1]).to.include({conditional: true, step: 1});
      expect(submit.events![0].conditional).to.equal(undefined);
      expect(submit.events![2]).to.include({via: 'append', step: 2});
      expect(endpoint(index.endpoints, 'Account-Show').events).to.equal(undefined);
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
        kind: 'system',
        function: 'calculate',
        exports: ['calculate'],
        cartridge: 'app_storefront_controllers',
        script: './cart/calculate',
        relPath: 'cartridge/scripts/cart/calculate.js',
        line: 1,
        returnsValue: 'no',
        registeredIn: {relPath: 'cartridge/scripts/hooks.json', line: 1},
      },
    ]);
    expect(index.customApis).to.have.length(1);
    expect(index.customApis[0]).to.deep.include({
      api: 'loyalty',
      endpoint: 'getPoints',
      cartridge: 'int_api',
      apiType: 'unknown',
    });
    expect(index.customApis[0].problems[0]).to.match(/schema.yaml is missing/);
    expect(index.jobSteps).to.deep.equal([
      {
        typeId: 'custom.Export',
        kind: 'script-module-step',
        cartridge: 'int_api',
        module: 'int_api/cartridge/scripts/export.js',
        function: 'execute',
        registeredIn: {relPath: 'steptypes.json', line: 1},
        parameters: [],
        problems: ['Module int_api/cartridge/scripts/export.js not found.'],
      },
    ]);
  });

  describe('hooks', () => {
    it('classifies system and custom extension points and finds whether implementations return a value', () => {
      write('app_a/.project');
      write('app_a/package.json', JSON.stringify({hooks: './hooks.json'}));
      write(
        'app_a/hooks.json',
        JSON.stringify({
          hooks: [
            {name: 'dw.ocapi.shop.basket.afterPOST', script: './cartridge/scripts/hooks/basket'},
            {name: 'dw.ocapi.shop.basket.beforePATCH', script: './cartridge/scripts/hooks/basket'},
            {name: 'app.custom.notify', script: './cartridge/scripts/hooks/notify.js'},
            {name: 'dw.order.calculate', script: './cartridge/scripts/hooks/missing'},
          ],
        }),
      );
      write(
        'app_a/cartridge/scripts/hooks/basket.js',
        [
          "var Status = require('dw/system/Status');",
          'exports.afterPOST = function (basket) {',
          '  basket.items.forEach(function (i) { return i; });',
          '  if (!basket) return;',
          '};',
          'function beforePATCH(basket) {',
          '  if (!basket) { return new Status(Status.ERROR); }',
          '}',
          'module.exports.beforePATCH = beforePATCH;',
        ].join('\n'),
      );
      write('app_a/cartridge/scripts/hooks/notify.js', 'module.exports = {notify: () => true};');

      const index = buildProjectIndex({root: dir});
      const byName = Object.fromEntries(index.hooks.map((h) => [h.name, h]));
      expect(byName['dw.ocapi.shop.basket.afterPOST']).to.include({
        kind: 'system',
        function: 'afterPOST',
        line: 2,
        returnsValue: 'no',
      });
      expect(byName['dw.ocapi.shop.basket.beforePATCH']).to.include({line: 6, returnsValue: 'yes'});
      expect(byName['app.custom.notify']).to.include({kind: 'custom', returnsValue: 'unknown'});
      expect(byName['app.custom.notify'].function, 'custom hooks have no fixed function').to.equal(undefined);
      expect(byName['app.custom.notify'].exports).to.deep.equal(['notify']);
      expect(byName['dw.order.calculate']).to.include({returnsValue: 'unknown'});
      expect(byName['dw.order.calculate'].relPath).to.equal(undefined);
    });
  });

  describe('custom APIs', () => {
    beforeEach(() => {
      write('int_api/.project');
      write(
        'int_api/cartridge/rest-apis/loyalty/api.json',
        JSON.stringify({
          endpoints: [
            {endpoint: 'getPoints', schema: 'schema.yaml', implementation: 'script'},
            {endpoint: 'setPoints', schema: 'schema.yaml', implementation: 'script'},
            {endpoint: 'missingOp', schema: 'schema.yaml', implementation: 'script'},
          ],
        }),
      );
      write(
        'int_api/cartridge/rest-apis/loyalty/schema.yaml',
        [
          'openapi: 3.0.0',
          'paths:',
          '  /points:',
          '    get:',
          '      operationId: getPoints',
          '    put:',
          '      operationId: setPoints',
          '      security:',
          '        - AmOAuth2: [c_loyalty_rw]',
          'security:',
          '  - ShopperToken: [c_loyalty]',
        ].join('\n'),
      );
      write(
        'int_api/cartridge/rest-apis/loyalty/script.js',
        [
          'exports.getPoints = function () {};',
          'exports.getPoints.public = true;',
          'function setPoints() {}',
          'exports.setPoints = setPoints;',
        ].join('\n'),
      );
    });

    it('joins api.json with the schema operation and the implementation', () => {
      const index = buildProjectIndex({root: dir});
      const [get, put, missing] = index.customApis;
      expect(get).to.deep.include({
        method: 'GET',
        path: '/points',
        security: ['ShopperToken'],
        scopes: ['c_loyalty'],
        apiType: 'shopper',
        implementationFile: {relPath: 'cartridge/rest-apis/loyalty/script.js', line: 1},
        public: true,
        problems: [],
      });
      expect(put).to.deep.include({method: 'PUT', apiType: 'admin', scopes: ['c_loyalty_rw'], public: false});
      expect(put.problems[0]).to.match(/public = true is missing/);
      expect(missing.problems).to.have.length(2);
      expect(missing.problems[0]).to.match(/No operation with operationId "missingOp"/);
    });
  });

  it('resolves where required middleware is implemented and records what replace dropped', () => {
    write('app_base/.project');
    write('app_base/cartridge/scripts/middleware/csrf.js', '// csrf\n\nexports.validateAjaxRequest = function () {};');
    write(
      'app_base/cartridge/controllers/A.js',
      "var server = require('server'); var csrf = require('*/cartridge/scripts/middleware/csrf');\nserver.post('B', server.middleware.https, csrf.validateAjaxRequest, function () {});\nmodule.exports = server.exports();",
    );
    write('app_custom/.project');
    write(
      'app_custom/cartridge/controllers/A.js',
      "var server = require('server');\nserver.extend(module.superModule);\nserver.replace('B', server.middleware.post, function () {});\nmodule.exports = server.exports();",
    );
    const index = buildProjectIndex({root: dir, cartridgePath: ['app_custom', 'app_base']});
    const b = index.endpoints.find((e) => e.id === 'A-B')!;
    const replace = b.steps!.find((s) => s.method === 'replace')!;
    expect(replace.dropped).to.deep.equal(['server.middleware.https', 'csrf.validateAjaxRequest']);
    const csrf = replace.replaced!.find((m) => m.id === 'csrf.validateAjaxRequest')!;
    expect(csrf.source).to.deep.equal({
      cartridge: 'app_base',
      relPath: 'cartridge/scripts/middleware/csrf.js',
      line: 3,
    });
    expect(csrf.expression).to.equal('csrf.validateAjaxRequest');
  });

  it('resolves ~/ and */ hook scripts like require()', () => {
    write('plugin_a/.project');
    write('plugin_a/package.json', JSON.stringify({hooks: './hooks.json'}));
    write(
      'plugin_a/hooks.json',
      JSON.stringify({
        hooks: [
          {name: 'app.a.event', script: '~/cartridge/scripts/hooks/aHooks'},
          {name: 'app.b.event', script: '*/cartridge/scripts/hooks/bHooks'},
        ],
      }),
    );
    write('plugin_a/cartridge/scripts/hooks/aHooks.js', 'exports.event = function () {};');
    write('app_base/.project');
    write('app_base/cartridge/scripts/hooks/bHooks.js', 'exports.event = function () {};');
    const index = buildProjectIndex({root: dir, cartridgePath: ['plugin_a', 'app_base']});
    const a = index.hooks.find((h) => h.name === 'app.a.event')!;
    const b = index.hooks.find((h) => h.name === 'app.b.event')!;
    expect(a.relPath).to.equal('cartridge/scripts/hooks/aHooks.js');
    expect(b.relPath).to.equal('cartridge/scripts/hooks/bHooks.js');
    expect(a.scriptCartridge).to.be.undefined;
    expect(b.scriptCartridge).to.equal('app_base');
  });

  it('records hooks.json lines and the functions custom hooks are called with', () => {
    write('plugin_a/.project');
    write('plugin_a/package.json', JSON.stringify({hooks: './hooks.json'}));
    write(
      'plugin_a/hooks.json',
      '{\n  "hooks": [\n    {"name": "app.a.event", "script": "./cartridge/scripts/aHooks"}\n  ]\n}',
    );
    write('plugin_a/cartridge/scripts/aHooks.js', 'exports.other = function () {};\n\nexports.track = function () {};');
    write(
      'plugin_a/cartridge/templates/default/x.isml',
      "<isscript>require('dw/system/HookMgr').callHook('app.a.event', 'track', {});</isscript>",
    );
    const [hook] = buildProjectIndex({root: dir}).hooks;
    expect(hook.registeredIn).to.deep.equal({relPath: 'hooks.json', line: 3});
    expect(hook.calledFunctions).to.deep.equal([{name: 'track', line: 3}]);
  });

  it('reads custom job steps with their parameters, implementation, and problems', () => {
    write('int_jobs/.project');
    write(
      'int_jobs/steptypes.json',
      JSON.stringify(
        {
          'step-types': {
            'script-module-step': [
              {
                '@type-id': 'custom.Export',
                description: 'Exports orders',
                module: 'int_jobs/cartridge/scripts/jobs/export.js',
                function: 'run',
                parameters: {parameter: [{'@name': 'Folder', '@type': 'string', '@required': 'true'}]},
              },
              {'@type-id': 'custom.Missing', module: 'int_jobs/cartridge/scripts/jobs/missing'},
            ],
            'chunk-script-module-step': [{'@type-id': 'custom.Chunk', module: 'cartridge/scripts/jobs/chunk'}],
          },
        },
        null,
        2,
      ),
    );
    write('int_jobs/cartridge/scripts/jobs/export.js', '// export\nexports.run = function () {};');
    write('int_jobs/cartridge/scripts/jobs/chunk.js', 'exports.read = function () {};');
    const steps = buildProjectIndex({root: dir}).jobSteps;
    const exp = steps.find((s) => s.typeId === 'custom.Export')!;
    expect(exp.implementationFile).to.deep.equal({
      cartridge: 'int_jobs',
      relPath: 'cartridge/scripts/jobs/export.js',
      line: 2,
    });
    expect(exp.parameters).to.deep.equal([{name: 'Folder', type: 'string', required: true}]);
    expect(exp.registeredIn.line).to.be.greaterThan(1);
    expect(steps.find((s) => s.typeId === 'custom.Missing')!.problems[0]).to.match(/not found/);
    const chunk = steps.find((s) => s.typeId === 'custom.Chunk')!;
    expect(chunk.function).to.be.undefined;
    expect(chunk.implementationFile?.relPath).to.equal('cartridge/scripts/jobs/chunk.js');
  });

  it('reads nested and legacy steptypes.json files and resolves .ds and sibling-cartridge modules', () => {
    write('int_jobs/.project');
    write('plugin_shared/.project');
    write(
      'int_jobs/cartridge/jobs/steptypes.json',
      JSON.stringify({'step-types': [{'@type-id': 'custom.Legacy', module: 'int_jobs/cartridge/scripts/legacy'}]}),
    );
    write('int_jobs/cartridge/scripts/legacy.ds', 'exports.execute = function () {};');
    write(
      'int_jobs/steptypes.json',
      JSON.stringify({
        'step-types': {
          'script-module-step': [{'@type-id': 'custom.Shared', module: 'plugin_shared/cartridge/scripts/shared.js'}],
        },
      }),
    );
    write('plugin_shared/cartridge/scripts/shared.js', 'exports.execute = function () {};');
    const steps = buildProjectIndex({root: dir}).jobSteps;
    const legacy = steps.find((s) => s.typeId === 'custom.Legacy')!;
    expect(legacy.kind).to.equal('script-module-step');
    expect(legacy.implementationFile?.relPath).to.equal('cartridge/scripts/legacy.ds');
    expect(legacy.registeredIn.relPath).to.equal('cartridge/jobs/steptypes.json');
    const shared = steps.find((s) => s.typeId === 'custom.Shared')!;
    expect(shared.cartridge).to.equal('int_jobs');
    expect(shared.implementationFile?.cartridge).to.equal('plugin_shared');
    expect(shared.problems).to.deep.equal([]);
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
