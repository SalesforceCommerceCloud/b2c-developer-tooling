/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleList from '../../../../src/commands/mrt/bundle/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle list', () => {
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
    return new MrtBundleList([], config);
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

  it('calls listBundles and returns result with bundles', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', limit: 10, offset: 5}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      bundles: [
        {id: 1, message: 'Bundle 1', status: 'ready', user: 'test@example.com', created_at: '2025-01-01T00:00:00Z'},
        {id: 2, message: 'Bundle 2', status: 'ready', user: 'test@example.com', created_at: '2025-01-02T00:00:00Z'},
      ],
      count: 2,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({
        projectSlug: 'my-project',
        limit: 10,
        offset: 5,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.limit).to.equal(10);
    expect(input.offset).to.equal(5);
    expect(result.bundles).to.have.lengthOf(2);
    expect(result.count).to.equal(2);
  });

  it('handles empty bundle list', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      bundles: [],
      count: 0,
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const result = await listStub({projectSlug: 'my-project', origin: 'https://example.com'});
      return result;
    };

    const result = await command.run();

    expect(result.bundles).to.have.lengthOf(0);
    expect(result.count).to.equal(0);
  });
});
