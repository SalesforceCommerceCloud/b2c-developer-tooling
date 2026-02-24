/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SearchQueryPerformance from '../../../../src/commands/cip/report/search-query-performance.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../helpers/test-setup.js';

describe('cip report search-query-performance', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(SearchQueryPerformance, hooks.getConfig(), flags, {});
  }

  it('throws error when has-results flag is missing', async () => {
    const command = await createCommand({});

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.calledWith('--has-results is required for this report. Use true or false.')).to.be.true;
    }
  });

  it('returns SQL when sql flag is true', async () => {
    const command = await createCommand({
      'has-results': 'true',
      'site-id': 'Sites-test-Site',
      from: '2025-01-01',
      to: '2025-01-31',
      sql: true,
    });

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);
    sinon.stub(process.stdout, 'write');

    const result = await command.run();

    expect(result.reportName).to.equal('search-query-performance');
    expect(result.sql).to.be.a('string');
    expect(result.sql.length).to.be.greaterThan(0);
  });

  it('returns report description when describe flag is true', async () => {
    const command = await createCommand({
      describe: true,
    });

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(result.name).to.equal('search-query-performance');
    expect(result.description).to.be.a('string');
    expect(result.parameters).to.be.an('array');
  });

  it('executes report and returns data in JSON mode', async () => {
    const command = await createCommand({
      'has-results': 'true',
      'site-id': 'Sites-test-Site',
      from: '2025-01-01',
      to: '2025-01-31',
      json: true,
    });

    sinon.stub(command, 'validateCipAuthMethods').returns(void 0);
    sinon.stub(command, 'requireCipCredentials').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);

    const mockClient = {
      query: sinon.stub().resolves({
        columns: ['search_term', 'search_count'],
        rows: [{search_term: 'shoes', search_count: 100}],
        rowCount: 1,
      }),
    };

    sinon.stub(command, 'getCipClient').returns(mockClient);

    const result = await command.run();

    expect(result.reportName).to.equal('search-query-performance');
    expect(result.columns).to.deep.equal(['search_term', 'search_count']);
    expect(result.rowCount).to.equal(1);
    expect(result.rows).to.have.lengthOf(1);
  });
});
