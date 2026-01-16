/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvVarSet from '../../../../../src/commands/mrt/env/var/set.js';
import {isolateConfig, restoreConfig} from '../../../../helpers/config-isolation.js';

describe('mrt env var set', () => {
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
    return new MrtEnvVarSet([], config);
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

    sinon
      .stub(command, 'parse')
      .resolves({argv: ['A=1'], args: {}, flags: {}, metadata: {}, raw: [], nonExistentFlags: {}});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('sets a space-containing KEY=value token as a single variable', async () => {
    const command = createCommand();

    sinon
      .stub(command, 'parse')
      .resolves({argv: ['MESSAGE=hello world'], args: {}, flags: {}, metadata: {}, raw: [], nonExistentFlags: {}});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {
        mrtProject: 'my-project',
        mrtEnvironment: 'production',
        mrtOrigin: 'https://example.com',
      },
    }));

    const setStub = sinon.stub(command, 'setEnvVars').resolves(void 0);

    const result = await command.run();

    expect(setStub.calledOnce).to.equal(true);
    const [input] = setStub.firstCall.args;
    expect(input.variables.MESSAGE).to.equal('hello world');
    expect(result.variables.MESSAGE).to.equal('hello world');
  });
});
