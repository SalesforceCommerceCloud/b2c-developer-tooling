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
      resolvedConfig: createMockResolvedConfig({shortCode: 'test-shortcode', tenantId: 'abcd_prd'}),
    });

    mockGet = stub().resolves({data: {data: []}, error: undefined, response: {status: 200}});
    const mockClient = {GET: mockGet} as unknown as MetricsClient;
    stub(services, 'getMetricsClient').returns(mockClient);
    stub(services, 'getTenantId').returns('abcd_prd');
  });

  afterEach(() => {
    restore();
  });

  it('creates tool with correct metadata (SCAPI toolset, non-GA, from/to/window schema)', () => {
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

  it('derives an explicit 24h window forward when only from is given', async () => {
    const tool = createMetricsGetTool(() => services);
    // 7d ago is within retention; from + 24h is still before now, so a full 24h
    // window is sent — both bounds explicit, never relying on the server default.
    const result = await tool.handler({category: 'overall', from: '7d'});
    const {parsed} = parseResultContent(result);

    const callArgs = mockGet.firstCall.args[1] as {params: {query: {from: number; to: number}}};
    const {from, to} = callArgs.params.query;
    expect(from).to.be.a('number');
    expect(to).to.be.a('number');
    expect(to - from).to.equal(24 * 60 * 60);
    expect((parsed?.query as Record<string, unknown>).defaultedWindow).to.equal(true);
  });

  it('defaults to the last 24h when no bounds are given', async () => {
    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'sales'});
    const {parsed} = parseResultContent(result);

    const callArgs = mockGet.firstCall.args[1] as {params: {query: {from: number; to: number}}};
    const {from, to} = callArgs.params.query;
    expect(from).to.be.a('number');
    expect(to).to.be.a('number');
    expect(to - from).to.equal(24 * 60 * 60);
    expect((parsed?.query as Record<string, unknown>).defaultedWindow).to.equal(true);
  });

  it('rejects over-specification (from + to + window) without calling the API', async () => {
    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'scapi', from: '2d', to: '1d', window: '1h'});
    const {isError, raw} = parseResultContent(result);

    expect(isError).to.equal(true);
    expect(raw).to.match(/at most two/);
    expect(mockGet.called).to.equal(false);
  });

  it('enriches each series with a tags object (always-on for this machine consumer)', async () => {
    mockGet.resolves({
      data: {
        data: [
          {
            metricId: 'cacheHitRate',
            title: 'Cache Hit Statistics',
            description: '',
            unit: '',
            dataSeries: [{id: 'abcd.product HIT', name: 'abcd.product HIT', data: [{timestamp: 1, value: 1}]}],
          },
        ],
      },
      error: undefined,
      response: {status: 200},
    });

    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'scapi', window: '1h'});
    const {parsed} = parseResultContent(result);

    const data = parsed?.data as Array<{dataSeries: Array<{tags?: Record<string, string>}>}>;
    expect(data[0].dataSeries[0].tags).to.deep.equal({
      realm: 'abcd',
      environment: 'prd',
      apiFamily: 'product',
      cacheStatus: 'HIT',
    });
  });

  it('folds an applied apiFamily filter into the tags authoritatively', async () => {
    mockGet.resolves({
      data: {
        data: [
          {
            metricId: 'totalCalls',
            title: 'Total Calls',
            description: '',
            unit: '',
            dataSeries: [{id: 'abcd.shopper.auth.v1', name: 'abcd.shopper.auth.v1', data: [{timestamp: 1, value: 1}]}],
          },
        ],
      },
      error: undefined,
      response: {status: 200},
    });

    const tool = createMetricsGetTool(() => services);
    const result = await tool.handler({category: 'scapi', window: '1h', apiFamily: 'shopper'});
    const {parsed} = parseResultContent(result);

    const data = parsed?.data as Array<{dataSeries: Array<{tags?: Record<string, string>}>}>;
    // Heuristic alone would yield apiFamily="shopper.auth.v1"; the filter corrects it.
    expect(data[0].dataSeries[0].tags?.apiFamily).to.equal('shopper');
  });
});
