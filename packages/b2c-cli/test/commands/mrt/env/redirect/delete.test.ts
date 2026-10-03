/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtRedirectDelete from '../../../../../src/commands/mrt/env/redirect/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

const FROM_PATH = '/old-page';
const REDIRECT_ID = '3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

describe('mrt env redirect delete', () => {
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
    return new MrtRedirectDelete([], config);
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

    stubParse(command, {force: true}, {identifier: FROM_PATH});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('deletes the redirect via the backend wrapper (legacy from_path identifier)', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {identifier: FROM_PATH});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    stubBackendContext(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteRedirectWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.identifier).to.equal(FROM_PATH);
    // `fromPath` mirrors `identifier` for backward compatibility with scripts that
    // read the legacy `--json` key.
    expect(result).to.deep.equal({identifier: FROM_PATH, fromPath: FROM_PATH, deleted: true});
    // The resolved backend is intentionally kept out of the --json payload.
    expect(result).to.not.have.property('backend');
  });

  it('forwards the resolved SCAPI backend context with the UUID identifier', async () => {
    const command = createCommand();

    stubParse(command, {force: true, 'mrt-backend': 'scapi'}, {identifier: REDIRECT_ID});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const delStub = sinon.stub().resolves({backend: 'scapi'});
    command.operations = {...command.operations, deleteRedirectWithBackend: delStub};

    await command.run();

    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.identifier).to.equal(REDIRECT_ID);
  });

  it('blocks deletion in safe mode before touching the backend', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {identifier: FROM_PATH});
    await command.init();

    const assertStub = sinon
      .stub(command, 'assertDestructiveOperationAllowed')
      .throws(new Error('destructive blocked'));
    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteRedirectWithBackend: delStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect((error as Error).message).to.equal('destructive blocked');
    }
    expect(assertStub.calledOnce).to.equal(true);
    expect(delStub.called).to.equal(false);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
