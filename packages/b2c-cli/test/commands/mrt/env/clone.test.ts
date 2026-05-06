/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvClone from '../../../../src/commands/mrt/env/clone.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env clone', () => {
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
    return new MrtEnvClone([], config);
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
  }

  it('errors when project is missing', async () => {
    const command = createCommand();
    stubParse(command, {from: 'staging'}, {slug: 'staging-copy'});
    await command.init();
    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));
    const errorStub = sinon.stub(command, 'error').throws(new Error('expected'));

    try {
      await command.run();
      expect.fail('expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('passes flags through to cloneEnv and returns the new env', async () => {
    const command = createCommand();
    stubParse(
      command,
      {
        from: 'staging',
        'external-hostname': 'qa.example.com',
        'certificate-id': 123,
        'clone-redirects': true,
        'clone-env-vars': true,
        'clone-b2c-info': false,
        wait: false,
      },
      {slug: 'qa'},
    );
    await command.init();
    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p', mrtOrigin: 'https://example.com'}}));

    const cloneStub = sinon.stub().resolves({slug: 'qa', name: 'qa', state: 'CREATE_IN_PROGRESS'} as any);
    const waitStub = sinon.stub();
    command.operations = {cloneEnv: cloneStub, waitForEnv: waitStub};

    const result = await command.run();

    expect(cloneStub.calledOnce).to.equal(true);
    const [input] = cloneStub.firstCall.args;
    expect(input.projectSlug).to.equal('p');
    expect(input.slug).to.equal('qa');
    expect(input.fromSlug).to.equal('staging');
    expect(input.externalHostname).to.equal('qa.example.com');
    expect(input.certificateId).to.equal(123);
    expect(input.cloneRedirects).to.equal(true);
    expect(input.cloneEnvironmentVariables).to.equal(true);
    expect(input.cloneB2cTargetInfo).to.equal(false);
    expect(waitStub.notCalled).to.equal(true);
    expect(result.slug).to.equal('qa');
  });

  it('waits for env when --wait is set', async () => {
    const command = createCommand();
    stubParse(
      command,
      {
        from: 'staging',
        wait: true,
        'poll-interval': 1,
        timeout: 30,
        'clone-redirects': false,
        'clone-env-vars': false,
        'clone-b2c-info': false,
      },
      {slug: 'qa'},
    );
    await command.init();
    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p'}}));

    const cloneStub = sinon.stub().resolves({slug: 'qa', state: 'CREATE_IN_PROGRESS'} as any);
    const waitStub = sinon.stub().resolves({slug: 'qa', state: 'ACTIVE'} as any);
    command.operations = {cloneEnv: cloneStub, waitForEnv: waitStub};

    const result = await command.run();

    expect(waitStub.calledOnce).to.equal(true);
    expect(result.state).to.equal('ACTIVE');
  });
});
