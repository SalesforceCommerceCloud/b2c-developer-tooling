/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtProjectUpdate from '../../../../src/commands/mrt/project/update.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project update', () => {
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
    return new MrtProjectUpdate([], config);
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

    stubParse(command, {name: 'New Name'}, {});
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

  it('errors when no updatable field is provided', async () => {
    const command = createCommand();

    stubParse(command, {}, {slug: 'my-storefront'});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-storefront'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('At least one updatable field');
    }
  });

  it('updates via the legacy backend and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {name: 'New Name', region: 'eu-west-1'}, {slug: 'my-storefront'});
    await command.init();

    stubBackendContext(command, {preference: 'legacy'});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-storefront', mrtOrigin: 'https://example.com'},
    }));

    const updateStub = sinon.stub().resolves({
      backend: 'legacy',
      project: {id: 'my-storefront', name: 'New Name', backend: 'legacy'},
      raw: {slug: 'my-storefront', name: 'New Name'},
    } as any);
    command.operations = {...command.operations, updateProjectWithBackend: updateStub};

    const result = await command.run();

    expect(updateStub.calledOnce).to.equal(true);
    const [input] = updateStub.firstCall.args;
    expect(input.preference).to.equal('legacy');
    expect(input.projectSlug).to.equal('my-storefront');
    expect(input.name).to.equal('New Name');
    expect(input.ssrRegion).to.equal('eu-west-1');
    expect(result.slug).to.equal('my-storefront');
  });

  it('updates via the SCAPI backend, forwarding sites and boolean flags (full-replace)', async () => {
    const command = createCommand();

    stubParse(
      command,
      {site: ['RefArch', 'OtherSite'], 'ssr-architecture': 'arm64', 'allow-cookies': false, 'mrt-backend': 'scapi'},
      {slug: 'my-storefront'},
    );
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-storefront', mrtBackend: 'scapi'}}));

    const updateStub = sinon.stub().resolves({
      backend: 'scapi',
      project: {id: 'my-storefront', name: 'My Storefront', backend: 'scapi'},
      raw: {storefrontId: 'my-storefront'},
    } as any);
    command.operations = {...command.operations, updateProjectWithBackend: updateStub};

    const result = await command.run();

    const [input] = updateStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.sites).to.deep.equal(['RefArch', 'OtherSite']);
    expect(input.ssrArchitecture).to.equal('arm64');
    expect(input.allowCookies).to.equal(false);
    expect(result.storefrontId).to.equal('my-storefront');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
