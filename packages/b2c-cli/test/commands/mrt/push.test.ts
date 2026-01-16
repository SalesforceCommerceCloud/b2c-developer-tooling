/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtPush from '../../../src/commands/mrt/push.js';
import {isolateConfig, restoreConfig} from '../../helpers/config-isolation.js';
import {stubParse} from '../../helpers/stub-parse.js';

describe('mrt push', () => {
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
    return new MrtPush([], config);
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
    sinon.stub(command, 'resolvedConfig').get(() => ({mrtProject: undefined}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('parses --ssr-param and --node-version and calls SDK wrapper', async () => {
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
      },
      {},
    );
    await command.init();

    stubCommonAuth(command);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}));
    sinon.stub(command, 'log').returns(void 0);

    const pushStub = sinon.stub(command, 'pushBundle').resolves({
      bundleId: 1,
      deployed: true,
      message: 'ok',
      projectSlug: 'my-project',
      target: 'staging',
    } as any);

    const result = await command.run();

    expect(pushStub.calledOnce).to.equal(true);
    const [input] = pushStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.target).to.equal('staging');
    expect(input.buildDirectory).to.equal('dist');
    expect(input.ssrParameters.SSRProxyPath).to.equal('/api');
    expect(input.ssrParameters.Foo).to.equal('bar');
    expect(input.ssrParameters.SSRFunctionNodeVersion).to.equal('20.x');
    expect(result.bundleId).to.equal(1);
  });

  it('calls command.error when ssr-param is invalid', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'ssr-param': ['INVALID']}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({mrtProject: 'my-project'}));

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
    }
  });
});
