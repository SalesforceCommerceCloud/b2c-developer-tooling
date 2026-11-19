/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {Services} from '../../src/services.js';
import {createMockResolvedConfig} from '../test-helpers.js';
import {createProjectInspectTool, createSecurityScanTool} from '../../src/tools/project/index.js';
import {CartridgePathResolver, type SitesBackendFactory} from '../../src/tools/project/cartridge-path.js';
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk';
import type {ToolResult} from '../../src/utils/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function json(result: ToolResult): any {
  const text = result.content[0];
  if (text?.type !== 'text') throw new Error('Expected text content');
  if (result.isError) throw new Error(text.text);
  return JSON.parse(text.text);
}

function errorText(result: ToolResult): string {
  const text = result.content[0];
  expect(result.isError).to.equal(true);
  return text?.type === 'text' ? text.text : '';
}

describe('tools/project', () => {
  let root: string;
  const services = () =>
    new Services({
      resolvedConfig: createMockResolvedConfig({
        projectDirectory: root,
        cartridges: ['app_custom', 'app_storefront_base'],
      }),
    });
  const inspect = createProjectInspectTool(services);
  const scan = createSecurityScanTool(services);

  function write(name: string, contents = ''): void {
    mkdirSync(dirname(join(root, name)), {recursive: true});
    writeFileSync(join(root, name), contents);
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'b2c-mcp-project-'));
    write('cartridges/app_storefront_base/.project');
    write(
      'cartridges/app_storefront_base/cartridge/controllers/Account.js',
      [
        "var server = require('server');",
        "var csrfProtection = require('*/cartridge/scripts/middleware/csrf');",
        "server.post('Save', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) { next(); });",
        "server.post('Subscribe', function (req, res, next) { next(); });",
        'module.exports = server.exports();',
      ].join('\n'),
    );
    write(
      'cartridges/app_storefront_base/cartridge/scripts/middleware/csrf.js',
      'exports.validateAjaxRequest = function () {};',
    );
    write('cartridges/app_custom/.project');
    write(
      'cartridges/app_custom/cartridge/controllers/Account.js',
      [
        "var server = require('server');",
        'server.extend(module.superModule);',
        "server.replace('Save', function (req, res, next) { next(); });",
        'module.exports = server.exports();',
      ].join('\n'),
    );
    write('cartridges/app_custom/package.json', JSON.stringify({hooks: './hooks.json'}));
    write(
      'cartridges/app_custom/hooks.json',
      JSON.stringify({hooks: [{name: 'dw.ocapi.shop.basket.afterPOST', script: './cartridge/scripts/basket'}]}),
    );
    write('cartridges/app_custom/cartridge/scripts/basket.js', 'exports.afterPOST = function () { return 1; };');
    write(
      'cartridges/app_custom/cartridge/scripts/util.js',
      'module.exports = function (code) { return eval(code); };',
    );
    write(
      'site_template/ocapi-settings/wapi_data_config.json',
      JSON.stringify({
        clients: [
          {client_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', resources: [{resource_id: '/customers', methods: ['post']}]},
        ],
      }),
    );
  });

  afterEach(() => rmSync(root, {recursive: true, force: true}));

  it('are closed-world reads in the CARTRIDGES and STOREFRONTNEXT toolsets with project context', () => {
    for (const tool of [inspect, scan]) {
      expect(tool).to.include({effect: 'read', idempotent: true, openWorld: false});
      expect(tool.toolsets).to.deep.equal(['CARTRIDGES', 'STOREFRONTNEXT']);
      expect(tool.inputSchema).to.have.property('projectDirectory');
    }
  });

  describe('project_inspect', () => {
    it('summarizes the cartridge path from configuration and counts issues', async () => {
      const out = json(await inspect.handler({}));
      expect(out.cartridgePath).to.deep.equal(['app_custom', 'app_storefront_base']);
      expect(out.cartridgePathSource).to.deep.equal({source: 'configured'});
      expect(out.counts).to.deep.include({endpoints: 2, hookRegistrations: 1});
      expect(out.withIssues).to.deep.include({endpoints: 2, hooks: 1});
    });

    it('lists the aspects it can return in the summary', async () => {
      const out = json(await inspect.handler({}));
      expect(out.aspects).to.have.keys('endpoints', 'endpoint', 'hooks', 'customApis', 'jobSteps');
    });

    it('lists endpoints compactly with the cartridges that build each and their middleware', async () => {
      const all = json(await inspect.handler({aspect: 'endpoints'}));
      expect(all.endpoints.map((e: {id: string}) => e.id)).to.deep.equal(['Account-Save', 'Account-Subscribe']);
      expect(all.endpoints[0]).to.deep.include({
        at: 'cartridges/app_custom/cartridge/controllers/Account.js:3',
        cartridges: ['app_storefront_base', 'app_custom'],
      });
      expect(all.endpoints[0]).to.not.have.any.keys('csrf', 'https', 'loginRequired', 'issues');
      expect(all.next).to.include('endpoint');
      expect(json(await inspect.handler({aspect: 'endpoints', filter: 'subscribe'})).total).to.equal(1);
      expect(json(await inspect.handler({aspect: 'endpoints', cartridge: 'app_custom'})).total).to.equal(1);
      expect(json(await inspect.handler({aspect: 'endpoints', uses: 'csrf'})).total).to.equal(0);
    });

    it('returns the composed chain and history for one endpoint', async () => {
      const {endpoint} = json(await inspect.handler({aspect: 'endpoint', id: 'account-save'}));
      expect(endpoint.id).to.equal('Account-Save');
      expect(
        endpoint.steps.map((s: {method: string; cartridge: string}) => `${s.method}:${s.cartridge}`),
      ).to.deep.equal(['post:app_storefront_base', 'replace:app_custom']);
      expect(endpoint.steps[1].dropped).to.deep.equal(['POST-only restriction', 'HTTPS requirement', 'CSRF check']);
      expect(endpoint.issues[0]).to.include('dropped');
    });

    it('requires id for the endpoint aspect and suggests similar IDs for unknown ones', async () => {
      expect(errorText(await inspect.handler({aspect: 'endpoint'}))).to.include('requires id');
      expect(errorText(await inspect.handler({aspect: 'endpoint', id: 'Account-Nope'}))).to.include(
        'Similar: Account-Save',
      );
    });

    it('returns hook chains with semantics and issues', async () => {
      const out = json(await inspect.handler({aspect: 'hooks'}));
      expect(out.semantics.system).to.include('cartridge path order');
      expect(out.hooks[0]).to.include({name: 'dw.ocapi.shop.basket.afterPOST', kind: 'system'});
      expect(out.hooks[0].registrations[0]).to.include({returnsValue: 'yes'});
      expect(out.hooks[0].registrations[0].issue).to.include('basket calculation');
    });
  });

  describe('security_scan', () => {
    it('returns open findings sorted by severity with a summary', async () => {
      const out = json(await scan.handler({}));
      const rules = out.findings.map((f: {ruleId: string}) => f.ruleId);
      expect(rules).to.include.members([
        'ocapi-demo-client-id',
        'dynamic-code',
        'sfra-replace-drops-middleware',
        'sfra-post-without-csrf',
      ]);
      expect(out.summary.open).to.equal(out.findings.length);
      expect(out.summary.inReferenceCartridges).to.be.greaterThan(0);
      expect(out.findings[0].severity).to.equal('high');
      expect(out.findings.find((f: {ruleId: string}) => f.ruleId === 'ocapi-demo-client-id').at).to.match(
        /^site_template\/ocapi-settings\/wapi_data_config\.json:\d+:\d+$/,
      );
    });

    it('limits findings and reports truncation, and honors filters', async () => {
      const limited = json(await scan.handler({maxFindings: 1}));
      expect(limited.findings).to.have.length(1);
      expect(limited.truncated).to.be.greaterThan(0);
      const only = json(await scan.handler({rules: ['dynamic-code'], paths: ['cartridges/app_custom']}));
      expect(only.findings.map((f: {ruleId: string}) => f.ruleId)).to.deep.equal(['dynamic-code']);
    });

    it('applies the project baseline', async () => {
      const first = json(await scan.handler({rules: ['dynamic-code']}));
      expect(first.summary.open).to.equal(1);
      const {createBaseline, scanSecurity} = await import('@salesforce/b2c-tooling-sdk/security');
      write(
        '.b2c-security-baseline.json',
        JSON.stringify(createBaseline(scanSecurity({root, rules: ['dynamic-code']}).findings)),
      );
      const second = json(await scan.handler({rules: ['dynamic-code'], includeSuppressed: true}));
      expect(second.summary).to.include({open: 0, baselined: 1, baselineFile: '.b2c-security-baseline.json'});
      expect(second.findings[0].baselined).to.equal(true);
    });

    it('rejects paths outside the project directory', async () => {
      expect(errorText(await scan.handler({paths: ['../']}))).to.include('outside the project directory');
      expect(errorText(await scan.handler({paths: ['missing']}))).to.include('Path not found');
    });
  });

  describe('cartridge path from the instance', () => {
    const sites: Record<string, string> = {
      Other: 'app_unrelated:app_storefront_base',
      RefArch: 'app_storefront_base:app_custom',
      'Sites-Site': 'app_custom:app_storefront_base',
    };
    let calls: string[];
    const backend: SitesBackendFactory = () => ({
      async getCartridgePath(siteId: string) {
        calls.push(`get:${siteId}`);
        if (!(siteId in sites)) throw new Error(`Site ${siteId} not found`);
        return sites[siteId];
      },
      async listSites() {
        calls.push('list');
        return Object.entries(sites).map(([id, cartridges]) => ({id, displayName: id, cartridges}));
      },
    });
    const instance = (scapi = true) =>
      ({
        config: {hostname: 'my-sandbox.example.com'},
        scapiClientConfig: scapi ? {shortCode: 'abc', tenantId: 'zzzz_001', auth: {}} : undefined,
      }) as unknown as B2CInstance;
    const servicesWith = (values: Record<string, unknown>, b2cInstance?: B2CInstance) => () =>
      new Services({b2cInstance, resolvedConfig: createMockResolvedConfig({projectDirectory: root, ...values})});

    beforeEach(() => {
      calls = [];
    });

    it('reads the best-matching site from the instance when no cartridges are configured, and caches it', async () => {
      const resolver = new CartridgePathResolver(backend);
      const tool = createProjectInspectTool(servicesWith({}, instance()), resolver);
      const out = json(await tool.handler({}));
      expect(out.cartridgePath).to.deep.equal(['app_storefront_base', 'app_custom']);
      expect(out.cartridgePathSource).to.deep.include({
        source: 'instance',
        siteId: 'RefArch',
        hostname: 'my-sandbox.example.com',
      });
      expect(out.cartridgePathHint).to.include('Pass siteId');
      await tool.handler({aspect: 'endpoints'});
      expect(calls).to.deep.equal(['list']);
    });

    it('reads the siteId argument live, overriding configured cartridges, in every aspect', async () => {
      const resolver = new CartridgePathResolver(backend);
      const tool = createProjectInspectTool(
        servicesWith({cartridges: ['app_custom', 'app_storefront_base']}, instance()),
        resolver,
      );
      const out = json(await tool.handler({aspect: 'endpoint', id: 'Account-Save', siteId: 'RefArch'}));
      expect(out.cartridgePathSource).to.deep.include({source: 'instance', siteId: 'RefArch'});
      expect(out.cartridgePath).to.deep.equal(['app_storefront_base', 'app_custom']);
      // With app_custom after the base cartridge on the site's path, its replace never applies.
      expect(out.endpoint.steps.map((s: {cartridge: string}) => s.cartridge)).to.deep.equal(['app_storefront_base']);
      await tool.handler({aspect: 'hooks', siteId: 'RefArch'});
      expect(calls).to.deep.equal(['get:RefArch']);
    });

    it('lists local cartridges the site path leaves out, with a hint', async () => {
      const tool = createProjectInspectTool(servicesWith({}, instance()), new CartridgePathResolver(backend));
      const out = json(await tool.handler({siteId: 'Other'}));
      expect(out.cartridgePathSource).to.deep.include({source: 'instance', siteId: 'Other', notOnPath: ['app_custom']});
      expect(out.cartridgePathHint).to.include('1 local cartridge is not on this cartridge path');
    });

    it('leaves cartridges off the site path out of the index and explains missing endpoints', async () => {
      const tool = createProjectInspectTool(servicesWith({}, instance()), new CartridgePathResolver(backend));
      const list = json(await tool.handler({aspect: 'hooks', siteId: 'Other'}));
      expect(list.hooks).to.deep.equal([]);
      // The base still serves Account-Save; app_custom's replace isn't on Other's path.
      const save = json(await tool.handler({aspect: 'endpoint', id: 'Account-Save', siteId: 'Other'}));
      expect(save.endpoint.steps.map((s: {cartridge: string}) => s.cartridge)).to.deep.equal(['app_storefront_base']);
      write(
        'cartridges/app_custom/cartridge/controllers/Wishlist.js',
        "var server = require('server');\nserver.get('Show', function (req, res, next) { next(); });\nmodule.exports = server.exports();",
      );
      const off = errorText(await tool.handler({aspect: 'endpoint', id: 'Wishlist-Show', siteId: 'Other'}));
      expect(off).to.include('only defined in app_custom, which is not on the cartridge path');
      const all = json(
        await tool.handler({aspect: 'endpoint', id: 'Wishlist-Show', siteId: 'Other', allCartridges: true}),
      );
      expect(all.endpoint.cartridge).to.equal('app_custom');
      // Local cartridges only; with allCartridges, off-path ones come after the site's path.
      expect(save.cartridgePath).to.deep.equal(['app_storefront_base']);
      expect(all.cartridgePath).to.deep.equal(['app_storefront_base', 'app_custom']);
      expect(all.cartridgePathSource).to.include({allCartridges: true});
      expect(all.cartridgePathHint).to.include('are included after it');
    });

    it('uses configured cartridges without an instance lookup unless siteId is given', async () => {
      const resolver = new CartridgePathResolver(backend);
      const tool = createProjectInspectTool(
        servicesWith({cartridges: ['app_custom', 'app_storefront_base']}, instance()),
        resolver,
      );
      const out = json(await tool.handler({aspect: 'hooks'}));
      expect(out.cartridgePathSource).to.deep.equal({source: 'configured'});
      expect(calls).to.deep.equal([]);
    });

    it('falls back and reports why when the lookup fails, without caching the failure', async () => {
      const resolver = new CartridgePathResolver(backend);
      const tool = createSecurityScanTool(servicesWith({}, instance()), resolver);
      const out = json(await tool.handler({siteId: 'Missing'}));
      expect(out.cartridgePathSource.source).to.equal('discovery');
      expect(out.cartridgePathSource.instanceError).to.include('Site Missing not found');
      expect(out.cartridgePathHint).to.include('Guessed order');
      await tool.handler({siteId: 'Missing'});
      expect(calls).to.deep.equal(['get:Missing', 'get:Missing']);
    });

    it('never reads the instance without SCAPI system credentials, and says so for siteId', async () => {
      const resolver = new CartridgePathResolver(backend);
      const tool = createProjectInspectTool(servicesWith({}, instance(false)), resolver);
      const out = json(await tool.handler({siteId: 'RefArch'}));
      expect(calls).to.deep.equal([]);
      expect(out.cartridgePathSource.instanceError).to.include('needs SCAPI');
      expect(out.cartridgePathHint).to.include('Set cartridges in dw.json');
    });

    it('reports the site import file and points at siteId when the instance is available', async () => {
      write(
        'site_template/sites/RefArch/site.xml',
        '<site><custom-cartridges>app_custom:app_storefront_base</custom-cartridges></site>',
      );
      const tool = createProjectInspectTool(servicesWith({}), new CartridgePathResolver(backend));
      const out = json(await tool.handler({aspect: 'hooks'}));
      expect(out.cartridgePathSource).to.deep.include({source: 'site-file', siteId: 'RefArch'});
      expect(out.cartridgePathHint).to.include('not the instance');
    });
  });
});
