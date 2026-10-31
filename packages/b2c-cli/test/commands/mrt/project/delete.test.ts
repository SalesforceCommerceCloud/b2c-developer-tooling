/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectDelete from '../../../../src/commands/mrt/project/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project delete', () => {
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
    return new MrtProjectDelete([], config);
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

    stubParse(command, {force: true}, {});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('deletes via the backend wrapper when --force skips the prompt', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {slug: 'my-storefront'});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));

    const delStub = sinon.stub().resolves({backend: 'legacy', raw: undefined});
    command.operations = {...command.operations, deleteProjectWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-storefront');
    expect(input.origin).to.equal('https://example.com');
    // The backend is kept out of the --json payload; result shape stays stable.
    expect(result).to.deep.equal({slug: 'my-storefront', deleted: true});
  });

  it('routes to the SCAPI backend when preference is scapi', async () => {
    const command = createCommand();

    stubParse(command, {force: true, 'mrt-backend': 'scapi'}, {slug: 'my-storefront'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-storefront', mrtBackend: 'scapi'}}));

    const delStub = sinon.stub().resolves({backend: 'scapi', raw: {storefrontId: 'my-storefront'}});
    command.operations = {...command.operations, deleteProjectWithBackend: delStub};

    await command.run();

    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
  });

  it('blocks deletion in safe mode via assertDestructiveOperationAllowed', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {slug: 'my-storefront'});
    await command.init();

    const assertStub = sinon.stub(command, 'assertDestructiveOperationAllowed').throws(new Error('safe mode'));
    const delStub = sinon.stub().resolves({backend: 'legacy', raw: undefined});
    command.operations = {...command.operations, deleteProjectWithBackend: delStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(assertStub.calledOnce).to.equal(true);
      expect(delStub.called).to.equal(false);
    }
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
