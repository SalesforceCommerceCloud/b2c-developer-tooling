/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvDelete from '../../../../src/commands/mrt/env/delete.js';
import {isolateConfig, restoreConfig} from '../../../helpers/config-isolation.js';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env delete', () => {
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
    return new MrtEnvDelete([], config);
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

    stubParse(command, {force: true}, {slug: 'staging'});
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

  it('deletes without prompt when --force is set', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {slug: 'staging'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const deleteStub = sinon.stub(command, 'deleteEnv').resolves(void 0);

    const result = await command.run();

    expect(deleteStub.calledOnce).to.equal(true);
    expect(result.slug).to.equal('staging');
  });

  it('skips confirmation prompt in JSON mode when --force is not set', async () => {
    const command = createCommand();

    stubParse(command, {force: false}, {slug: 'staging'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    const deleteStub = sinon.stub(command, 'deleteEnv').resolves(void 0);

    await command.run();

    expect(deleteStub.calledOnce).to.equal(true);
  });
});
