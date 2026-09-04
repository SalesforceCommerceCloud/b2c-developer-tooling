/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleUploadV2 from '../../../../src/commands/mrt/bundle/upload-v2.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle upload-v2', () => {
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

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  const successResult = {
    bundleId: 456,
    projectSlug: 'my-project',
    message: 'Test v2',
    warnings: [],
    matches: {'ssr.js': 'ssrOnly'},
  };

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {'ssr-param': [], 'cc-override': []}, {});
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

  it('maps every flag to the pushBundleV2 options and returns the result', async () => {
    const command = createCommand();

    stubParse(
      command,
      {
        project: 'my-project',
        'build-dir': 'dist',
        'root-dir': 'bld',
        'config-path': '.mrt/config.json',
        'match-mode': 'ignore_missing',
        'ssr-only': 'ssr.js',
        'ssr-shared': 'static/**/*',
        'node-version': '20.x',
        'ssr-param': ['EnvBasePath=/mobify', 'Foo=bar'],
        dependencies: '{"react":"18.0.0"}',
        'cc-override': ['override-a', 'override-b'],
        message: 'Test v2',
      },
      {},
    );
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const pushStub = sinon.stub().resolves(successResult as any);
    command.operations = {...command.operations, pushBundleV2: pushStub};

    const result = await command.run();

    expect(pushStub.calledOnce).to.equal(true);
    const [input] = pushStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.buildDirectory).to.equal('dist');
    expect(input.rootDir).to.equal('bld');
    expect(input.configPath).to.equal('.mrt/config.json');
    expect(input.matchMode).to.equal('ignore_missing');
    expect(input.ssrOnly).to.deep.equal(['ssr.js']);
    expect(input.ssrShared).to.deep.equal(['static/**/*']);
    expect(input.ssrParameters.EnvBasePath).to.equal('/mobify');
    expect(input.ssrParameters.Foo).to.equal('bar');
    expect(input.ssrParameters.SSRFunctionNodeVersion).to.equal('20.x');
    expect(input.bundleMetadata.dependencies).to.deep.equal({react: '18.0.0'});
    expect(input.bundleMetadata.ccOverrides).to.deep.equal(['override-a', 'override-b']);
    expect(input.origin).to.equal('https://example.com');
    expect(result.bundleId).to.equal(456);
  });

  it('applies server defaults when optional flags are omitted', async () => {
    const command = createCommand();

    stubParse(
      command,
      {
        project: 'my-project',
        'build-dir': 'build',
        'root-dir': 'bld',
        'config-path': '.mrt/config.json',
        'match-mode': 'strict',
        'ssr-param': [],
        'cc-override': [],
      },
      {},
    );
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    const pushStub = sinon.stub().resolves(successResult as any);
    command.operations = {...command.operations, pushBundleV2: pushStub};

    await command.run();

    const [input] = pushStub.firstCall.args;
    expect(input.matchMode).to.equal('strict');
    expect(input.ssrOnly).to.equal(undefined);
    expect(input.ssrShared).to.equal(undefined);
    // No metadata flags provided -> bundleMetadata omitted entirely.
    expect(input.bundleMetadata).to.equal(undefined);
  });

  it('prints warnings returned by pushBundleV2', async () => {
    const command = createCommand();
    const warning = 'x86 support ends January 31, 2027. Switch to ARM in environment settings to avoid disruptions';

    stubParse(command, {project: 'my-project', 'ssr-param': [], 'cc-override': []}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    const warnStub = sinon.stub(command, 'warn').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    const pushStub = sinon.stub().resolves({...successResult, warnings: [warning]} as any);
    command.operations = {...command.operations, pushBundleV2: pushStub};

    await command.run();

    expect(warnStub.calledWith(warning)).to.equal(true);
  });

  it('throws when ssr-param has invalid format', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'ssr-param': ['INVALID'], 'cc-override': []}, {});
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

  it('surfaces a 403 auth error with the project-list suggestion', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'ssr-param': [], 'cc-override': []}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    const errorStub = stubErrorToThrow(command);
    const pushStub = sinon.stub().rejects(new Error('403 Forbidden'));
    command.operations = {...command.operations, pushBundleV2: pushStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      const [message] = errorStub.firstCall.args;
      expect(message).to.include('Upload failed');
      expect(message).to.include('b2c mrt project list');
    }
  });
});
