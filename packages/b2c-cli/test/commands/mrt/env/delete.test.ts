/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvDelete from '../../../../src/commands/mrt/env/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
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

    stubParse(command, {force: true}, {slug: 'staging'});
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

  it('deletes without prompt via the backend-aware operation when --force is set', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {slug: 'staging'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const deleteStub = sinon.stub().resolves({backend: 'legacy', raw: null} as any);
    command.operations = {...command.operations, deleteEnvironmentWithBackend: deleteStub};

    const result = await command.run();

    expect(deleteStub.calledOnce).to.equal(true);
    const [input] = deleteStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(result).to.deep.equal({slug: 'staging', project: 'my-project', deleted: true});
  });

  it('skips the confirmation prompt in JSON mode when --force is not set', async () => {
    const command = createCommand();

    stubParse(command, {force: false}, {slug: 'staging'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging'}}));

    const confirmStub = sinon.stub().resolves(true);
    const deleteStub = sinon.stub().resolves({backend: 'legacy', raw: null} as any);
    command.operations = {...command.operations, confirm: confirmStub, deleteEnvironmentWithBackend: deleteStub};

    await command.run();

    expect(confirmStub.called).to.equal(false);
    expect(deleteStub.calledOnce).to.equal(true);
  });

  it('deletes via the SCAPI backend', async () => {
    const command = createCommand();

    stubParse(command, {force: true, 'mrt-backend': 'scapi'}, {slug: 'staging'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging'}}));

    const deleteStub = sinon
      .stub()
      .resolves({backend: 'scapi', raw: {environmentId: 'staging', status: 'deleting'}} as any);
    command.operations = {...command.operations, deleteEnvironmentWithBackend: deleteStub};

    await command.run();

    const [input] = deleteStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
