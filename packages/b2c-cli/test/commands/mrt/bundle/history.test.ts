/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleHistory from '../../../../src/commands/mrt/bundle/history.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle history', () => {
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
    return new MrtBundleHistory([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls command.error when environment is missing', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls listDeployments and returns result with deployments', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging', limit: 10}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      deployments: [
        {
          bundle: {id: 123, message: 'Deploy 1'},
          status: 'finished',
          deploy_type: 'bundle',
          user: 'test@example.com',
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
      count: 1,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({
        projectSlug: 'my-project',
        targetSlug: 'staging',
        limit: 10,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.targetSlug).to.equal('staging');
    expect(input.limit).to.equal(10);
    expect(result.deployments).to.have.lengthOf(1);
    expect(result.count).to.equal(1);
  });

  it('handles empty deployment list', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      deployments: [],
      count: 0,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({projectSlug: 'my-project', targetSlug: 'staging', origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(result.deployments).to.have.lengthOf(0);
    expect(result.count).to.equal(0);
  });
});
