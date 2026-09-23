/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {stub, restore, useFakeTimers} from 'sinon';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {SafetyConfig} from '@salesforce/b2c-tooling-sdk/safety';
import type {InputRequiredResult} from '@modelcontextprotocol/server';
import {ScapiExecutionRegistry} from '../../../src/tools/scapi/execution-registry.js';
import {createScapiCodeTools} from '../../../src/tools/scapi/scapi-code.js';
import {Services} from '../../../src/services.js';
import type {ToolContext, ToolResult} from '../../../src/utils/types.js';
import {createMockResolvedConfig} from '../../test-helpers.js';

const prefix = '/product/products/v1/organizations/{organizationId}/products/';
const call = (id: string) => `scapi.request({method:'PUT',path:'${prefix}${id}',body:{id:'${id}'}})`;
const capable = {supportsElicitation: true};
function json(result: ToolResult) {
  return JSON.parse((result.content[0] as {text: string}).text);
}
function approve(prompt: ToolResult, decision?: unknown): ToolContext {
  const input = prompt as unknown as InputRequiredResult;
  expect(input.resultType).to.equal('input_required');
  return {
    ...capable,
    requestState: input.requestState,
    inputResponses: {[Object.keys(input.inputRequests!)[0]]: decision ?? {action: 'accept', content: {approve: true}}},
  };
}

