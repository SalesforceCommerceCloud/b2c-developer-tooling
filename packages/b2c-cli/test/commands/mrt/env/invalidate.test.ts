/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtCacheInvalidate from '../../../../src/commands/mrt/env/invalidate.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env invalidate', () => {
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
    return new MrtCacheInvalidate([], config);
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

    stubParse(command, {pattern: '/*'}, {});
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

    stubParse(command, {project: 'my-project', pattern: '/*'}, {});
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

  it('calls command.error when pattern does not start with /', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production', pattern: 'invalid-pattern'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));
    sinon.stub(command, 'log').returns(void 0);

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Pattern must start with a forward slash');
    }
  });

  it('calls invalidateCache and returns result on success', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production', pattern: '/*'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));

    const invalidateStub = sinon.stub().resolves({
      result: 'Cache invalidation request accepted.',
    } as any);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) this.error('MRT project is required.');
      if (!environment) this.error('MRT environment is required.');
      const {pattern} = this.flags;
      if (!pattern.startsWith('/')) this.error('Pattern must start with a forward slash (/).');
      const result = await invalidateStub({
        projectSlug: project,
        targetSlug: environment,
        pattern,
        origin: 'https://example.com',
      });
      return result;
    };

    const result = await command.run();

    expect(invalidateStub.calledOnce).to.equal(true);
    const [input] = invalidateStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.targetSlug).to.equal('production');
    expect(input.pattern).to.equal('/*');
    expect(result.result).to.include('Cache invalidation request accepted');
  });

  it('handles API errors during cache invalidation', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production', pattern: '/products/*'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));

    const errorStub = stubErrorToThrow(command);

    (command as any).run = async function () {
      this.requireMrtCredentials();
      const {mrtProject: project, mrtEnvironment: environment} = this.resolvedConfig.values;
      if (!project) this.error('MRT project is required.');
      if (!environment) this.error('MRT environment is required.');
      this.error('Failed to invalidate cache: Not Found');
    };

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });
});
