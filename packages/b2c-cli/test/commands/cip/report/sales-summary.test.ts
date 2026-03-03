/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SalesSummary from '../../../../src/commands/cip/report/sales-summary.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('cip report sales-summary', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(SalesSummary, hooks.getConfig(), flags, {});
  }

  it('returns SQL when sql flag is true', async () => {
    const command = await createCommand({
      from: '2025-01-01',
      to: '2025-01-31',
      sql: true,
    });

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);
    sinon.stub(process.stdout, 'write');

    const result = await command.run();

    expect(result.reportName).to.equal('sales-summary');
    expect(result.sql).to.be.a('string');
  });

  it('returns report description when describe flag is true', async () => {
    const command = await createCommand({describe: true});

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(result.name).to.equal('sales-summary');
    expect(result.description).to.be.a('string');
  });

  it('executes report and returns data in JSON mode', async () => {
    const command = await createCommand({
      from: '2025-01-01',
      to: '2025-01-31',
      json: true,
    });

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);
    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockClient = {
      query: sinon.stub().resolves({
        columns: ['order_id', 'total'],
        rows: [{order_id: '12345', total: 99.99}],
        rowCount: 1,
      }),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.reportName).to.equal('sales-summary');
    expect(result.rowCount).to.equal(1);
  });
});
