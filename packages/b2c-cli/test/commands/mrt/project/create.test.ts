/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectCreate from '../../../../src/commands/mrt/project/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project create', () => {
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
    return new MrtProjectCreate([], config);
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

  it('errors when the legacy backend will run but --organization is missing', async () => {
    const command = createCommand();

    stubParse(command, {type: 'storefront_next'}, {name: 'My Storefront'});
    await command.init();

    // auto with no SCAPI connection resolves to legacy, which requires --organization.
    stubBackendContext(command, {preference: 'auto', scapiConnection: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('--organization');
    }
  });

  it('errors when the SCAPI backend will run but no --site is provided', async () => {
    const command = createCommand();

    stubParse(command, {type: 'storefront_next'}, {name: 'My Storefront'});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtBackend: 'scapi'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('--site');
    }
  });

  it('creates via the legacy backend and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {organization: 'my-org', region: 'us-east-1', type: 'storefront_next'}, {name: 'My Storefront'});
    await command.init();

    stubBackendContext(command, {preference: 'legacy'});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));

    const createStub = sinon.stub().resolves({
      backend: 'legacy',
      project: {id: 'my-storefront', name: 'My Storefront', backend: 'legacy'},
      raw: {slug: 'my-storefront', name: 'My Storefront'},
    } as any);
    command.operations = {...command.operations, createProjectWithBackend: createStub};

    const result = await command.run();

    expect(createStub.calledOnce).to.equal(true);
    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('legacy');
    expect(input.name).to.equal('My Storefront');
    expect(input.organization).to.equal('my-org');
    expect(input.ssrRegion).to.equal('us-east-1');
    expect(input.slug).to.equal('my-storefront');
    // --json emits the raw backend-native create response verbatim.
    expect(result.slug).to.equal('my-storefront');
  });

  it('creates via the SCAPI backend, forwarding type and sites', async () => {
    const command = createCommand();

    stubParse(
      command,
      {type: 'storefront_next', site: ['RefArch', 'OtherSite'], 'mrt-backend': 'scapi'},
      {name: 'My Storefront'},
    );
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtBackend: 'scapi'}}));

    const createStub = sinon.stub().resolves({
      backend: 'scapi',
      project: {id: 'my-storefront', name: 'My Storefront', backend: 'scapi'},
      raw: {storefrontId: 'my-storefront', setupStatus: 'in_progress'},
    } as any);
    command.operations = {...command.operations, createProjectWithBackend: createStub};

    const result = await command.run();

    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.type).to.equal('storefront_next');
    expect(input.sites).to.deep.equal(['RefArch', 'OtherSite']);
    expect(result.storefrontId).to.equal('my-storefront');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
