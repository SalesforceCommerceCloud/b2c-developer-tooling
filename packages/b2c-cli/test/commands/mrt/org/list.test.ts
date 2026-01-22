/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtOrgList from '../../../../src/commands/mrt/org/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt org list', () => {
  let config: Config;

  beforeEach(async () => {
    isolateConfig();
    config = await Config.load();
  });

  afterEach(() => {
    sinon.restore();
    restoreConfig();
  });

  function createCommand(): any {
    return new MrtOrgList([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls listOrgs and returns organizations', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      organizations: [
        {slug: 'org1', name: 'Organization 1'},
        {slug: 'org2', name: 'Organization 2'},
      ],
      count: 2,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    expect(result.organizations).to.have.lengthOf(2);
    expect(result.count).to.equal(2);
  });

  it('handles empty organization list', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      organizations: [],
      count: 0,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(result.organizations).to.have.lengthOf(0);
    expect(result.count).to.equal(0);
  });
});
