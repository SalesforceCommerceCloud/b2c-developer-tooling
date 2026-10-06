/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {stub, restore} from 'sinon';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';
import {loadLocalScapiSchemas} from '@salesforce/b2c-tooling-sdk/scapi';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createScapiCodeTools} from '../../../src/tools/scapi/scapi-code.js';
import {Services} from '../../../src/services.js';
import type {ToolResult} from '../../../src/utils/types.js';
import {createMockResolvedConfig} from '../../test-helpers.js';

function readJson(result: ToolResult): Record<string, unknown> {
  expect(result).not.to.have.property('structuredContent');
  expect(result.content).to.have.length(1);
  expect(result.content[0].type).to.equal('text');
  return JSON.parse((result.content[0] as {text: string}).text);
}

describe('SCAPI code tools', function () {
  this.timeout(10_000);

  it('exports an AM token without SCAPI config and still validates actual SCAPI requests', async () => {
    const config = createMockResolvedConfig({clientId: 'export-client', clientSecret: 'private-secret'});
    const token = stub(OAuthStrategy.prototype, 'getTokenResponse').resolves({
      accessToken: 'export-token',
      expires: new Date('2027-01-01'),
      scopes: ['roles'],
    });
    try {
      const [, execute] = createScapiCodeTools(() => Services.fromResolvedConfig(config));
      const exported = await execute.handler({skillRead: true, code: 'async () => auth.accountManager()'});
      expect(exported.isError).not.to.equal(true);
      expect(readJson(exported).result).to.have.property('accessToken', 'export-token');
      expect(token.calledOnce).to.equal(true);
      expect(JSON.stringify(readJson(exported))).not.to.include('private-secret');
      const missing = await execute.handler({skillRead: true, code: 'async () => scapi.request({})'});
      expect(missing.isError).to.equal(true);
      expect(readJson(missing).error).to.include('shortCode and tenantId');
    } finally {
      token.restore();
    }
  });

  it('attaches authentication help to token failures', async () => {
    const [, execute] = createScapiCodeTools(() => Services.fromResolvedConfig(createMockResolvedConfig({})));
    const result = await execute.handler({skillRead: true, code: 'async () => auth.slas()'});
    expect(result.isError).to.equal(true);
    expect(readJson(result)).to.have.property('error').that.includes('SCAPI_AUTH_SLAS');
    expect(readJson(result)).to.have.property('skillReferences').with.length(1);
    expect(readJson(result)).to.have.property('resolution');
  });

  it('requires skill acknowledgment before configuration or code execution on both tools', async () => {
    const load = stub().throws(new Error('Configuration must not load'));
    await Promise.all(
      createScapiCodeTools(load)
        .slice(0, 2)
        .flatMap((tool) =>
          [undefined, false].map(async (skillRead) => {
            const result = await tool.handler({
              code: 'async () => { throw new Error("PROGRAM_EXECUTED"); }',
              ...(skillRead === undefined ? {} : {skillRead}),
            });
            expect(result.isError, tool.name).to.equal(true);
            expect(readJson(result)).to.have.property('error').that.includes('SCAPI_SKILL_REQUIRED');
            expect(readJson(result)).to.have.property('error').that.includes('skill://mcp/b2c-mcp-scapi/SKILL.md');
          }),
        ),
    );
    expect(load.called).to.equal(false);
  });

  it('searches offline without resolving a project or credentials', async () => {
    const load = stub().throws(new Error('Configuration must not load'));
    const [search] = createScapiCodeTools(load);
    const result = await search.handler({
      skillRead: true,
      api: 'product/products/v1',
      code: 'async () => spec.paths["/product/products/v1/organizations/{organizationId}/products/{productId}"].put.operationId',
    });
    expect(result.isError).not.to.equal(true);
    expect(readJson(result)).to.deep.equal({result: 'createProduct'});
    expect(load.called).to.equal(false);
  });

  it('falls back to bundled contracts with a warning when live schemas are unavailable', async () => {
    const services = Services.fromResolvedConfig(createMockResolvedConfig({}));
    const [search] = createScapiCodeTools(() => services);
    const result = readJson(
      await search.handler({
        skillRead: true,
        schemas: 'live',
        api: 'product/products/v1',
        code: 'async () => spec.apis.map(a => a.id)',
      }),
    );
    expect(result.result).to.deep.equal(['product/products/v1']);
    expect(result.schemaSource).to.equal('bundled');
    expect(result.warnings).to.have.length(1);
    expect(String((result.warnings as string[])[0])).to.include('Live schemas unavailable');
  });

  it('does not fall back to bundled contracts for custom APIs', async () => {
    const services = Services.fromResolvedConfig(createMockResolvedConfig({}));
    const [search] = createScapiCodeTools(() => services);
    const result = await search.handler({
      skillRead: true,
      schemas: 'live',
      api: 'custom/widgets/v1',
      code: 'async () => 1',
    });
    expect(result.isError).to.equal(true);
    expect(readJson(result)).not.to.have.property('schemaSource');
  });

  it('saves the executed source on request and discovers it after server recreation', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'b2c-mcp-snippets-'));
    try {
      const config = createMockResolvedConfig({shortCode: 'test', tenantId: 'test_001'});
      const load = () => Services.fromResolvedConfig(config);
      const [, execute, save] = createScapiCodeTools(load, directory);
      const code = 'async (input) => ({value: input.value})';
      const completed = await execute.handler({skillRead: true, code, input: {value: 'transient-value'}});
      expect(completed.isError).not.to.equal(true);
      const executionId = readJson(completed).executionId;
      const metadata = {
        executionId,
        name: 'user/echo-value',
        description: 'Return a selected value.',
        effect: 'read',
        inputSchema: {type: 'object', properties: {value: {type: 'string'}}, required: ['value']},
      };
      const saved = await save.handler(metadata);
      expect(readJson(saved)).to.deep.equal({result: {name: 'user/echo-value', saved: true}});
      expect((await save.handler(metadata)).isError).to.equal(true);
      const [search, reexecute, resave] = createScapiCodeTools(load, directory);
      const described = readJson(
        await search.handler({skillRead: true, code: "async () => codemode.describe('user/echo-value')"}),
      ).result as {code: string};
      expect(described.code).to.equal(code);
      expect(described).not.to.have.property('input');
      const rerun = await reexecute.handler({
        skillRead: true,
        code: "async () => codemode.run('user/echo-value', {value: 'new-value'})",
      });
      expect(readJson(rerun).result).to.deep.equal({value: 'new-value'});
      expect(readJson(await resave.handler({...metadata, name: 'user/another'})).error).to.include(
        'SCAPI_EXECUTION_NOT_FOUND',
      );
    } finally {
      rmSync(directory, {recursive: true, force: true});
    }
  });

  it('keeps nested schema discovery within the result budget without indentation inflation', async () => {
    const [search] = createScapiCodeTools(stub());
    const response = await search.handler({
      skillRead: true,
      api: 'operation/jobs/v1',
      detail: 'full',
      code: `async () => Object.entries(spec.paths).flatMap(([path, methods]) =>
        Object.entries(methods).filter(([method]) => method === 'post' && path.endsWith('/executions'))
          .map(([method, op]) => ({path, method, ...op})))`,
    });
    expect(response.isError).not.to.equal(true);
    const data = readJson(response);
    expect(data.result).to.be.an('array').with.length(1);
    const text = (response.content[0] as {text: string}).text;
    expect(Buffer.byteLength(text)).to.be.lessThan(24_000);
    expect(Buffer.byteLength(JSON.stringify(data, null, 2))).to.be.greaterThan(24_000);
  });

  it('returns outlines by default and restores nested prose with detail full', async () => {
    const [search] = createScapiCodeTools(stub());
    const code = `async () => {
      const op = spec.paths['/checkout/shopper-baskets/v2/organizations/{organizationId}/baskets'].post;
      return {summary: op.summary, bytes: JSON.stringify(op).length, nested: JSON.stringify(op).includes('"example"')};
    }`;
    const run = async (detail?: 'full' | 'outline') =>
      readJson(await search.handler({skillRead: true, api: 'checkout/shopper-baskets/v2', code, detail})).result as {
        summary: string;
        bytes: number;
        nested: boolean;
      };
    const outline = await run();
    const full = await run('full');
    expect(outline.summary).to.be.a('string').that.is.not.empty;
    expect(outline.summary).to.equal(full.summary);
    expect(outline.bytes).to.be.lessThan(full.bytes);
    expect(await run('outline')).to.deep.equal(outline);
  });

  it('uses fresh per-call configuration and preserves resolution on success and failure', async () => {
    const config = createMockResolvedConfig({
      shortCode: 'test',
      tenantId: 'test_001',
      siteId: 'test-site',
      safety: {level: 'READ_ONLY', rules: [{method: 'PUT', path: '*', action: 'block'}]},
    });
    const authorize = stub().throws(new Error('Blocked requests must not authenticate'));
    config.createOAuth = () => ({fetch, getAuthorizationHeader: authorize});
    const services = new Services({resolvedConfig: config});
    const load = stub().returns(services);
    const [, execute] = createScapiCodeTools(load);
    const result = await execute.handler({
      skillRead: true,
      projectDirectory: process.cwd(),
      code: 'async () => ({organizationId, siteId})',
    });
    expect(result.isError).not.to.equal(true);
    expect(readJson(result)).to.deep.include({
      result: {organizationId: 'f_ecom_test_001', siteId: 'test-site'},
    });
    expect(readJson(result)).to.have.property('resolution');
    expect(load.firstCall.args[0]).to.have.property('projectDirectory', process.cwd());
    const blocked = await execute.handler({
      skillRead: true,
      code: `async () => scapi.request({
      method:'PUT',path:'/product/products/v1/organizations/{organizationId}/products/test',body:{id:'test'}
    })`,
    });
    expect(blocked.isError).to.equal(true);
    expect(readJson(blocked)).to.have.property('resolution');
    expect(readJson(blocked))
      .to.have.property('error')
      .that.matches(/blocked/i);
    expect(authorize.called).to.equal(false);
    expect(load.callCount).to.equal(2);
  });

  it('searches live tenant contracts and executes them for the same tenant', async () => {
    const widgets = {
      openapi: '3.0.3',
      info: {version: '1.2.0'},
      security: [{AmOAuth2: ['sfcc.widgets']}],
      paths: {
        '/organizations/{organizationId}/widgets/{widgetId}': {
          get: {
            operationId: 'getWidget',
            parameters: [{name: 'widgetId', in: 'path', required: true, schema: {type: 'string'}}],
            responses: {'200': {content: {'application/json': {schema: {properties: {c_color: {type: 'string'}}}}}}},
          },
        },
      },
    };
    const get = stub().callsFake(async (path: string, options: {params: {path: Record<string, string>}}) => {
      if (path === '/organizations/{organizationId}/schemas')
        return {
          data: {
            data: [
              {apiFamily: 'product', apiName: 'widgets', apiVersion: 'v1', status: 'current'},
              {apiFamily: 'product', apiName: 'broken', apiVersion: 'v1', status: 'current'},
            ],
          },
          response: new Response(),
        };
      if (options.params.path.apiName === 'broken') return {error: {}, response: new Response(null, {status: 500})};
      return {data: widgets, response: new Response()};
    });
    const config = createMockResolvedConfig({shortCode: 'test', tenantId: 'test_001'});
    const requested: string[] = [];
    stub(globalThis, 'fetch').callsFake(async (input) => {
      requested.push((input as Request).url);
      return Response.json({id: 'w1', c_color: 'blue'});
    });
    config.createOAuth = () => ({fetch: globalThis.fetch, getAuthorizationHeader: async () => 'Bearer test'});
    const services = new Services({resolvedConfig: config});
    stub(services, 'getScapiSchemasClient').returns({GET: get} as never);
    try {
      const code = `async () => scapi.request({method: 'GET', path: '/product/widgets/v1/organizations/{organizationId}/widgets/w1'})`;
      const [, offline] = createScapiCodeTools(() => services);
      expect(readJson(await offline.handler({skillRead: true, code})).error).to.include('SCAPI_OPERATION_NOT_FOUND');

      const [search, execute] = createScapiCodeTools(() => services);
      const found = readJson(
        await search.handler({
          skillRead: true,
          schemas: 'live',
          code: `async () => ({apis: spec.apis.map(a => [a.id, a.origin]),
            color: spec.paths['/product/widgets/v1/organizations/{organizationId}/widgets/{widgetId}'].get
              .responses['200'].content['application/json'].schema.properties.c_color.type})`,
        }),
      );
      expect(found.result).to.deep.equal({apis: [['product/widgets/v1', 'live']], color: 'string'});
      expect(found.schemaFailures).to.deep.equal([{api: 'product/broken/v1', error: 'HTTP 500'}]);
      expect(found).to.have.property('resolution');
      expect(found.schemaSource).to.equal('live');
      expect(get.getCalls().find((call) => call.args[1].params.query)?.args[1].params.query).to.deep.equal({
        expand: 'all',
      });

      const executed = await execute.handler({skillRead: true, code});
      expect(executed.isError).not.to.equal(true);
      expect(readJson(executed).result).to.deep.include({ok: true, data: {id: 'w1', c_color: 'blue'}});
      expect(requested).to.deep.equal([
        'https://test.api.commercecloud.salesforce.com/product/widgets/v1/organizations/f_ecom_test_001/widgets/w1',
      ]);

      // Cached contracts are reused without refetching.
      const calls = get.callCount;
      await search.handler({skillRead: true, schemas: 'live', api: 'product/widgets/v1', code: 'async () => 1'});
      expect(get.callCount).to.equal(calls);
      const refresh = await search.handler({skillRead: true, refresh: true, code: 'async () => 1'});
      expect(readJson(refresh).error).to.include('refresh requires schemas');
    } finally {
      restore();
    }
  });

  it('reports native JavaScript errors and accepts cancellation', async () => {
    const [search] = createScapiCodeTools(stub());
    const invalid = await search.handler({skillRead: true, code: 'async () => { const x: number = 1; return x; }'});
    expect(invalid.isError).to.equal(true);
    const controller = new AbortController();
    controller.abort();
    const cancelled = await search.handler({skillRead: true, code: 'async () => 1'}, {signal: controller.signal});
    expect(cancelled.isError).to.equal(true);
    expect(readJson(cancelled)).to.have.property('error').that.includes('CANCELLED');
  });

  it('filters Shopper operations offline and rejects an incompatible API filter', async () => {
    const load = stub().throws(new Error('Configuration must not load'));
    const [search] = createScapiCodeTools(load);
    const result = await search.handler({
      skillRead: true,
      authType: 'shopper',
      code: 'async () => Object.values(spec.paths).flatMap(Object.values).every(op => op.auth.types.includes("shopper"))',
    });
    expect(readJson(result)).to.deep.equal({result: true});
    const noMatch = await search.handler({
      skillRead: true,
      authType: 'shopper',
      api: 'product/products/v1',
      code: 'async () => spec.apis',
    });
    expect(noMatch.isError).to.equal(true);
    expect(readJson(noMatch)).to.have.property('error').that.includes('Omit authType');
    expect(load.called).to.equal(false);
  });

  it('runs Shopper APIs with a guest session shared across executions', async () => {
    const config = createMockResolvedConfig({
      shortCode: 'test',
      tenantId: 'test_001',
      siteId: 'RefArch',
      slasClientId: 'shopper-client',
      slasClientSecret: 'shopper-secret',
    });
    const createOAuth = stub().throws(new Error('Admin auth must not load'));
    config.createOAuth = createOAuth;
    const requested: string[] = [];
    stub(globalThis, 'fetch').callsFake(async (input) => {
      const request = input as Request;
      if (request.url.endsWith('/shopper/auth/v1/organizations/f_ecom_test_001/oauth2/token')) {
        requested.push(`token:${new URLSearchParams(await request.text()).get('channel_id')}`);
        return Response.json({
          access_token: 'guest-token',
          refresh_token: 'refresh',
          expires_in: 1800,
          token_type: 'BEARER',
          usid: 'usid-1',
          customer_id: 'guest',
        });
      }
      requested.push(`${request.headers.get('authorization')} ${new URL(request.url).searchParams.get('siteId')}`);
      return Response.json({id: 'p1'});
    });
    try {
      const [, execute] = createScapiCodeTools(() => new Services({resolvedConfig: config}));
      const code = `async () => (await scapi.request({method: 'GET', path: '/product/shopper-products/v1/organizations/{organizationId}/products/p1'})).data`;
      expect(readJson(await execute.handler({skillRead: true, code}))).to.deep.include({result: {id: 'p1'}});
      await execute.handler({skillRead: true, code});
      expect(requested).to.deep.equal(['token:RefArch', 'Bearer guest-token RefArch', 'Bearer guest-token RefArch']);
      expect(createOAuth.called).to.equal(false);
    } finally {
      restore();
    }
  });

  it('returns an authentication skill reference and resolution for missing Admin or Shopper config', async () => {
    const config = createMockResolvedConfig({shortCode: 'test', tenantId: 'test_001', siteId: 'RefArch'});
    const createOAuth = stub().throws(new Error('OAuth requires clientId'));
    config.createOAuth = createOAuth;
    const [, execute] = createScapiCodeTools(() => new Services({resolvedConfig: config}));
    const shopper = await execute.handler({
      skillRead: true,
      code: 'async () => scapi.request({method:"GET",path:"/product/shopper-products/v1/organizations/{organizationId}/products/test"})',
    });
    expect(shopper.isError).to.equal(true);
    expect(readJson(shopper)).to.have.property('error').that.includes('SCAPI_SHOPPER_CONFIG_MISSING');
    expect(readJson(shopper))
      .to.have.property('skillReferences')
      .that.deep.equals([{uri: 'skill://mcp/b2c-mcp-scapi/SKILL.md', section: 'authentication'}]);
    expect(readJson(shopper)).to.have.property('resolution');
    expect(createOAuth.called).to.equal(false);
    const admin = await execute.handler({
      skillRead: true,
      code: 'async () => scapi.request({method:"GET",path:"/product/products/v1/organizations/{organizationId}/products/test"})',
    });
    expect(admin.isError).to.equal(true);
    expect(readJson(admin)).to.have.property('error').that.includes('SCAPI_ADMIN_CONFIG_MISSING');
    expect(readJson(admin)).to.have.property('resolution');
    expect(createOAuth.calledOnce).to.equal(true);
  });

  describe('project safety configuration', function () {
    this.timeout(10_000);
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), 'scapi-safety-'));
      mkdirSync(join(root, 'b2c'));
      stub(process, 'env').value({
        ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('SFCC_SAFETY_'))),
        B2C_CONFIG_DIR: root,
      });
    });

    afterEach(() => {
      restore();
      rmSync(root, {recursive: true, force: true});
    });

    function fixture(projectEnvironment: Record<string, string> = {}, safety?: {level: 'NO_DELETE' | 'READ_ONLY'}) {
      const config = createMockResolvedConfig({
        shortCode: 'test',
        tenantId: 'test_001',
        projectDirectory: root,
        safety,
      });
      const authenticate = stub().throws(new Error('AUTH_FACTORY_REACHED'));
      config.createOAuth = authenticate;
      return {services: new Services({resolvedConfig: config, projectEnvironment}), authenticate};
    }

    const input = {
      skillRead: true,
      code: `async () => scapi.request({method:'PUT',path:'/product/products/v1/organizations/{organizationId}/products/test',body:{id:'test'}})`,
    };

    it('applies project level/confirmation and does not leak them into the next project', async () => {
      const first = fixture({SFCC_SAFETY_LEVEL: 'READ_ONLY', SFCC_SAFETY_CONFIRM: 'true'});
      const second = fixture();
      const load = stub().onFirstCall().returns(first.services).onSecondCall().returns(second.services);
      const [, execute] = createScapiCodeTools(load);
      expect(readJson(await execute.handler(input)).error).to.include('Confirmation required');
      expect(first.authenticate.called).to.equal(false);
      expect(readJson(await execute.handler(input)).error).to.include('AUTH_FACTORY_REACHED');
      expect(second.authenticate.calledOnce).to.equal(true);
      expect(process.env.SFCC_SAFETY_LEVEL).to.equal(undefined);
    });

    it('resolves a relative project safety file and gives launch environment precedence', async () => {
      writeFileSync(join(root, 'project-safety.json'), JSON.stringify({level: 'READ_ONLY'}));
      const current = fixture({SFCC_SAFETY_CONFIG: './project-safety.json'});
      const [, execute] = createScapiCodeTools(() => current.services);
      expect(readJson(await execute.handler(input)).error).to.include('blocked');
      expect(current.authenticate.called).to.equal(false);
      const launchFile = join(root, 'launch-safety.json');
      writeFileSync(launchFile, JSON.stringify({level: 'NONE'}));
      process.env.SFCC_SAFETY_CONFIG = launchFile;
      expect(readJson(await execute.handler(input)).error).to.include('AUTH_FACTORY_REACHED');
      process.env.SFCC_SAFETY_LEVEL = 'READ_ONLY';
      expect(readJson(await execute.handler(input)).error).to.include('blocked');
      expect(current.authenticate.callCount).to.equal(1);
    });

    it('merges global, instance and effective environment levels restrictively', async () => {
      writeFileSync(join(root, 'b2c', 'safety.json'), JSON.stringify({level: 'READ_ONLY'}));
      process.env.SFCC_SAFETY_LEVEL = 'NONE';
      const current = fixture({SFCC_SAFETY_LEVEL: 'NO_DELETE'}, {level: 'NO_DELETE'});
      const [, execute] = createScapiCodeTools(() => current.services);
      expect(readJson(await execute.handler(input)).error).to.include('blocked');
      expect(current.authenticate.called).to.equal(false);
      writeFileSync(join(root, 'b2c', 'safety.json'), JSON.stringify({level: 'NONE'}));
      const restricted = fixture({SFCC_SAFETY_LEVEL: 'NONE'}, {level: 'READ_ONLY'});
      expect(readJson(await createScapiCodeTools(() => restricted.services)[1].handler(input)).error).to.include(
        'blocked',
      );
      expect(restricted.authenticate.called).to.equal(false);
    });
  });

  it('lets local contracts replace bundled and live ones in search and execution', async () => {
    const operation = {get: {operationId: 'getZoneInsights', responses: {'200': {description: 'OK'}}}};
    const contract = (api: string, path: string) => ({
      openapi: '3.0.3',
      info: {version: '1.0.0-beta'},
      servers: [{url: `https://{shortCode}.api.commercecloud.salesforce.com/${api}`}],
      security: [{AmOAuth2: ['sfcc.cdn-zones']}],
      paths: {[path]: operation},
    });
    const directory = mkdtempSync(join(tmpdir(), 'b2c-local-scapi-'));
    writeFileSync(
      join(directory, 'zones.json'),
      JSON.stringify(contract('cdn/zones/v1', '/organizations/{organizationId}/zones/{zoneId}/insights')),
    );
    const local = loadLocalScapiSchemas([directory]);
    const get = stub().callsFake(async (path: string) =>
      path === '/organizations/{organizationId}/schemas'
        ? {data: {data: [{apiFamily: 'cdn', apiName: 'zones', apiVersion: 'v1'}]}, response: new Response()}
        : {data: contract('cdn/zones/v1', '/organizations/{organizationId}/live-only'), response: new Response()},
    );
    const config = createMockResolvedConfig({shortCode: 'test', tenantId: 'test_001'});
    const requested: string[] = [];
    stub(globalThis, 'fetch').callsFake(async (input) => {
      requested.push((input as Request).url);
      return Response.json({ok: true});
    });
    config.createOAuth = () => ({fetch: globalThis.fetch, getAuthorizationHeader: async () => 'Bearer test'});
    const services = new Services({resolvedConfig: config});
    stub(services, 'getScapiSchemasClient').returns({GET: get} as never);
    try {
      const [search, execute] = createScapiCodeTools(() => services, undefined, undefined, undefined, undefined, local);
      const code = `async () => ({origin: spec.apis[0].origin, paths: Object.keys(spec.paths)})`;
      const expected = {
        origin: 'local',
        paths: ['/cdn/zones/v1/organizations/{organizationId}/zones/{zoneId}/insights'],
      };
      const found = await Promise.all(
        (['bundled', 'live'] as const).map(async (schemas) =>
          readJson(await search.handler({skillRead: true, schemas, api: 'cdn/zones/v1', code})),
        ),
      );
      expect(found.map((data) => data.result)).to.deep.equal([expected, expected]);
      const executed = await execute.handler({
        skillRead: true,
        code: `async () => scapi.request({method: 'GET', path: '/cdn/zones/v1/organizations/{organizationId}/zones/z1/insights'})`,
      });
      expect(readJson(executed).result).to.deep.include({ok: true});
      expect(requested).to.deep.equal([
        'https://test.api.commercecloud.salesforce.com/cdn/zones/v1/organizations/f_ecom_test_001/zones/z1/insights',
      ]);
    } finally {
      restore();
      rmSync(directory, {recursive: true, force: true});
    }
  });
});
