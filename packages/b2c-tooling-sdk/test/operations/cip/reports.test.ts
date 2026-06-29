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
    expect(reports.length).to.equal(27);
  });

  it('exposes unique report names and non-empty categories', () => {
    const reports = listCipReports();
    const names = reports.map((report) => report.name);
    expect(new Set(names).size, 'report names should be unique').to.equal(names.length);
    for (const report of reports) {
      expect(report.category, `category for ${report.name}`).to.be.a('string').and.not.equal('');
      expect(report.description, `description for ${report.name}`).to.be.a('string').and.not.equal('');
    }
  });

  it('builds valid SQL for every catalog report using representative params', () => {
    for (const report of listCipReports()) {
      const params: Record<string, string> = {from: '2026-01-01', to: '2026-01-31'};
      for (const parameter of report.parameters) {
        if (parameter.name === 'from' || parameter.name === 'to') continue;
        if (parameter.options && parameter.options.length > 0) {
          params[parameter.name] = parameter.options[0];
        } else if (parameter.type === 'string') {
          params[parameter.name] = parameter.name === 'siteId' ? 'Sites-RefArch-Site' : 'x';
        } else if (parameter.type === 'number') {
          params[parameter.name] = '5';
        } else if (parameter.type === 'boolean') {
          params[parameter.name] = 'true';
        } else if (parameter.type === 'date') {
          params[parameter.name] = '2026-01-15';
        }
      }

      const {sql} = buildCipReportSql(report.name, params);
      expect(sql, `sql for ${report.name}`).to.be.a('string').and.have.length.greaterThan(0);
      // The query must not contain an unsubstituted placeholder.
      expect(sql, `sql for ${report.name} has unresolved placeholder`).to.not.match(/<[A-Z_]+>/u);
      // No bare reserved word `method` (must be double-quoted when referenced).
      expect(sql, `sql for ${report.name} references bare reserved word`).to.not.match(/[^."]\bmethod\b/u);
    }
  });

  it('quotes the reserved word method in SCAPI reports', () => {
    const {sql} = buildCipReportSql('scapi-traffic-latency', {from: '2026-01-01', to: '2026-01-31'});
    expect(sql).to.include('"method"');
    expect(sql).to.include('ccdw_aggr_scapi_request');
  });

  it('omits the site join when siteId is not supplied for optional-site reports', () => {
    const withoutSite = buildCipReportSql('scapi-latency-distribution', {from: '2026-01-01', to: '2026-01-31'});
    expect(withoutSite.sql).to.not.include('ccdw_dim_site');
    expect(withoutSite.sql).to.not.include('nsite_id');

    const withSite = buildCipReportSql('scapi-latency-distribution', {
      from: '2026-01-01',
      to: '2026-01-31',
      siteId: 'Sites-RefArch-Site',
    });
    expect(withSite.sql).to.include('JOIN ccdw_dim_site');
    expect(withSite.sql).to.include("s.nsite_id = 'Sites-RefArch-Site'");
  });

  it('applies a statusClass enum filter when supplied', () => {
    const filtered = buildCipReportSql('scapi-error-rate-by-status', {
      from: '2026-01-01',
      to: '2026-01-31',
      statusClass: '5xx',
    });
    expect(filtered.sql).to.include('status_code BETWEEN 500 AND 599');
  });

  it('rejects an out-of-set enum value', () => {
    expect(() =>
      buildCipReportSql('scapi-error-rate-by-status', {
        from: '2026-01-01',
        to: '2026-01-31',
        statusClass: '3xx',
      }),
    ).to.throw('Invalid value');
  });

  it('promotes the funnel drop-off division to avoid integer truncation', () => {
    const {sql} = buildCipReportSql('checkout-funnel-dropoff', {
      siteId: 'Sites-RefArch-Site',
      from: '2026-01-01',
      to: '2026-01-31',
    });
    // dividend promoted with * 1.0 so Calcite does not truncate the ratio
    expect(sql).to.include('num_visits * 1.0');
    // disambiguates parallel checkout flows by including step_name in the window order
    expect(sql).to.include('step_name');
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
