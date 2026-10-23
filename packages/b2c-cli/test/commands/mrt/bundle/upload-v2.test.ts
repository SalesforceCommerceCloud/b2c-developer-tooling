/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleDeploy from '../../../../src/commands/mrt/bundle/deploy.js';
import MrtBundleUploadV2 from '../../../../src/commands/mrt/bundle/upload-v2.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle upload-v2 (deprecated alias of deploy --v2)', () => {
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
    return new MrtBundleUploadV2([], config);
  }

  const pushResult = {
    backend: 'legacy',
    bundleId: 456,
    message: 'Test v2',
    deployed: false,
    raw: {bundleId: 456, projectSlug: 'my-project', message: 'Test v2', warnings: [], matches: {}},
  };

  /** Initializes the command with the given parsed flags and stubs everything outside the push call. */
  async function initAlias(flags: Record<string, unknown>, args: Record<string, unknown> = {}) {
    const command = createCommand();
    stubParse(command, {project: 'my-project', 'ssr-param': [], 'cc-override': [], wait: false, ...flags}, args);
    await command.init();

    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
    sinon
      .stub(command, 'getMrtBackendContext')
      .returns({preference: 'legacy', scapiConnection: undefined, legacyAuth: {}} as any);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    const warnStub = sinon.stub(command, 'warn').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const pushStub = sinon.stub().resolves(pushResult as any);
    command.operations = {...command.operations, pushMrtBundle: pushStub};
    return {command, pushStub, warnStub};
  }

  it('is a deploy command with --v2 forced on', () => {
    expect(Object.getPrototypeOf(MrtBundleUploadV2)).to.equal(MrtBundleDeploy);
    expect((MrtBundleUploadV2.flags as any).v2.default).to.equal(true);
    // Every deploy flag is available, including the v2 metadata flags.
    for (const name of Object.keys(MrtBundleDeploy.flags)) {
      expect(MrtBundleUploadV2.flags, name).to.have.property(name);
    }
    expect(MrtBundleUploadV2.flags).to.have.property('dependencies');
    expect(MrtBundleUploadV2.flags).to.have.property('cc-override');
  });

  it('warns that the command is deprecated in favor of deploy --v2 and still uploads', async () => {
    const {command, pushStub, warnStub} = await initAlias({v2: true});

    await command.run();

    expect(warnStub.firstCall.args[0]).to.include('deprecated');
    expect(warnStub.firstCall.args[0]).to.include('b2c mrt bundle deploy --v2');
    expect(pushStub.calledOnce).to.equal(true);
  });

  it('runs the same push as deploy --v2 with identical options', async () => {
    const flags = {
      'build-dir': 'dist',
      'root-dir': 'bld',
      'config-path': '.mrt/config.json',
      'match-mode': 'ignore_missing',
      'ssr-only': 'ssr.js',
      'ssr-shared': 'static/**/*',
      'node-version': '20.x',
      'ssr-param': ['EnvBasePath=/mobify'],
      dependencies: '{"react":"18.0.0"}',
      'cc-override': ['override-a'],
      message: 'Test v2',
      v2: true,
    };

    const alias = await initAlias(flags);
    await alias.command.run();

    const deployCommand: any = new MrtBundleDeploy([], config);
    stubParse(deployCommand, {project: 'my-project', wait: false, ...flags}, {});
    await deployCommand.init();
    sinon.stub(deployCommand, 'requireMrtCredentials').returns(void 0);
    sinon
      .stub(deployCommand, 'getMrtBackendContext')
      .returns({preference: 'legacy', scapiConnection: undefined, legacyAuth: {}} as any);
    sinon.stub(deployCommand, 'jsonEnabled').returns(true);
    sinon.stub(deployCommand, 'log').returns(void 0);
    sinon.stub(deployCommand, 'warn').returns(void 0);
    sinon
      .stub(deployCommand, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));
    const deployPush = sinon.stub().resolves(pushResult as any);
    deployCommand.operations = {...deployCommand.operations, pushMrtBundle: deployPush};
    await deployCommand.run();

    // onResolve is a per-instance closure; everything else must match exactly.
    const {onResolve: _aliasResolve, ...aliasInput} = alias.pushStub.firstCall.args[0];
    const {onResolve: _deployResolve, ...deployInput} = deployPush.firstCall.args[0];
    expect(aliasInput).to.deep.equal(deployInput);
    const [input] = alias.pushStub.firstCall.args;
    expect(input.v2).to.equal(true);
    expect(input.bundleMetadata).to.deep.equal({dependencies: {react: '18.0.0'}, ccOverrides: ['override-a']});
    expect(input.matchMode).to.equal('ignore_missing');
  });

  it('omits bundleMetadata and v2 layout overrides when those flags are not given', async () => {
    const {command, pushStub, warnStub} = await initAlias({v2: true});

    await command.run();

    const [input] = pushStub.firstCall.args;
    expect(input.v2).to.equal(true);
    expect(input.bundleMetadata).to.equal(undefined);
    expect(input.rootDir).to.equal(undefined);
    expect(input.matchMode).to.equal(undefined);
    // Only the deprecation warning; nothing about ignored v2 flags.
    expect(warnStub.callCount).to.equal(1);
  });

  it('deploys when an environment is given, like deploy --v2', async () => {
    const {command, pushStub} = await initAlias({v2: true, environment: 'staging'});
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging'}}));

    await command.run();

    expect(pushStub.firstCall.args[0].targetSlug).to.equal('staging');
  });

  it('rejects a bundle ID and points to deploy', async () => {
    const {command, pushStub} = await initAlias({v2: true}, {bundleId: 123});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.firstCall.args[0]).to.include('b2c mrt bundle deploy <bundleId>');
      expect(pushStub.called).to.equal(false);
    }
  });

  it('reports a 403 as a push failure with the project-list suggestion', async () => {
    const {command, pushStub} = await initAlias({v2: true});
    const errorStub = sinon.stub(command, 'error').throws(new Error('Expected error'));
    pushStub.rejects(new Error('403 Forbidden'));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      const [message] = errorStub.firstCall.args;
      expect(message).to.include('Push failed');
      expect(message).to.include('b2c mrt project list');
    }
  });
});
