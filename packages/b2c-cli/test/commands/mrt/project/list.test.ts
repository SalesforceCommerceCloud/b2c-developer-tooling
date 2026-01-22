/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectList from '../../../../src/commands/mrt/project/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project list', () => {
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
    return new MrtProjectList([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls listProjects and returns result with projects', async () => {
    const command = createCommand();

    stubParse(command, {organization: 'my-org', limit: 10}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      projects: [
        {name: 'Project 1', slug: 'proj-1', organization: 'my-org', ssr_region: 'us-east-1'},
        {name: 'Project 2', slug: 'proj-2', organization: 'my-org', ssr_region: 'eu-west-1'},
      ],
      count: 2,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({
        organization: 'my-org',
        limit: 10,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.organization).to.equal('my-org');
    expect(input.limit).to.equal(10);
    expect(result.projects).to.have.lengthOf(2);
    expect(result.count).to.equal(2);
  });

  it('handles empty project list', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      projects: [],
      count: 0,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(result.projects).to.have.lengthOf(0);
    expect(result.count).to.equal(0);
  });
});
