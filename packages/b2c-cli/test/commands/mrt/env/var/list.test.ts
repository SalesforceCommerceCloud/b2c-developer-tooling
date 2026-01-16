/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvVarList from '../../../../../src/commands/mrt/env/var/list.js';
import {isolateConfig, restoreConfig} from '../../../../helpers/config-isolation.js';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env var list', () => {
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
    return new MrtEnvVarList([], config);
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
    sinon.stub(command, 'resolvedConfig').get(() => ({mrtProject: undefined, mrtEnvironment: 'staging'}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('returns SDK result in JSON mode', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      mrtProject: 'my-project',
      mrtEnvironment: 'staging',
      mrtOrigin: 'https://example.com',
    }));

    const listStub = sinon.stub(command, 'listEnvVars').resolves({variables: [{name: 'A', value: '1'}]} as any);

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    expect(result.variables).to.have.lengthOf(1);
  });

  it('does not block in non-JSON mode (renderTable is stubbed)', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({mrtProject: 'my-project', mrtEnvironment: 'staging'}));

    sinon.stub(command, 'renderTable').returns(void 0);
    sinon.stub(command, 'listEnvVars').resolves({variables: [{name: 'A', value: '1'}]} as any);

    await command.run();

    expect((command.renderTable as sinon.SinonStub).calledOnce).to.equal(true);
  });
});
