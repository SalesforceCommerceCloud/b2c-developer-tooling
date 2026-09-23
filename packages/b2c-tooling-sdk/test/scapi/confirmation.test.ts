/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {stub, restore} from 'sinon';
import {setTimeout as delay} from 'node:timers/promises';
import {
  createScapiRequest,
  loadScapiSchemas,
  runScapiCode,
  type ScapiConfirmation,
  type ScapiRuntimeControl,
} from '@salesforce/b2c-tooling-sdk/scapi';
import {MiddlewareRegistry} from '@salesforce/b2c-tooling-sdk/clients';

const path = '/product/products/v1/organizations/{organizationId}/products/test';

describe('SCAPI request approvals', () => {
  afterEach(() => restore());

  it('keeps approvals private to each request and detaches approved query/body from callers', async () => {
    const approvals: Array<{request: ScapiConfirmation; resolve: () => void}> = [];
    const sent: Request[] = [];
    const fetchStub = stub(globalThis, 'fetch').callsFake(async (input) => {
      sent.push(input as Request);
      return new Response('{}', {headers: {'content-type': 'application/json'}});
    });
    const authenticate = stub().returns({fetch: fetchStub, getAuthorizationHeader: async () => 'Bearer test'});
    const request = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      auth: authenticate,
      safety: {level: 'READ_ONLY', confirm: true},
      documents: loadScapiSchemas(),
      middlewareRegistry: new MiddlewareRegistry(),
      confirm: (request) => new Promise<void>((resolve) => approvals.push({request, resolve})),
    });
    const input = {method: 'PUT', path, query: {siteId: 'original'}, body: {id: 'original'}};
    const first = request(input, new AbortController().signal);
    const second = request(input, new AbortController().signal);
    expect(approvals).to.have.length(2);
    expect(authenticate.called).to.equal(false);
    input.body.id = 'changed';
    input.query.siteId = 'changed';
    approvals[0].request.body = {id: 'callback-mutation'};
    approvals[0].resolve();
    await first;
    expect(sent).to.have.length(1);
    expect(sent[0].url).to.include('siteId=original');
    expect(await sent[0].json()).to.deep.equal({id: 'original'});
    approvals[1].resolve();
    await second;
    expect(sent).to.have.length(2);
  });

  it('does not authenticate after an approved request was cancelled during its prompt', async () => {
    const controller = new AbortController();
    const authenticate = stub().throws(new Error('AUTH_MUST_NOT_LOAD'));
    const request = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      auth: authenticate,
      safety: {level: 'READ_ONLY', confirm: true},
      documents: loadScapiSchemas(),
      confirm: async () => {
        controller.abort(new Error('CANCELLED'));
      },
    });
    const result = await request({method: 'PUT', path, body: {}}, controller.signal).catch((error: Error) => error);
    expect(result).to.be.instanceOf(Error).with.property('message', 'CANCELLED');
    expect(authenticate.called).to.equal(false);
  });

  it('rejects middleware changes to an approved body before authentication or sending', async () => {
    const network = stub(globalThis, 'fetch').rejects(new Error('NETWORK_MUST_NOT_RUN'));
    const authorize = stub().resolves('Bearer test');
    const registry = new MiddlewareRegistry();
    registry.register({
      name: 'rewrite-body',
      getMiddleware: () => ({onRequest: ({request}) => new Request(request, {body: JSON.stringify({id: 'changed'})})}),
    });
    const request = createScapiRequest({
      shortCode: 'test',
      tenantId: 'test_001',
      auth: {fetch: network, getAuthorizationHeader: authorize},
      safety: {level: 'READ_ONLY', confirm: true},
      documents: loadScapiSchemas(),
      middlewareRegistry: registry,
      confirm: async () => {},
    });
    const result = await request({method: 'PUT', path, body: {id: 'approved'}}, new AbortController().signal).catch(
      (error: Error) => error,
    );
    expect(result).to.be.instanceOf(Error);
    expect((result as Error).message).to.include('SCAPI_APPROVAL_MISMATCH');
    expect(network.called).to.equal(false);
    expect(authorize.called).to.equal(false);
  });

  it('pauses only the runtime budget while preserving the same worker and cancellation', async function () {
    this.timeout(5000);
    let control: ScapiRuntimeControl;
    let announce!: () => void;
    const paused = new Promise<void>((resolve) => {
      announce = resolve;
    });
    let resume!: () => void;
    const approval = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const running = runScapiCode({
      code: 'async () => { const nonce = Math.random(); await scapi.request({}); return nonce; }',
      timeoutMs: 200,
      onControl: (value) => {
        control = value;
      },
      request: async () => {
        control.pauseTimeout();
        announce();
        await approval;
        control.resumeTimeout();
        return {};
      },
    });
    await paused;
    await delay(300);
    resume();
    expect(await running).to.be.a('number');
  });
});
