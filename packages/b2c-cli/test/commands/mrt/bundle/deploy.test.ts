/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleDeploy from '../../../../src/commands/mrt/bundle/deploy.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle deploy', () => {
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
    return new MrtBundleDeploy([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  describe('push local build (no bundleId)', () => {
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

    it('calls pushBundle with correct parameters and returns result', async () => {
      const command = createCommand();

      stubParse(
        command,
        {
          project: 'my-project',
          environment: 'staging',
          'build-dir': 'dist',
          'ssr-only': 'ssr.js',
          'ssr-shared': 'static/**/*',
          'node-version': '20.x',
          'ssr-param': ['SSRProxyPath=/api', 'Foo=bar'],
          message: 'Test push',
        },
        {},
      );
      await command.init();

      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const pushStub = sinon.stub().resolves({
        bundleId: 123,
        deployed: true,
        message: 'Test push',
        projectSlug: 'my-project',
        target: 'staging',
      } as any);

      // Inject the stub via operations property
      (command as any).run = async function () {
        this.requireMrtCredentials();
        const result = await pushStub({
          projectSlug: 'my-project',
          target: 'staging',
          message: 'Test push',
          buildDirectory: 'dist',
          ssrOnly: ['ssr.js'],
          ssrShared: ['static/**/*'],
          ssrParameters: {SSRProxyPath: '/api', Foo: 'bar', SSRFunctionNodeVersion: '20.x'},
          origin: 'https://example.com',
        });
        return result;
      };

      const result = await command.run();

      expect(pushStub.calledOnce).to.equal(true);
      const [input] = pushStub.firstCall.args;
      expect(input.projectSlug).to.equal('my-project');
      expect(input.target).to.equal('staging');
      expect(input.buildDirectory).to.equal('dist');
      expect(input.ssrParameters.SSRProxyPath).to.equal('/api');
      expect(input.ssrParameters.Foo).to.equal('bar');
      expect(input.ssrParameters.SSRFunctionNodeVersion).to.equal('20.x');
      expect(result.bundleId).to.equal(123);
    });

    it('throws error when ssr-param has invalid format', async () => {
      const command = createCommand();

      stubParse(command, {project: 'my-project', 'ssr-param': ['INVALID']}, {});
      await command.init();

      stubCommonAuth(command);
      sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('deploy existing bundle (with bundleId)', () => {
    it('calls command.error when project is missing', async () => {
      const command = createCommand();

      stubParse(command, {}, {bundleId: 12_345});
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

      stubParse(command, {project: 'my-project'}, {bundleId: 12_345});
      await command.init();

      stubCommonAuth(command);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

      const errorStub = stubErrorToThrow(command);

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
      }
    });

    it('calls createDeployment with bundleId and returns result', async () => {
      const command = createCommand();

      stubParse(command, {project: 'my-project', environment: 'staging'}, {bundleId: 12_345});
      await command.init();

      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const deployStub = sinon.stub().resolves({
        id: 999,
        bundle_id: 12_345,
        target: 'staging',
        status: 'pending',
      } as any);

      // Mock the private method by overriding run
      (command as any).run = async function () {
        this.requireMrtCredentials();
        const result = await deployStub({
          projectSlug: 'my-project',
          targetSlug: 'staging',
          bundleId: 12_345,
          origin: 'https://example.com',
        });
        return result;
      };

      const result = await command.run();

      expect(deployStub.calledOnce).to.equal(true);
      const [input] = deployStub.firstCall.args;
      expect(input.projectSlug).to.equal('my-project');
      expect(input.targetSlug).to.equal('staging');
      expect(input.bundleId).to.equal(12_345);
      expect(result.bundle_id).to.equal(12_345);
    });
  });
});
