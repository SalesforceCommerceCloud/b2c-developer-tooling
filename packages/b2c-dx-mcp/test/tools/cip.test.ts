/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {createCipTools} from '../../src/tools/cip/index.js';
import {resolveCipClient} from '../../src/tools/cip/client.js';
import {Services} from '../../src/services.js';
import {createMockResolvedConfig} from '../test-helpers.js';
import type {ToolResult} from '../../src/utils/types.js';
import {
  globalMiddlewareRegistry,
  DEFAULT_CIP_HOST,
  DEFAULT_CIP_STAGING_HOST,
} from '@salesforce/b2c-tooling-sdk/clients';

function json(value: ToolResult) {
  return JSON.parse((value.content[0] as {text: string}).text);
}

describe('CIP', () => {
  describe('tools', () => {
    const load = sinon.stub();
    const query = sinon.stub();
    const resolveClient = sinon.stub();
    let tools: ReturnType<typeof createCipTools>;

    beforeEach(() => {
      load.reset();
      query.reset();
      resolveClient.reset();
      load.returns(new Services({resolvedConfig: createMockResolvedConfig()}));
      query.resolves({columns: ['orders'], rows: [{orders: 12}], rowCount: 1, truncated: false});
      resolveClient.returns({client: {query}, target: {tenantId: 'abcd_prd', host: DEFAULT_CIP_HOST}});
      tools = createCipTools(load, {resolveClient});
    });

    it('discovers report metadata and previews SQL without credentials or acknowledgment', async () => {
      const found = await tools[0].handler({query: 'sales analytics'});
      expect(found.isError).not.to.equal(true);
      expect(json(found).reports.map((r: {name: string}) => r.name)).to.include('sales-analytics');
      const detail = json(await tools[0].handler({action: 'report', name: 'sales-analytics'}));
      expect(detail.parameters.map((p: {name: string}) => p.name)).to.include('siteId');
      expect(detail).not.to.have.property('buildSql');
      expect(detail.tablesUsed).to.have.members(['ccdw_aggr_sales_summary', 'ccdw_dim_site']);
      expect(detail.resultNotes).to.be.an('array').and.not.empty;
      const preview = json(
        await tools[0].handler({
          action: 'report',
          name: 'sales-analytics',
          params: {
            siteId: 'Sites-Example-Site',
            from: '2026-09-01',
            to: '2026-09-07',
          },
        }),
      );
      expect(preview.sql).to.include("'Sites-Example-Site'");
      expect(load.called).to.equal(false);
    });

    it('requires the CIP read acknowledgment before loading config or authenticating', async () => {
      const result = await tools[1].handler({sql: 'SELECT 1'});
      expect(result.isError).to.equal(true);
      expect(json(result).error).to.include('skill://mcp/cip/SKILL.md');
      expect(load.called).to.equal(false);
      expect(query.called).to.equal(false);
    });

    it('validates report parameters and exclusive inputs before connecting', async () => {
      const invalid = [
        {report: 'sales-analytics'},
        {report: 'missing'},
        {report: 'sales-analytics', sql: 'SELECT 1'},
        {sql: 'SELECT 1', params: {x: 'y'}},
        {sql: 'SELECT 1', maxRows: 501},
        {report: 'sales-analytics', params: {siteId: 's', from: '2026-09-07', to: '2026-09-01'}},
      ];
      await Promise.all(
        invalid.map(async (input) => {
          expect((await tools[1].handler({skillRead: true, ...input})).isError).to.equal(true);
        }),
      );
      expect(load.called).to.equal(false);
    });

    it('executes the SDK report SQL with per-call context, cancellation and bounded rows', async () => {
      const controller = new AbortController();
      const response = await tools[1].handler(
        {
          skillRead: true,
          report: 'sales-analytics',
          projectDirectory: '/work/task',
          instanceName: 'production',
          maxRows: 10,
          params: {siteId: 'Sites-Example-Site', from: '2026-09-01', to: '2026-09-07'},
        },
        {signal: controller.signal},
      );
      expect(response.isError).not.to.equal(true);
      expect(query.firstCall.args[0]).to.include('ccdw_aggr_sales_summary');
      expect(query.firstCall.args[1]).to.deep.equal({maxRows: 10});
      expect(load.firstCall.args[0]).to.include({projectDirectory: '/work/task', instanceName: 'production'});
      expect(json(response)).to.include({rowCount: 1, truncated: false});
      expect(json(response)).to.have.property('resolution');
      expect(response.structuredContent).to.equal(undefined);
      controller.abort();
      expect(resolveClient.firstCall.args[1].aborted).to.equal(true);
    });

    it('bounds live metadata and carries truncation into continuation', async () => {
      query.resolves({
        columns: [],
        rowCount: 2,
        truncated: true,
        rows: [
          {TABLE_NAME: 'first', TABLE_SCHEM: 'warehouse', TABLE_TYPE: 'TABLE'},
          {TABLE_NAME: 'second', TABLE_SCHEM: 'warehouse', TABLE_TYPE: 'TABLE'},
        ],
      });
      const response = await tools[0].handler({action: 'tables', query: 'ccdw_aggr_%', offset: 1, limit: 1});
      expect(json(response)).to.include({returned: 1, nextOffset: 2, truncated: true});
      expect(json(response).tables[0].tableName).to.equal('second');
      expect(query.firstCall.args[1].maxRows).to.equal(2);
      expect(query.firstCall.args[0]).to.include("LIKE 'ccdw_aggr_%'");
      expect(json(response).schema).to.equal('warehouse');
      expect(json(response).tables[0]).to.have.all.keys('tableName', 'tableType');
    });

    it('returns a typical table in one compact page with explicit shared context', async () => {
      query.resolves({
        columns: [],
        rowCount: 21,
        truncated: false,
        rows: Array.from({length: 21}, (_, i) => ({
          COLUMN_NAME: `column_${i}`,
          TYPE_NAME: 'BIGINT',
          IS_NULLABLE: 'NO',
          ORDINAL_POSITION: i + 1,
          TABLE_NAME: 'ccdw_aggr_sales_summary',
          TABLE_SCHEM: 'warehouse',
        })),
      });
      const response = await tools[0].handler({action: 'table', name: 'ccdw_aggr_sales_summary'});
      const data = json(response);
      expect(response.isError).not.to.equal(true);
      expect(data).to.include({schema: 'warehouse', table: 'ccdw_aggr_sales_summary', returned: 21, nextOffset: null});
      expect(data.columns[0]).to.deep.equal({columnName: 'column_0', dataType: 'BIGINT', isNullable: false});
      expect(query.firstCall.args[1].maxRows).to.equal(50);
      query.resetHistory();
      await tools[0].handler({action: 'table', name: 'ccdw_aggr_sales_summary', limit: 10, offset: 10});
      expect(query.firstCall.args[1].maxRows).to.equal(20);
    });

    it('bounds serialized output without silently claiming complete results', async () => {
      query.resolves({
        columns: ['v'],
        rowCount: 50,
        truncated: false,
        rows: Array.from({length: 50}, () => ({v: 'x'.repeat(1000)})),
      });
      const response = await tools[1].handler({skillRead: true, sql: 'SELECT v FROM test'});
      expect(response.isError).not.to.equal(true);
      expect(Buffer.byteLength(JSON.stringify(response))).to.be.at.most(24_000);
      expect(json(response)).to.include({truncated: true, truncationReason: 'bytes'});
      expect(json(response).rowCount).to.be.lessThan(50);
      expect(json(response).rows).to.have.length(json(response).rowCount);
      query.rejects(new Error('CIP Avatica error: bad column SQLState=42S22'));
      const error = await tools[1].handler({skillRead: true, sql: 'SELECT missing FROM test'});
      expect(error.isError).to.equal(true);
      expect(json(error).error).to.include('SQLState=42S22');
    });
  });

  describe('CIP access and middleware', () => {
    function fixture(
      tenantId = 'abcd_prd',
      options: {host?: string; environment?: Record<string, string>; readOnly?: boolean} = {},
    ) {
      const config = createMockResolvedConfig({
        tenantId,
        clientId: 'client',
        clientSecret: 'secret',
        cipHost: options.host,
        ...(options.readOnly ? {safety: {level: 'READ_ONLY'}} : {}),
      });
      const fetch = sinon.stub().resolves(new Response('denied', {status: 403}));
      const auth = sinon.stub().returns({fetch});
      config.createOAuth = auth;
      const services = new Services({resolvedConfig: config, projectEnvironment: options.environment});
      return {services, fetch, auth, config};
    }

    it('matches production/staging selection, normalized tenants, and explicit hosts', () => {
      const prod = fixture('f_ecom_abcd_prd');
      expect(resolveCipClient(prod.services, AbortSignal.timeout(1000)).target).to.include({
        host: DEFAULT_CIP_HOST,
        tenantId: 'abcd_prd',
        scope: 'SALESFORCE_COMMERCE_API:abcd_prd',
      });
      expect(prod.auth.firstCall.args[0]).to.deep.equal({
        allowedMethods: ['client-credentials'],
        scopes: ['SALESFORCE_COMMERCE_API:abcd_prd'],
      });
      expect(resolveCipClient(fixture('abcd_001').services, AbortSignal.timeout(1000)).target.host).to.equal(
        DEFAULT_CIP_STAGING_HOST,
      );
      expect(resolveCipClient(prod.services, AbortSignal.timeout(1000), true).target.host).to.equal(
        DEFAULT_CIP_STAGING_HOST,
      );
      expect(
        resolveCipClient(fixture('abcd_prd', {host: 'analytics.example.com'}).services, AbortSignal.timeout(1000), true)
          .target.host,
      ).to.equal('analytics.example.com');
    });

    it('reports missing credentials and unsupported auth without making requests', () => {
      const value = fixture();
      value.config.values.clientSecret = undefined;
      expect(() => resolveCipClient(value.services, AbortSignal.timeout(1000))).to.throw('clientSecret');
      value.config.values.clientSecret = 'secret';
      value.config.values.authMethods = ['user'];
      expect(() => resolveCipClient(value.services, AbortSignal.timeout(1000))).to.throw('client-credentials');
      expect(value.auth.called).to.equal(false);
    });

    it('applies per-call safety before authentication and keeps plugin middleware', async () => {
      const plugin = sinon.spy();
      globalMiddlewareRegistry.register({
        name: 'test-plugin',
        getMiddleware: () => ({
          onRequest({request}) {
            plugin();
            request.headers.set('x-plugin', 'yes');
          },
        }),
      });
      const blocked = fixture('abcd_prd', {readOnly: true});
      const blockedTools = createCipTools(() => blocked.services);
      const response = await blockedTools[1].handler({skillRead: true, sql: 'SELECT 1'});
      expect(response.isError).to.equal(true);
      expect(json(response).error).to.match(/blocked/i);
      expect(blocked.fetch.called).to.equal(false);
      const allowed = fixture();
      const allowedTools = createCipTools(() => allowed.services);
      const denied = await allowedTools[1].handler({skillRead: true, sql: 'SELECT 1'});
      expect(json(denied).error).to.include('403');
      expect(new Headers(allowed.fetch.firstCall.args[1].headers).get('x-plugin')).to.equal('yes');
      expect(allowed.fetch.firstCall.args[1].redirect).to.equal('error');
      expect(plugin.called).to.equal(true);
    });
  });
});
