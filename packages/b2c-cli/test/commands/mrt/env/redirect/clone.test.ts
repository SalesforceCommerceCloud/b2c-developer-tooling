/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import MrtRedirectClone from '../../../../../src/commands/mrt/env/redirect/clone.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt env redirect clone', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtRedirectClone, hooks.getConfig(), flags, {});
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({from: 'staging', to: 'production', force: true});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('MRT project is required');
    }
  });

  it('clones redirects with force flag', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      from: 'staging',
      to: 'production',
      force: true,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {
      count: 5,
      redirects: [{from: '/old-path', to: '/new-path', status: 301}],
    };

    const cloneStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Cloning redirects...');
      return cloneStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(5);
    expect(result.redirects).to.have.lengthOf(1);
  });

  it('clones redirects in non-JSON mode', async () => {
    const command = await createCommand({
      project: 'my-storefront',
      from: 'dev',
      to: 'staging',
      force: true,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {count: 3, redirects: []};

    const cloneStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Cloning redirects...');
      return cloneStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(3);
  });

  it('handles API errors', async () => {
    const command = await createCommand({
      project: 'my-storefront',
      from: 'staging',
      to: 'production',
      force: true,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Cloning redirects...');
      this.error('Failed to clone redirects: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to clone redirects');
    }
  });

  it('handles empty result', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      from: 'staging',
      to: 'production',
      force: true,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {count: 0, redirects: []};

    const cloneStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      this.log('Cloning redirects...');
      return cloneStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(0);
    expect(result.redirects).to.deep.equal([]);
  });
});
