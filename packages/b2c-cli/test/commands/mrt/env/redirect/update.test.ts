/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtRedirectUpdate from '../../../../../src/commands/mrt/env/redirect/update.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

const FROM_PATH = '/old-page';
const REDIRECT_ID = '3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

describe('mrt env redirect update', () => {
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
    return new MrtRedirectUpdate([], config);
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

    stubParse(command, {to: '/new'}, {identifier: FROM_PATH});
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

  it('errors when no updatable field is supplied', async () => {
    const command = createCommand();

    stubParse(command, {}, {identifier: FROM_PATH});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging'}}));

    const errorStub = stubErrorToThrow(command);
    const updateStub = sinon.stub().resolves({backend: 'legacy', redirect: {}, raw: {}});
    command.operations = {...command.operations, updateRedirectWithBackend: updateStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('at least one field');
    }
    expect(updateStub.called).to.equal(false);
  });

  it('updates only the supplied fields via the backend wrapper and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {to: '/new', 'forward-querystring': false}, {identifier: FROM_PATH});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const raw = {from_path: FROM_PATH, to_url: '/new'};
    const updateStub = sinon.stub().resolves({
      backend: 'legacy',
      redirect: {id: FROM_PATH, source: FROM_PATH, destination: '/new', backend: 'legacy'},
      raw,
    });
    command.operations = {...command.operations, updateRedirectWithBackend: updateStub};

    const result = await command.run();

    expect(updateStub.calledOnce).to.equal(true);
    const [input] = updateStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.identifier).to.equal(FROM_PATH);
    expect(input.destination).to.equal('/new');
    expect(input.forwardQuerystring).to.equal(false);
    // Status and wildcard were not supplied, so they stay undefined (partial update).
    expect(input.httpStatusCode).to.equal(undefined);
    expect(input.forwardWildcard).to.equal(undefined);
    expect(result).to.deep.equal(raw);
  });

  it('forwards the resolved SCAPI backend context with the UUID identifier', async () => {
    const command = createCommand();

    stubParse(command, {status: 302, 'mrt-backend': 'scapi'}, {identifier: REDIRECT_ID});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const updateStub = sinon
      .stub()
      .resolves({backend: 'scapi', redirect: {id: REDIRECT_ID, backend: 'scapi'}, raw: {redirectId: REDIRECT_ID}});
    command.operations = {...command.operations, updateRedirectWithBackend: updateStub};

    await command.run();

    const [input] = updateStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.identifier).to.equal(REDIRECT_ID);
    expect(input.httpStatusCode).to.equal(302);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
