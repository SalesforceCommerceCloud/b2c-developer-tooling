/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {
  buildCipReportSql,
  executeCipReport,
  getCipReportByName,
  listCipReports,
} from '@salesforce/b2c-tooling-sdk/operations/cip';
import type {CipClient} from '../../../src/clients/cip.js';

describe('operations/cip', () => {
  it('lists the curated report catalog', () => {
    const reports = listCipReports();
    expect(reports.length).to.equal(10);
  });

  it('gets a known report by name', () => {
    const report = getCipReportByName('sales-analytics');
    expect(report).to.not.equal(undefined);
    expect(report?.name).to.equal('sales-analytics');
  });

  it('builds SQL for a known report', () => {
    const result = buildCipReportSql('sales-analytics', {
      siteId: 'Sites-RefArch-Site',
      from: '2025-01-01',
      to: '2025-01-31',
    });
    expect(result.sql).to.include('ccdw_aggr_sales_summary');
    expect(result.sql).to.include("'Sites-RefArch-Site'");
  });

  it('rejects unknown parameters', () => {
    expect(() =>
      buildCipReportSql('sales-analytics', {
        siteId: 'Sites-RefArch-Site',
        from: '2025-01-01',
        to: '2025-01-31',
        bad: 'x',
      }),
    ).to.throw('Unknown parameters');
  });

  it('rejects missing required parameters', () => {
    expect(() =>
      buildCipReportSql('sales-analytics', {
        from: '2025-01-01',
        to: '2025-01-31',
      }),
    ).to.throw('Missing required parameter');
  });

  it('executes report and returns decoded query payload', async () => {
    const queryCalls: Array<{options: unknown; sql: string}> = [];
    const client = {
      query: async (sql: string, options: unknown) => {
        queryCalls.push({sql, options});
        return {
          columns: ['date', 'orders'],
          rows: [{date: '2025-01-01', orders: 5}],
          rowCount: 1,
        };
      },
    } as unknown as CipClient;

    const result = await executeCipReport(client, 'sales-analytics', {
      params: {
        siteId: 'Sites-RefArch-Site',
        from: '2025-01-01',
        to: '2025-01-31',
      },
      fetchSize: 500,
    });

    expect(result.reportName).to.equal('sales-analytics');
    expect(result.columns).to.deep.equal(['date', 'orders']);
    expect(result.rowCount).to.equal(1);
    expect(queryCalls).to.have.length(1);
    expect(queryCalls[0]?.sql).to.include('ccdw_aggr_sales_summary');
    expect((queryCalls[0]?.options as {fetchSize?: number})?.fetchSize).to.equal(500);
  });
});
