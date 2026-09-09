/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {stub} from 'sinon';
import {createScapiCodeTools} from '../../../src/tools/scapi/scapi-code.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';

describe('SCAPI code tools', function () {
  this.timeout(10_000);

  it('requires skill acknowledgment before configuration or code execution on both tools', async () => {
    const load = stub().throws(new Error('Configuration must not load'));
    await Promise.all(
      createScapiCodeTools(load).flatMap((tool) =>
        [undefined, false].map(async (skillRead) => {
          const result = await tool.handler({
            code: 'async () => { throw new Error("PROGRAM_EXECUTED"); }',
            ...(skillRead === undefined ? {} : {skillRead}),
          });
          expect(result.isError, tool.name).to.equal(true);
          expect(result.structuredContent).to.have.property('error').that.includes('SCAPI_SKILL_REQUIRED');
          expect(result.structuredContent).to.have.property('error').that.includes('skill://mcp/scapi/SKILL.md');
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
    expect(result.structuredContent).to.deep.equal({result: 'createProduct'});
    expect(load.called).to.equal(false);
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
    expect(result.structuredContent).to.deep.include({
      result: {organizationId: 'f_ecom_test_001', siteId: 'test-site'},
    });
    expect(result.structuredContent).to.have.property('resolution');
    expect(load.firstCall.args[0]).to.have.property('projectDirectory', process.cwd());
    const blocked = await execute.handler({
      skillRead: true,
      code: `async () => scapi.request({
      method:'PUT',path:'/product/products/v1/organizations/{organizationId}/products/test',body:{id:'test'}
    })`,
    });
    expect(blocked.isError).to.equal(true);
    expect(blocked.structuredContent).to.have.property('resolution');
    expect(blocked.structuredContent)
      .to.have.property('error')
      .that.matches(/blocked/i);
    expect(authorize.called).to.equal(false);
    expect(load.callCount).to.equal(2);
  });

  it('reports native JavaScript errors and accepts cancellation', async () => {
    const [search] = createScapiCodeTools(stub());
    const invalid = await search.handler({skillRead: true, code: 'async () => { const x: number = 1; return x; }'});
    expect(invalid.isError).to.equal(true);
    const controller = new AbortController();
    controller.abort();
    const cancelled = await search.handler({skillRead: true, code: 'async () => 1'}, {signal: controller.signal});
    expect(cancelled.isError).to.equal(true);
    expect(cancelled.structuredContent).to.have.property('error').that.includes('CANCELLED');
  });

  it('filters Shopper operations offline and rejects an incompatible API filter', async () => {
    const load = stub().throws(new Error('Configuration must not load'));
    const [search] = createScapiCodeTools(load);
    const result = await search.handler({
      skillRead: true,
      authType: 'shopper',
      code: 'async () => Object.values(spec.paths).flatMap(Object.values).every(op => op.auth.types.includes("shopper"))',
    });
    expect(result.structuredContent).to.deep.equal({result: true});
    const noMatch = await search.handler({
      skillRead: true,
      authType: 'shopper',
      api: 'product/products/v1',
      code: 'async () => spec.apis',
    });
    expect(noMatch.isError).to.equal(true);
    expect(noMatch.structuredContent).to.have.property('error').that.includes('Omit authType');
    expect(load.called).to.equal(false);
  });

  it('returns an authentication skill reference and resolution for missing Admin config or unsupported Shopper auth', async () => {
    const config = createMockResolvedConfig({shortCode: 'test', tenantId: 'test_001'});
    const createOAuth = stub().throws(new Error('OAuth requires clientId'));
    config.createOAuth = createOAuth;
    const [, execute] = createScapiCodeTools(() => new Services({resolvedConfig: config}));
    const shopper = await execute.handler({
      skillRead: true,
      code: 'async () => scapi.request({method:"GET",path:"/product/shopper-products/v1/organizations/{organizationId}/products/test"})',
    });
    expect(shopper.isError).to.equal(true);
    expect(shopper.structuredContent).to.have.property('error').that.includes('SCAPI_SHOPPER_AUTH_UNSUPPORTED');
    expect(shopper.structuredContent)
      .to.have.property('skillReferences')
      .that.deep.equals([{uri: 'skill://mcp/scapi/SKILL.md', section: 'authentication'}]);
    expect(shopper.structuredContent).to.have.property('resolution');
    expect(createOAuth.called).to.equal(false);
    const admin = await execute.handler({
      skillRead: true,
      code: 'async () => scapi.request({method:"GET",path:"/product/products/v1/organizations/{organizationId}/products/test"})',
    });
    expect(admin.isError).to.equal(true);
    expect(admin.structuredContent).to.have.property('error').that.includes('SCAPI_ADMIN_CONFIG_MISSING');
    expect(admin.structuredContent).to.have.property('resolution');
    expect(createOAuth.calledOnce).to.equal(true);
  });
});