describe('SCAPI retained confirmations', function () {
  this.timeout(10_000);
  let directory: string;
  let registries: ScapiExecutionRegistry[];
  let sent: Array<{path: string; body: unknown}>;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'scapi-confirm-'));
    stub(process, 'env').value({
      ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('SFCC_SAFETY_'))),
      B2C_CONFIG_DIR: directory,
    });
    registries = [];
    sent = [];
    stub(globalThis, 'fetch').callsFake(async (input) => {
      const request = input as Request;
      sent.push({path: new URL(request.url).pathname, body: JSON.parse(await request.text())});
      return new Response(JSON.stringify({id: sent.length}), {headers: {'content-type': 'application/json'}});
    });
  });

  afterEach(async () => {
    await Promise.all(registries.map((registry) => registry.destroyAll()));
    restore();
    rmSync(directory, {recursive: true, force: true});
  });

  function fixture(safety?: SafetyConfig, options: ConstructorParameters<typeof ScapiExecutionRegistry>[0] = {}) {
    const registry = new ScapiExecutionRegistry(options);
    registries.push(registry);
    const config = createMockResolvedConfig({
      shortCode: 'test',
      tenantId: 'test_001',
      safety: safety ?? {level: 'READ_ONLY', confirm: true},
    });
    const authenticate = stub().returns({fetch: globalThis.fetch, getAuthorizationHeader: async () => 'Bearer test'});
    config.createOAuth = authenticate;
    const load = stub().returns(Services.fromResolvedConfig(config));
    const [, execute] = createScapiCodeTools(load, directory, registry);
    return {execute, registry, load, authenticate};
  }

  it('resumes sequential writes without replay and coalesces duplicate approval retries', async () => {
    const {execute, authenticate, load} = fixture({
      level: 'READ_ONLY',
      confirm: true,
      rules: [{method: 'PUT', path: '**/first', action: 'allow'}],
    });
    const args = {
      skillRead: true,
      code: `async () => { const first = await ${call('first')}; const second = await ${call('second')}; return {first:first.data, second:second.data}; }`,
    };
    const prompt = await execute.handler(args, capable);
    expect(sent).to.have.length(1);
    expect(authenticate.callCount).to.equal(1);
    const context = approve(prompt);
    const [result, duplicate] = await Promise.all([execute.handler(args, context), execute.handler(args, context)]);
    expect(result).to.deep.equal(duplicate);
    expect(json(result).result).to.deep.equal({first: {id: 1}, second: {id: 2}});
    expect(sent).to.have.length(2);
    expect(load.callCount).to.equal(1);
    expect(await execute.handler(args, context)).to.deep.equal(result);
    expect(sent).to.have.length(2);
  });

  it('requires a separate approval for each parallel request and never shares exemptions', async () => {
    const {execute, authenticate} = fixture();
    const args = {skillRead: true, code: `async () => Promise.all([${call('same')}, ${call('same')}])`};
    const first = await execute.handler(args, capable);
    expect(authenticate.called).to.equal(false);
    const second = await execute.handler(args, approve(first));
    expect(sent).to.have.length(1);
    expect(second.requestState).not.to.equal(first.requestState);
    expect(await execute.handler(args, approve(first))).to.deep.equal(second);
    expect(sent).to.have.length(1);
    const result = await execute.handler(args, approve(second));
    expect(json(result).result).to.have.length(2);
    expect(sent).to.have.length(2);
  });

  for (const decision of [
    {action: 'decline'},
    {action: 'cancel'},
    {action: 'accept', content: {approve: false}},
    {action: 'accept', content: {approve: 'true'}},
  ]) {
    it(`terminates the worker for ${JSON.stringify(decision)} even if code catches errors`, async () => {
      const {execute, authenticate} = fixture({
        level: 'READ_ONLY',
        confirm: true,
        rules: [{method: 'PUT', path: '**/after', action: 'allow'}],
      });
      const args = {
        skillRead: true,
        code: `async () => { try { await ${call('pending')}; } catch {} return ${call('after')}; }`,
      };
      const prompt = await execute.handler(args, capable);
      const result = await execute.handler(args, approve(prompt, decision));
      expect(json(result).error).to.include('SCAPI_APPROVAL_DECLINED');
      expect(json(result).operations[0].status).to.equal('not_sent');
      expect(sent).to.have.length(0);
      expect(authenticate.called).to.equal(false);
      expect(await execute.handler(args, approve(prompt))).to.deep.equal(result);
    });
  }

  it('supports idempotent explicit cancellation without loading configuration', async () => {
    const {execute, load} = fixture();
    const args = {skillRead: true, code: `async () => ${call('pending')}`};
    const prompt = await execute.handler(args, capable);
    const cancel = {action: 'cancel', skillRead: true, executionId: prompt._meta!.executionId};
    const invalid = await execute.handler({...cancel, code: 'async () => 1'});
    expect(json(invalid).error).to.include('SCAPI_CANCEL_ARGUMENT_INVALID');
    const result = await execute.handler(cancel);
    expect(json(result).error).to.include('SCAPI_EXECUTION_CANCELLED');
    expect(await execute.handler(cancel)).to.deep.equal(result);
    expect(load.callCount).to.equal(1);
    expect(sent).to.have.length(0);
  });

  it('rejects changed arguments, forged state, and state from another server without starting code', async () => {
    const {execute, load} = fixture();
    const args = {skillRead: true, code: `async () => ${call('pending')}`, input: {value: 1}};
    const prompt = await execute.handler(args, capable);
    const context = approve(prompt);
    await Promise.all(
      [
        {...args, code: 'async () => 42'},
        {...args, input: {value: 2}},
        {...args, instanceName: 'other'},
      ].map(async (changed) => {
        expect(json(await execute.handler(changed, context)).error).to.include('SCAPI_CONTINUATION_MISMATCH');
      }),
    );
    expect(json(await execute.handler(args, {...context, requestState: context.requestState + 'x'})).error).to.include(
      'SCAPI_CONTINUATION_INVALID',
    );
    const other = fixture();
    expect(json(await other.execute.handler(args, context)).error).to.include('SCAPI_CONTINUATION_INVALID');
    expect(other.load.called).to.equal(false);
    expect(load.callCount).to.equal(1);
    expect(sent).to.have.length(0);
    expect(json(await execute.handler(args, context)).result).to.have.property('ok', true);
  });

  it('retains approvals for days without consuming runtime or replaying earlier writes', async () => {
    const {execute} = fixture({
      level: 'READ_ONLY',
      confirm: true,
      rules: [{method: 'PUT', path: '**/first', action: 'allow'}],
    });
    const args = {skillRead: true, code: `async () => { await ${call('first')}; return ${call('pending')}; }`};
    // Install before execution so any approval or lifetime timer would be captured.
    const clock = useFakeTimers({toFake: ['Date', 'setTimeout', 'clearTimeout']});
    let prompt: ToolResult;
    try {
      prompt = await execute.handler(args, capable);
      await clock.tickAsync(7 * 24 * 60 * 60 * 1000);
      expect(sent).to.have.length(1);
      expect(prompt._meta).not.to.have.property('expiresAt');
      expect(clock.countTimers()).to.equal(0);
    } finally {
      clock.restore();
    }
    const result = await execute.handler(args, approve(prompt));
    expect(json(result).status).to.equal('completed');
    expect(sent).to.have.length(2);
    expect(await execute.handler(args, approve(prompt))).to.deep.equal(result);
    expect(sent).to.have.length(2);
  });

  it('keeps hard blocks and unsupported clients closed before authentication', async () => {
    const args = {skillRead: true, code: `async () => ${call('pending')}`};
    const blocked = fixture({level: 'NONE', confirm: true, rules: [{method: 'PUT', action: 'block'}]});
    expect(json(await blocked.execute.handler(args, capable)).error).to.include('block');
    expect(blocked.authenticate.called).to.equal(false);
    const unsupported = fixture();
    expect(json(await unsupported.execute.handler(args)).error).to.include('SCAPI_CONFIRMATION_UNSUPPORTED');
    expect(unsupported.authenticate.called).to.equal(false);
    expect(sent).to.have.length(0);
  });

  it('bounds retained workers and releases them on shutdown', async () => {
    const {execute, registry} = fixture(undefined, {maxActive: 1});
    const args = {skillRead: true, code: `async () => ${call('pending')}`};
    const prompt = await execute.handler(args, capable);
    expect(json(await execute.handler(args, capable)).error).to.include('SCAPI_EXECUTION_LIMIT');
    await registry.destroyAll();
    expect(json(await execute.handler(args, approve(prompt))).error).to.include('SCAPI_CONTINUATION_INVALID');
    expect(sent).to.have.length(0);
  });

  it('distinguishes modern request completion from legacy cancellation during the prompt', async () => {
    const args = {skillRead: true, code: `async () => ${call('pending')}`};
    const modern = fixture();
    const modernSignal = new AbortController();
    const prompt = await modern.execute.handler(args, {...capable, signal: modernSignal.signal});
    modernSignal.abort();
    expect(json(await modern.execute.handler(args, approve(prompt))).status).to.equal('completed');
    const legacy = fixture();
    const legacySignal = new AbortController();
    const legacyPrompt = await legacy.execute.handler(args, {
      ...capable,
      signal: legacySignal.signal,
      keepCancellation: true,
    });
    legacySignal.abort();
    expect(json(await legacy.execute.handler(args, approve(legacyPrompt))).error).to.include(
      'SCAPI_EXECUTION_CANCELLED',
    );
    expect(sent).to.have.length(1);
  });
});
