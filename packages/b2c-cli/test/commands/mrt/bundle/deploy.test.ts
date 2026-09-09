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

  /**
   * Stubs the resolved MRT backend context. `getMrtBackendContext()` reads
   * `resolvedConfig.hasMrtConfig()` and builds auth strategies, which the plain
   * `{values}` config stub can't satisfy — so we stub the resolver directly.
   */
  function stubBackendContext(
    command: any,
    ctx: {preference?: string; scapiConnection?: unknown; legacyAuth?: unknown} = {},
  ): void {
    sinon.stub(command, 'getMrtBackendContext').returns({
      preference: ctx.preference ?? 'auto',
      scapiConnection: ctx.scapiConnection,
      legacyAuth: 'legacyAuth' in ctx ? ctx.legacyAuth : {},
    } as any);
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
          wait: false,
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
      command.operations = {...command.operations, pushBundle: pushStub};

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

    it('prints warnings returned by pushBundle', async () => {
      const command = createCommand();
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      stubParse(
        command,
        {project: 'my-project', environment: 'staging', 'build-dir': 'dist', 'ssr-param': [], wait: false},
        {},
      );
      await command.init();

      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      const warnStub = sinon.stub(command, 'warn').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const pushStub = sinon.stub().resolves({
        bundleId: 123,
        deployed: true,
        message: 'Test push',
        projectSlug: 'my-project',
        target: 'staging',
        warnings: [warning],
      } as any);
      command.operations = {...command.operations, pushBundle: pushStub};

      await command.run();

      expect(warnStub.calledWith(warning)).to.equal(true);
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

    it('errors on --mrt-backend scapi (local build is legacy-pinned)', async () => {
      const command = createCommand();

      stubParse(command, {project: 'my-project', 'mrt-backend': 'scapi', 'ssr-param': [], wait: false}, {});
      await command.init();

      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

      const pushStub = sinon.stub().resolves({} as any);
      command.operations = {...command.operations, pushBundle: pushStub};

      const errorStub = stubErrorToThrow(command);

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const [message] = errorStub.firstCall.args;
        expect(message).to.include('pushing a local build');
        expect(pushStub.notCalled).to.equal(true);
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

    it('calls deployMrtBundle with bundleId and returns the raw legacy deploy result under --json', async () => {
      const command = createCommand();

      stubParse(command, {project: 'my-project', environment: 'staging', wait: false}, {bundleId: 12_345});
      await command.init();

      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const deployStub = sinon.stub().resolves({
        backend: 'legacy',
        bundleId: 12_345,
        status: 'pending',
        raw: {bundleId: 12_345, targetSlug: 'staging', status: 'pending'},
      } as any);
      command.operations = {...command.operations, deployMrtBundle: deployStub};

      const result = await command.run();

      expect(deployStub.calledOnce).to.equal(true);
      const [input] = deployStub.firstCall.args;
      expect(input.preference).to.equal('auto');
      expect(input.projectSlug).to.equal('my-project');
      expect(input.targetSlug).to.equal('staging');
      expect(input.bundleId).to.equal(12_345);
      // --json emits the backend's native create result verbatim (no injected fields).
      expect(result.bundleId).to.equal(12_345);
      expect(result.targetSlug).to.equal('staging');
    });

    it('deploys via SCAPI when the backend resolves to scapi', async () => {
      const command = createCommand();

      stubParse(
        command,
        {project: 'my-project', environment: 'staging', 'mrt-backend': 'scapi', wait: false},
        {bundleId: 170},
      );
      await command.init();

      stubCommonAuth(command);
      const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
      stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

      const deployStub = sinon.stub().resolves({
        backend: 'scapi',
        bundleId: 170,
        deploymentId: 'dep-xyz',
        status: 'queued',
        raw: {deploymentId: 'dep-xyz', bundleId: 170, status: 'queued', bundle: {bundleId: 170}},
      } as any);
      command.operations = {...command.operations, deployMrtBundle: deployStub};

      const result = await command.run();

      const [input] = deployStub.firstCall.args;
      expect(input.preference).to.equal('scapi');
      expect(input.scapiConnection).to.equal(scapiConnection);
      // --json emits the native SCAPI create response verbatim.
      expect(result.deploymentId).to.equal('dep-xyz');
      expect(result.bundle.bundleId).to.equal(170);
    });

    it('prints warnings returned by deployMrtBundle', async () => {
      const command = createCommand();
      const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

      stubParse(command, {project: 'my-project', environment: 'staging', wait: false}, {bundleId: 12_345});
      await command.init();

      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      const warnStub = sinon.stub(command, 'warn').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const deployStub = sinon.stub().resolves({
        backend: 'legacy',
        bundleId: 12_345,
        status: 'pending',
        warnings: [warning],
        raw: {bundleId: 12_345, targetSlug: 'staging', status: 'pending'},
      } as any);
      command.operations = {...command.operations, deployMrtBundle: deployStub};

      await command.run();

      expect(warnStub.calledWith(warning)).to.equal(true);
    });
  });

  describe('--wait flag', () => {
    it('polls the legacy environment after a legacy deploy', async () => {
      const command = createCommand();

      stubParse(
        command,
        {project: 'my-project', environment: 'staging', wait: true, 'poll-interval': 10, timeout: 600},
        {bundleId: 12_345},
      );
      await command.init();

      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const deployStub = sinon.stub().resolves({backend: 'legacy', bundleId: 12_345, status: 'pending'} as any);
      const waitStub = sinon.stub().resolves({slug: 'staging', state: 'ACTIVE', name: 'staging'} as any);
      const scapiWaitStub = sinon.stub().resolves({} as any);
      command.operations = {
        ...command.operations,
        deployMrtBundle: deployStub,
        waitForEnv: waitStub,
        waitForDeploymentScapi: scapiWaitStub,
      };

      const result = await command.run();

      expect(deployStub.calledOnce).to.equal(true);
      expect(waitStub.calledOnce).to.equal(true);
      expect(scapiWaitStub.notCalled).to.equal(true);
      expect(result.state).to.equal('ACTIVE');
    });

    it('polls the SCAPI deployment by ID after a SCAPI deploy', async () => {
      const command = createCommand();

      stubParse(
        command,
        {
          project: 'my-project',
          environment: 'staging',
          'mrt-backend': 'scapi',
          wait: true,
          'poll-interval': 10,
          timeout: 600,
        },
        {bundleId: 170},
      );
      await command.init();

      stubCommonAuth(command);
      const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
      stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

      const deployStub = sinon
        .stub()
        .resolves({backend: 'scapi', bundleId: 170, deploymentId: 'dep-xyz', status: 'queued'} as any);
      const waitStub = sinon.stub().resolves({} as any);
      const scapiWaitStub = sinon.stub().resolves({deploymentId: 'dep-xyz', status: 'finished'} as any);
      command.operations = {
        ...command.operations,
        deployMrtBundle: deployStub,
        waitForEnv: waitStub,
        waitForDeploymentScapi: scapiWaitStub,
      };

      const result = await command.run();

      expect(scapiWaitStub.calledOnce).to.equal(true);
      const [conn, waitOpts] = scapiWaitStub.firstCall.args;
      expect(conn).to.equal(scapiConnection);
      expect(waitOpts.storefrontId).to.equal('my-project');
      expect(waitOpts.environmentId).to.equal('staging');
      expect(waitOpts.deploymentId).to.equal('dep-xyz');
      expect(waitStub.notCalled).to.equal(true);
      expect(result.status).to.equal('finished');
    });

    it('warns and skips wait when a SCAPI deploy returns no deployment ID', async () => {
      const command = createCommand();

      stubParse(
        command,
        {
          project: 'my-project',
          environment: 'staging',
          'mrt-backend': 'scapi',
          wait: true,
          'poll-interval': 10,
          timeout: 600,
        },
        {bundleId: 170},
      );
      await command.init();

      stubCommonAuth(command);
      const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
      stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      const warnStub = sinon.stub(command, 'warn').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

      const deployStub = sinon
        .stub()
        .resolves({backend: 'scapi', bundleId: 170, status: 'queued', raw: {bundleId: 170, status: 'queued'}} as any);
      const scapiWaitStub = sinon.stub().resolves({} as any);
      command.operations = {...command.operations, deployMrtBundle: deployStub, waitForDeploymentScapi: scapiWaitStub};

      const result = await command.run();

      expect(scapiWaitStub.notCalled).to.equal(true);
      expect(warnStub.called).to.equal(true);
      // Falls through to returning the native SCAPI create response.
      expect(result.status).to.equal('queued');
    });

    it('calls waitForEnv after push with environment', async () => {
      const command = createCommand();

      stubParse(
        command,
        {
          project: 'my-project',
          environment: 'staging',
          wait: true,
          'poll-interval': 10,
          timeout: 600,
          'build-dir': 'build',
          'ssr-only': 'ssr.js',
          'ssr-shared': 'static/**/*',
          'ssr-param': [],
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
        message: 'auto',
        projectSlug: 'my-project',
        target: 'staging',
      } as any);
      const waitStub = sinon.stub().resolves({slug: 'staging', state: 'ACTIVE', name: 'staging'} as any);
      command.operations = {...command.operations, pushBundle: pushStub, waitForEnv: waitStub};

      const result = await command.run();

      expect(pushStub.calledOnce).to.equal(true);
      expect(waitStub.calledOnce).to.equal(true);
      expect(result.state).to.equal('ACTIVE');
    });

    it('skips waitForEnv when push has no target', async () => {
      const command = createCommand();

      stubParse(
        command,
        {
          project: 'my-project',
          wait: true,
          'poll-interval': 10,
          timeout: 600,
          'build-dir': 'build',
          'ssr-only': 'ssr.js',
          'ssr-shared': 'static/**/*',
          'ssr-param': [],
        },
        {},
      );
      await command.init();

      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(false);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'warn').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

      const pushStub = sinon.stub().resolves({
        bundleId: 123,
        deployed: false,
        message: 'auto',
        projectSlug: 'my-project',
      } as any);
      const waitStub = sinon.stub().resolves({} as any);
      command.operations = {...command.operations, pushBundle: pushStub, waitForEnv: waitStub};

      const result = await command.run();

      expect(pushStub.calledOnce).to.equal(true);
      expect(waitStub.notCalled).to.equal(true);
      expect(result.bundleId).to.equal(123);
    });

    it('does not call waitForEnv when --wait is not set', async () => {
      const command = createCommand();

      stubParse(command, {project: 'my-project', environment: 'staging', wait: false}, {bundleId: 12_345});
      await command.init();

      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const deployStub = sinon.stub().resolves({backend: 'legacy', bundleId: 12_345, status: 'pending'} as any);
      const waitStub = sinon.stub().resolves({} as any);
      command.operations = {...command.operations, deployMrtBundle: deployStub, waitForEnv: waitStub};

      await command.run();

      expect(waitStub.notCalled).to.equal(true);
    });

    it('propagates waitForEnv errors', async () => {
      const command = createCommand();

      stubParse(
        command,
        {project: 'my-project', environment: 'staging', wait: true, 'poll-interval': 10, timeout: 600},
        {bundleId: 12_345},
      );
      await command.init();

      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon
        .stub(command, 'resolvedConfig')
        .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

      const deployStub = sinon.stub().resolves({backend: 'legacy', bundleId: 12_345, status: 'pending'} as any);
      const waitStub = sinon.stub().rejects(new Error('Environment publish failed'));
      command.operations = {...command.operations, deployMrtBundle: deployStub, waitForEnv: waitStub};

      try {
        await command.run();
        expect.fail('Expected error');
      } catch (error: any) {
        expect(error.message).to.include('publish failed');
      }
    });
  });

  describe('403 error guidance', () => {
    it('shows project list suggestion when push fails with 403', async () => {
      const command = createCommand();
      stubParse(command, {project: 'wrong-project', 'build-dir': 'build', 'ssr-param': [], wait: false}, {});
      await command.init();
      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({
        values: {mrtProject: 'wrong-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
      }));

      const pushStub = sinon.stub().rejects(new Error('403 Forbidden'));
      command.operations = {...command.operations, pushBundle: pushStub};

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const [message] = errorStub.firstCall.args;
        expect(message).to.include('b2c mrt project list --limit 10');
      }
    });

    it('shows project list suggestion when deploy fails with 403', async () => {
      const command = createCommand();
      stubParse(command, {project: 'wrong-project', environment: 'staging', wait: false}, {bundleId: 12_345});
      await command.init();
      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({
        values: {mrtProject: 'wrong-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
      }));

      const deployStub = sinon.stub().rejects(new Error('403 Forbidden'));
      command.operations = {...command.operations, deployMrtBundle: deployStub};

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const [message] = errorStub.firstCall.args;
        expect(message).to.include('b2c mrt project list --limit 10');
      }
    });

    it('does not show the legacy project-list suggestion when a SCAPI deploy fails with 403', async () => {
      const command = createCommand();
      stubParse(
        command,
        {project: 'my-project', environment: 'staging', 'mrt-backend': 'scapi', wait: false},
        {bundleId: 12_345},
      );
      await command.init();
      stubCommonAuth(command);
      const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
      stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({
        values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'},
      }));

      const deployStub = sinon.stub().rejects(new Error('403 Forbidden'));
      command.operations = {...command.operations, deployMrtBundle: deployStub};

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const [message] = errorStub.firstCall.args;
        // The suggestion points at the legacy `b2c mrt project list`; under explicit
        // scapi the failure is a SCAPI 403, so it must not be appended.
        expect(message).to.not.include('b2c mrt project list');
      }
    });

    it('does not show suggestion when push fails with non-403 error', async () => {
      const command = createCommand();
      stubParse(command, {project: 'my-project', 'build-dir': 'build', 'ssr-param': [], wait: false}, {});
      await command.init();
      stubCommonAuth(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({
        values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
      }));

      const pushStub = sinon.stub().rejects(new Error('Connection timeout'));
      command.operations = {...command.operations, pushBundle: pushStub};

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const [message] = errorStub.firstCall.args;
        expect(message).to.not.include('b2c mrt project list');
      }
    });

    it('does not show suggestion when deploy fails with non-403 error', async () => {
      const command = createCommand();
      stubParse(command, {project: 'my-project', environment: 'staging', wait: false}, {bundleId: 12_345});
      await command.init();
      stubCommonAuth(command);
      stubBackendContext(command);
      sinon.stub(command, 'jsonEnabled').returns(true);
      sinon.stub(command, 'log').returns(void 0);
      sinon.stub(command, 'resolvedConfig').get(() => ({
        values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
      }));

      const deployStub = sinon.stub().rejects(new Error('Connection timeout'));
      command.operations = {...command.operations, deployMrtBundle: deployStub};

      const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

      try {
        await command.run();
        expect.fail('Expected error');
      } catch {
        expect(errorStub.calledOnce).to.equal(true);
        const [message] = errorStub.firstCall.args;
        expect(message).to.not.include('b2c mrt project list');
      }
    });
  });
});
