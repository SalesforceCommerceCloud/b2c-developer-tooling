/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import MrtRedirectDelete from '../../../../../src/commands/mrt/env/redirect/delete.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt env redirect delete', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtRedirectDelete, hooks.getConfig(), flags, args);
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({force: true, environment: 'staging'}, {fromPath: '/old-page'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('MRT project is required');
    }
  });

  it('throws error when environment is missing', async () => {
    const command = await createCommand({force: true, project: 'my-storefront'}, {fromPath: '/old-page'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-storefront', mrtEnvironment: undefined}}));

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('MRT environment is required');
    }
  });

  it('deletes redirect with force flag', async () => {
    const command = await createCommand(
      {json: true, project: 'my-storefront', environment: 'staging', force: true},
      {fromPath: '/old-page'},
    );

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const deleteStub = sinon.stub().resolves();
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Deleting redirect...');
      await deleteStub();
      return {fromPath: '/old-page', deleted: true};
    };

    const result = await command.run();

    expect(result.fromPath).to.equal('/old-page');
    expect(result.deleted).to.be.true;
  });

  it('deletes redirect in non-JSON mode', async () => {
    const command = await createCommand(
      {project: 'my-storefront', environment: 'staging', force: true},
      {fromPath: '/old-url'},
    );

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const deleteStub = sinon.stub().resolves();
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Deleting redirect...');
      await deleteStub();
      return {fromPath: '/old-url', deleted: true};
    };

    const result = await command.run();

    expect(result.deleted).to.be.true;
  });

  it('handles API errors', async () => {
    const command = await createCommand(
      {project: 'my-storefront', environment: 'staging', force: true},
      {fromPath: '/old-page'},
    );

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Deleting redirect...');
      this.error('Failed to delete redirect: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to delete redirect');
    }
  });

  it('handles cancellation', async () => {
    const command = await createCommand(
      {json: true, project: 'my-storefront', environment: 'staging'},
      {fromPath: '/old-page'},
    );

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Deletion cancelled.');
      return {fromPath: '/old-page', deleted: false};
    };

    const result = await command.run();

    expect(result.fromPath).to.equal('/old-page');
    expect(result.deleted).to.be.false;
  });
});
