/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import CipReportList from '../../../../src/commands/cip/report/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../helpers/test-setup.js';

describe('cip report list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(CipReportList, hooks.getConfig(), flags, {});
  }

  it('lists the full catalog in JSON mode without credentials', async () => {
    const command = await createCommand({json: true});
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(result.reportCount).to.be.greaterThan(20);
    expect(result.reports).to.have.lengthOf(result.reportCount);
    expect(result.reports[0]).to.have.keys(['category', 'name', 'description', 'required_params']);
  });

  it('filters by category (case-insensitive)', async () => {
    const command = await createCommand({json: true, category: 'technical analytics'});
    sinon.stub(command, 'jsonEnabled').returns(true);

    const result = await command.run();

    expect(result.reportCount).to.be.greaterThan(0);
    for (const report of result.reports) {
      expect(report.category).to.equal('Technical Analytics');
    }
    // SCAPI technical reports should be present.
    expect(result.reports.map((r: {name: string}) => r.name)).to.include('scapi-latency-distribution');
  });

  it('renders a grouped table without throwing', async () => {
    const command = await createCommand({});
    sinon.stub(command, 'jsonEnabled').returns(false);

    const result = (await runSilent(() => command.run())) as any;
    expect(result.reportCount).to.be.greaterThan(20);
  });
});
