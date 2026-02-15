/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import {buildCipReportSql, getCipReportByName, listCipReports} from '@salesforce/b2c-tooling-sdk/operations/cip';

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
      siteId: 'SiteGenesis',
      from: '2025-01-01',
      to: '2025-01-31',
    });
    expect(result.sql).to.include('ccdw_aggr_sales_summary');
    expect(result.sql).to.include("'SiteGenesis'");
  });

  it('rejects unknown parameters', () => {
    expect(() =>
      buildCipReportSql('sales-analytics', {
        siteId: 'SiteGenesis',
        from: '2025-01-01',
        to: '2025-01-31',
        bad: 'x',
      }),
    ).to.throw('Unknown parameters');
  });
});
