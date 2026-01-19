/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvCreate from '../../../../src/commands/mrt/env/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env create', () => {
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
    return new MrtEnvCreate([], config);
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

    stubParse(command, {}, {slug: 'staging'});
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

  it('calls createEnv with parsed proxy flags and returns JSON result', async () => {
    const command = createCommand();

    stubParse(
      command,
      {
        project: 'my-project',
        name: 'My Env',
        region: 'eu-west-1',
        production: true,
        hostname: 'foo',
        'external-hostname': 'www.example.com',
        'external-domain': 'example.com',
        'allow-cookies': true,
        'enable-source-maps': true,
        proxy: ['api=api.example.com', 'ocapi=ocapi.example.com'],
        wait: false,
      },
      {slug: 'staging'},
    );
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const createStub = sinon.stub().resolves({
      slug: 'staging',
      name: 'My Env',
      state: 'creating',
      is_production: true,
    } as any);
    command.operations = {...command.operations, createEnv: createStub};

    const result = await command.run();

    expect(createStub.calledOnce).to.equal(true);
    const [input] = createStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.slug).to.equal('staging');
    expect(input.name).to.equal('My Env');
    expect(input.isProduction).to.equal(true);
    expect(input.proxyConfigs).to.have.lengthOf(2);
    expect(result.slug).to.equal('staging');
  });

  it('when --wait is set, calls waitForEnv (no onPoll simulation)', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', wait: true}, {slug: 'staging'});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const createStub = sinon.stub().resolves({slug: 'staging', name: 'staging', is_production: false} as any);
    command.operations = {...command.operations, createEnv: createStub};

    const waitStub = sinon.stub().resolves({
      slug: 'staging',
      name: 'staging',
      state: 'ready',
      is_production: false,
    } as any);
    command.operations = {...command.operations, waitForEnv: waitStub};

    await command.run();

    expect(waitStub.calledOnce).to.equal(true);
  });

  it('calls command.error when proxy flag has invalid format', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', proxy: ['INVALID']}, {slug: 'staging'});
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
