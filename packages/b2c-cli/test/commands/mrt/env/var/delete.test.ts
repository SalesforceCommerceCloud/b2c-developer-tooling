/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvVarDelete from '../../../../../src/commands/mrt/env/var/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env var delete', () => {
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
    return new MrtEnvVarDelete([], config);
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

    stubParse(command, {}, {key: 'MY_VAR'});
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

  it('calls command.error when environment is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
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

  it('deletes env var via SDK wrapper', async () => {
    const command = createCommand();

    stubParse(command, {}, {key: 'MY_VAR'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {
        mrtProject: 'my-project',
        mrtEnvironment: 'staging',
        mrtOrigin: 'https://example.com',
      },
    }));

    const delStub = sinon.stub().resolves(void 0);
    command.operations = {...command.operations, deleteEnvVar: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [input] = delStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.key).to.equal('MY_VAR');
    expect(result.key).to.equal('MY_VAR');
  });
});
