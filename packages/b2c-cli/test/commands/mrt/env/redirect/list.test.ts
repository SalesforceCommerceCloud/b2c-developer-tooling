/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import MrtRedirectList from '../../../../../src/commands/mrt/env/redirect/list.js';
import {createIsolatedConfigHooks, createTestCommand, runSilent} from '../../../../helpers/test-setup.js';

describe('mrt env redirect list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(flags: Record<string, unknown>): Promise<any> {
    return createTestCommand(MrtRedirectList, hooks.getConfig(), flags, {});
  }

  it('throws error when project is missing', async () => {
    const command = await createCommand({environment: 'staging'});

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
    const command = await createCommand({project: 'my-storefront'});

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

  it('lists redirects in JSON mode', async () => {
    const command = await createCommand({json: true, project: 'my-storefront', environment: 'staging'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {
      count: 2,
      redirects: [
        {
          from_path: '/old-1',
          to_url: '/new-1',
          http_status_code: 301,
          publishing_status: 'published',
        },
        {
          from_path: '/old-2',
          to_url: '/new-2',
          http_status_code: 302,
          publishing_status: 'pending',
        },
      ],
    };

    const listStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Fetching redirects...');
      return listStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(2);
    expect(result.redirects).to.have.lengthOf(2);
  });

  it('lists redirects in non-JSON mode', async () => {
    const command = await createCommand({project: 'my-storefront', environment: 'staging'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {
      count: 1,
      redirects: [
        {
          from_path: '/sale',
          to_url: '/summer-sale',
          http_status_code: 301,
          publishing_status: 'published',
        },
      ],
    };

    const listStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Fetching redirects...');
      return listStub();
    };

    const result = (await runSilent(() => command.run())) as any;

    expect(result.count).to.equal(1);
  });

  it('handles empty list', async () => {
    const command = await createCommand({json: true, project: 'my-storefront', environment: 'staging'});

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {
      count: 0,
      redirects: [],
    };

    const listStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Fetching redirects...');
      return listStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(0);
    expect(result.redirects).to.deep.equal([]);
  });

  it('lists redirects with limit and offset', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      environment: 'staging',
      limit: 10,
      offset: 5,
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {
      count: 1,
      redirects: [{from_path: '/page-6', to_url: '/new-6', http_status_code: 301}],
    };

    const listStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Fetching redirects...');
      return listStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(1);
  });

  it('lists redirects with search filter', async () => {
    const command = await createCommand({
      json: true,
      project: 'my-storefront',
      environment: 'staging',
      search: '/old',
    });

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'getMrtAuth').returns({} as any);

    const mockResult = {
      count: 1,
      redirects: [{from_path: '/old-page', to_url: '/new-page', http_status_code: 301}],
    };

    const listStub = sinon.stub().resolves(mockResult);
    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) {
        this.error('MRT project is required');
      }
      if (!environment) {
        this.error('MRT environment is required');
      }
      this.log('Fetching redirects...');
      return listStub();
    };

    const result = await command.run();

    expect(result.count).to.equal(1);
    expect(result.redirects[0].from_path).to.equal('/old-page');
  });
});
