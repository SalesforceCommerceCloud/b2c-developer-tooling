/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtAccessControlCreate from '../../../../../src/commands/mrt/env/access-control/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env access-control create', () => {
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
    return new MrtAccessControlCreate([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

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

  it('calls command.error when project is missing', async () => {
    const command = createCommand();

    stubParse(command, {}, {value: 'my-secret-header'});
    await command.init();

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

    stubParse(command, {}, {value: 'my-secret-header'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('creates the header via the backend wrapper and returns the raw response under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {value: 'my-secret-header'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const raw = {id: 'h1', value: '****3456'};
    const createStub = sinon.stub().resolves({backend: 'legacy', header: {id: 'h1', backend: 'legacy'}, raw});
    command.operations = {...command.operations, createAccessControlHeaderWithBackend: createStub};

    const result = await command.run();

    expect(createStub.calledOnce).to.equal(true);
    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.value).to.equal('my-secret-header');
    expect(input.origin).to.equal('https://example.com');
    // --json emits the backend-native create response verbatim.
    expect(result).to.deep.equal(raw);
  });

  it('forwards the resolved SCAPI backend context to the wrapper', async () => {
    const command = createCommand();

    stubParse(command, {'mrt-backend': 'scapi'}, {value: 'my-secret-header'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const createStub = sinon.stub().resolves({backend: 'scapi', header: {id: 'h1', backend: 'scapi'}, raw: {id: 'h1'}});
    command.operations = {...command.operations, createAccessControlHeaderWithBackend: createStub};

    await command.run();

    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.value).to.equal('my-secret-header');
  });

  it('emits no human progress under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {value: 'my-secret-header'});
    await command.init();

    sinon.stub(command, 'jsonEnabled').returns(true);
    stubBackendContext(command);
    const logStub = sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging'},
    }));

    const createStub = sinon
      .stub()
      .resolves({backend: 'legacy', header: {id: 'h1', backend: 'legacy'}, raw: {id: 'h1'}});
    command.operations = {...command.operations, createAccessControlHeaderWithBackend: createStub};

    await command.run();

    expect(createStub.calledOnce).to.equal(true);
    expect(logStub.called, 'no human progress under --json').to.equal(false);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
