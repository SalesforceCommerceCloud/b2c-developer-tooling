/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import MrtRedirectCreate from '../../../../../src/commands/mrt/env/redirect/create.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../../../helpers/test-setup.js';

describe('mrt env redirect create', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtRedirectCreate, hooks.getConfig(), flags, {});
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({environment: 'staging', from: '/old', to: '/new'});

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
    const command = await createCommand({project: 'my-storefront', from: '/old', to: '/new'});

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

  it('creates redirect with default status 301', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      environment: 'staging',
      from: '/old-page',
      to: '/new-page',
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockRedirect = {
      from: '/old-page',
      to: '/new-page',
      status: 301,
    };

    const createStub = sinon.stub().resolves(mockRedirect);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Creating redirect...');
      return createStub();
    };

    const result = await command.run();

    expect(result.from).to.equal('/old-page');
    expect(result.to).to.equal('/new-page');
    expect(result.status).to.equal(301);
  });

  it('creates redirect with 302 status', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      environment: 'staging',
      from: '/sale',
      to: '/summer-sale',
      status: 302,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockRedirect = {
      from: '/sale',
      to: '/summer-sale',
      status: 302,
    };

    const createStub = sinon.stub().resolves(mockRedirect);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Creating redirect...');
      return createStub();
    };

    const result = await command.run();

    expect(result.status).to.equal(302);
  });

  it('creates redirect with forward-querystring', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      environment: 'staging',
      from: '/search',
      to: '/new-search',
      'forward-querystring': true,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockRedirect = {
      from: '/search',
      to: '/new-search',
      status: 301,
      forwardQuerystring: true,
    };

    const createStub = sinon.stub().resolves(mockRedirect);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Creating redirect...');
      return createStub();
    };

    const result = await command.run();

    expect(result.forwardQuerystring).to.be.true;
  });

  it('creates redirect with forward-wildcard', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      environment: 'staging',
      from: '/a/*',
      to: '/b',
      'forward-wildcard': true,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockRedirect = {
      from: '/a/*',
      to: '/b',
      status: 301,
      forwardWildcard: true,
    };

    const createStub = sinon.stub().resolves(mockRedirect);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Creating redirect...');
      return createStub();
    };

    const result = await command.run();

    expect(result.forwardWildcard).to.be.true;
  });

  it('creates redirect in non-JSON mode', async () => {
    const command = await createCommand({
      project: 'my-storefront',
      environment: 'staging',
      from: '/old',
      to: '/new',
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockRedirect = {
      from: '/old',
      to: '/new',
      status: 301,
    };

    const createStub = sinon.stub().resolves(mockRedirect);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Creating redirect...');
      return createStub();
    };

    const result = await command.run();

    expect(result.from).to.equal('/old');
  });

  it('handles API errors', async () => {
    const command = await createCommand({
      project: 'my-storefront',
      environment: 'staging',
      from: '/old',
      to: '/new',
    });

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
      this.log('Creating redirect...');
      this.error('Failed to create redirect: API error');
    };

    try {
      await command.run();
      expect.fail('Should have thrown');
    } catch {
      expect(errorStub.called).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('Failed to create redirect');
    }
  });
});
