/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {ux} from '@oclif/core';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import ProjectApis from '../../../src/commands/project/apis.js';
import ProjectEndpoint from '../../../src/commands/project/endpoint.js';
import ProjectEndpoints from '../../../src/commands/project/endpoints.js';
import ProjectHooks from '../../../src/commands/project/hooks.js';
import ProjectIndexCommand from '../../../src/commands/project/index/index.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('project', () => {
  const hooks = createIsolatedConfigHooks();
  let tmp: string;
  let cwd: string;
  let stdout: sinon.SinonStub;

  function write(name: string, contents = ''): void {
    const file = path.join(tmp, name);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, contents);
  }

  beforeEach(async () => {
    await hooks.beforeEach();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-project-cli-'));
    cwd = process.cwd();
    process.chdir(tmp);
    stdout = sinon.stub(ux, 'stdout');

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
    write(
      'cartridges/app_custom/cartridge/scripts/basket.js',
      "var Status = require('dw/system/Status');\nexports.afterPOST = function () { return new Status(Status.OK); };",
    );
    write(
      'cartridges/app_custom/cartridge/rest-apis/loyalty/api.json',
      JSON.stringify({endpoints: [{endpoint: 'getPoints', schema: 'schema.yaml', implementation: 'script'}]}),
    );
    write(
      'cartridges/app_custom/cartridge/rest-apis/loyalty/schema.yaml',
      'paths:\n  /points:\n    get:\n      operationId: getPoints\nsecurity:\n  - ShopperToken: [c_loyalty]\n',
    );
    write('cartridges/app_custom/cartridge/rest-apis/loyalty/script.js', 'exports.getPoints = function () {};');
  });

  afterEach(() => {
    process.chdir(cwd);
    hooks.afterEach();
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  async function run<T>(
    Command: any,
    flags: Record<string, unknown> = {},
    args: Record<string, unknown> = {},
    json = true,
  ): Promise<T> {
    const command: any = await createTestCommand(Command, hooks.getConfig(), flags, args);
    sinon.stub(command, 'jsonEnabled').returns(json);
    sinon.stub(command, 'log');
    command.resolvedConfig.values.cartridges = ['app_custom', 'app_storefront_base'];
    return command.run();
  }

  function output(): string {
    return stdout.args.map((a) => String(a[0])).join('\n');
  }

  it('index summarizes cartridges and can write the JSON', async () => {
    const index = await run<any>(ProjectIndexCommand, {output: 'index.json'}, {}, false);
    expect(index.cartridges.map((c: {name: string}) => c.name)).to.deep.equal(['app_custom', 'app_storefront_base']);
    expect(output()).to.include(
      '2 cartridge(s): 2 controller endpoint(s), 1 hook registration(s), 1 Custom API endpoint(s)',
    );
    expect(output()).to.include('Cartridge path: app_custom:app_storefront_base');
    expect(JSON.parse(fs.readFileSync(path.join(tmp, 'index.json'), 'utf8')).version).to.equal(1);
  });

  it('endpoints lists composed endpoints with issues and filters', async () => {
    const {endpoints} = await run<{endpoints: any[]}>(ProjectEndpoints);
    expect(endpoints.map((e) => e.id)).to.deep.equal(['Account-Save', 'Account-Subscribe']);
    const save = endpoints[0];
    expect(save).to.include({cartridge: 'app_custom', csrf: 'none'});
    expect(save.issues.join(' ')).to.include('dropped the POST-only restriction, HTTPS requirement, CSRF check');
    expect(save.file).to.equal(path.join('cartridges', 'app_custom', 'cartridge', 'controllers', 'Account.js') + ':3');

    const {endpoints: filtered} = await run<{endpoints: any[]}>(
      ProjectEndpoints,
      {issues: true},
      {filter: 'subscribe'},
    );
    expect(filtered.map((e) => e.id)).to.deep.equal(['Account-Subscribe']);
  });

  it('endpoint shows the chain and history, case-insensitively', async () => {
    const result = await run<any>(ProjectEndpoint, {}, {id: 'account-save'}, false);
    expect(result.endpoint.id).to.equal('Account-Save');
    expect(output()).to.include('Runs (in order):');
    expect(output()).to.match(/server\.post\s+app_storefront_base/);
    expect(output()).to.match(
      /server\.replace\s+app_custom.*dropped: POST-only restriction, HTTPS requirement, CSRF check/,
    );
  });

  it('endpoint errors with suggestions for an unknown ID', async () => {
    const command: any = await createTestCommand(ProjectEndpoint, hooks.getConfig(), {}, {id: 'Account-Nope'});
    sinon.stub(command, 'jsonEnabled').returns(true);
    const errorStub = sinon.stub(command, 'error').throws(new Error('not found'));
    try {
      await command.run();
    } catch {
      // expected
    }
    expect(errorStub.firstCall.args[0]).to.include('Endpoint "Account-Nope" not found.');
    expect(errorStub.firstCall.args[1].suggestions[0]).to.include('Account-Save');
  });

  it('hooks flags OCAPI hooks that return a value', async () => {
    const {hooks: chains} = await run<{hooks: any[]}>(ProjectHooks);
    expect(chains).to.have.length(1);
    expect(chains[0]).to.include({name: 'dw.ocapi.shop.basket.afterPOST', kind: 'system'});
    expect(chains[0].issue).to.include('can return a value');
    expect(chains[0].registrations[0].issue).to.include('basket calculation');
    expect(chains[0].semantics).to.include('cartridge path order');
  });

  it('apis joins api.json with the schema and implementation', async () => {
    const {apis} = await run<{apis: any[]}>(ProjectApis);
    expect(apis).to.have.length(1);
    expect(apis[0].endpoints[0]).to.deep.include({method: 'GET', path: '/points', apiType: 'shopper', public: false});
    expect(apis[0].endpoints[0].problems[0]).to.include('public = true is missing');
  });
});
