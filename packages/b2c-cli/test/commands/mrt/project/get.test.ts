/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MrtProjectGet from '../../../../src/commands/mrt/project/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project get', () => {
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
    return new MrtProjectGet([], config);
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

    stubParse(command, {}, {});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('routes through the backend-aware get and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {slug: 'my-storefront'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));

    const getStub = sinon.stub().resolves({
      backend: 'legacy',
      project: {id: 'my-storefront', name: 'My Storefront', backend: 'legacy'},
      raw: {slug: 'my-storefront', name: 'My Storefront'},
    } as any);
    command.operations = {...command.operations, getProjectWithBackend: getStub};

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-storefront');
    expect(input.origin).to.equal('https://example.com');
    // --json emits the raw backend-native project response verbatim.
    expect(result.slug).to.equal('my-storefront');
  });

  it('forwards the resolved SCAPI backend context and emits the native shape under --json', async () => {
    const command = createCommand();

    stubParse(command, {'mrt-backend': 'scapi'}, {slug: 'my-storefront'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-storefront', mrtBackend: 'scapi'}}));

    const getStub = sinon.stub().resolves({
      backend: 'scapi',
      project: {id: 'my-storefront', name: 'My Storefront', backend: 'scapi'},
      raw: {storefrontId: 'my-storefront', storefrontName: 'My Storefront', setupStatus: 'ok'},
    } as any);
    command.operations = {...command.operations, getProjectWithBackend: getStub};

    const result = await command.run();

    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(result.storefrontId).to.equal('my-storefront');
  });

  it('prints the detail view in non-JSON mode', async () => {
    const command = createCommand();

    stubParse(command, {}, {slug: 'my-storefront'});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(ux, 'stdout').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-storefront'}}));

    const getStub = sinon.stub().resolves({
      backend: 'scapi',
      project: {id: 'my-storefront', name: 'My Storefront', backend: 'scapi', sites: ['RefArch']},
      raw: {storefrontId: 'my-storefront'},
    } as any);
    command.operations = {...command.operations, getProjectWithBackend: getStub};

    // Does not throw while formatting the detail view.
    await command.run();

    expect(getStub.calledOnce).to.equal(true);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
