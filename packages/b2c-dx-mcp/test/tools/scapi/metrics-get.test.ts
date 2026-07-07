/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {stub, restore, type SinonStub} from 'sinon';
import {createMetricsGetTool} from '../../../src/tools/scapi/metrics-get.js';
import {Services} from '../../../src/services.js';
import {createMockResolvedConfig} from '../../test-helpers.js';
import type {MetricsClient} from '@salesforce/b2c-tooling-sdk/clients';

function parseResultContent(result: {content: Array<{type: string; text?: string}>; isError?: boolean}): {
  parsed: null | Record<string, unknown>;
  isError: boolean;
  raw?: string;
} {
  const first = result.content?.[0];
  const text = first && 'text' in first ? (first.text ?? '') : '';
  try {
    return {parsed: JSON.parse(text) as Record<string, unknown>, isError: result.isError ?? false};
  } catch {
    return {parsed: null, isError: result.isError ?? false, raw: text};
  }
}

describe('tools/scapi/metrics-get', () => {
  let services: Services;
  let mockGet: SinonStub;

  beforeEach(() => {
    services = new Services({
      resolvedConfig: createMockResolvedConfig({shortCode: 'test-shortcode', tenantId: 'test_tenant'}),
    });

    mockGet = stub().resolves({data: {data: []}, error: undefined, response: {status: 200}});
    const mockClient = {GET: mockGet} as unknown as MetricsClient;
    stub(services, 'getMetricsClient').returns(mockClient);
    stub(services, 'getTenantId').returns('test_tenant');
  });

  afterEach(() => {
    restore();
  });

  it('creates tool with correct metadata (SCAPI toolset, non-GA, since/until schema)', () => {
    const tool = createMetricsGetTool(() => services);

    expect(tool.name).to.equal('metrics_get');
    expect(tool.toolsets).to.deep.equal(['SCAPI']);
    expect(tool.isGA).to.equal(false);
    expect(tool.description).to.include('CLOSED BETA');
    expect(tool.description).to.include('sfcc.metrics');
    // Time bounds mirror the API's from/to params, plus a window helper.
    expect(tool.inputSchema).to.have.property('from');
    expect(tool.inputSchema).to.have.property('to');
    expect(tool.inputSchema).to.have.property('window');
    expect(tool.inputSchema).to.not.have.property('since');
    expect(tool.inputSchema).to.not.have.property('until');
  });

  it('sends epoch seconds on the wire and echoes the resolved bounds (from + window)', async () => {
    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'scapi', from: '7d', window: '1h'});
    const {parsed, isError} = parseResultContent(result);

    expect(isError).to.equal(false);
    expect(mockGet.calledOnce).to.equal(true);

    // The operation passes Date bounds; the client serializes to epoch seconds.
    const callArgs = mockGet.firstCall.args[1] as {params: {query: {from: number; to: number}}};
    const {from, to} = callArgs.params.query;
    expect(String(from)).to.have.length(10); // seconds (10 digits), not ms (13)
    expect(to - from).to.equal(3600); // 1h window derived from --from

    const query = parsed?.query as Record<string, unknown>;
    expect(query.category).to.equal('scapi');
    expect(query.fromEpochSeconds).to.equal(from);
    expect(query.toEpochSeconds).to.equal(to);
  });

  it('sends only from when only from is given (no invented to)', async () => {
    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'overall', from: '30d'});
    const {parsed} = parseResultContent(result);

    const callArgs = mockGet.firstCall.args[1] as {params: {query: Record<string, unknown>}};
    expect(callArgs.params.query).to.have.property('from');
    expect(callArgs.params.query.to).to.equal(undefined);
    expect((parsed?.query as Record<string, unknown>).to).to.equal(undefined);
  });

  it('sends no time bounds when none are given (API default window)', async () => {
    const tool = createMetricsGetTool(() => services);
    await tool.handler({category: 'sales'});

    const callArgs = mockGet.firstCall.args[1] as {params: {query: Record<string, unknown>}};
    expect(callArgs.params.query.from).to.equal(undefined);
    expect(callArgs.params.query.to).to.equal(undefined);
  });

  it('rejects over-specification (from + to + window) without calling the API', async () => {
    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'scapi', from: '2d', to: '1d', window: '1h'});
    const {isError, raw} = parseResultContent(result);

    expect(isError).to.equal(true);
    expect(raw).to.match(/at most two/);
    expect(mockGet.called).to.equal(false);
  });
});
