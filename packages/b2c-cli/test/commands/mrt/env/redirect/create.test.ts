/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtRedirectCreate from '../../../../../src/commands/mrt/env/redirect/create.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env redirect create', () => {
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
    return new MrtRedirectCreate([], config);
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

    stubParse(command, {from: '/old', to: '/new', status: 301}, {});
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

  it('creates the redirect via the backend wrapper and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(
      command,
      {from: '/old', to: '/new', status: 302, 'forward-querystring': true, 'forward-wildcard': false},
      {},
    );
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const raw = {from_path: '/old', to_url: '/new'};
    const createStub = sinon.stub().resolves({
      backend: 'legacy',
      redirect: {id: '/old', source: '/old', destination: '/new', backend: 'legacy'},
      raw,
    });
    command.operations = {...command.operations, createRedirectWithBackend: createStub};

    const result = await command.run();

    expect(createStub.calledOnce).to.equal(true);
    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.source).to.equal('/old');
    expect(input.destination).to.equal('/new');
    expect(input.httpStatusCode).to.equal(302);
    expect(input.forwardQuerystring).to.equal(true);
    expect(input.forwardWildcard).to.equal(false);
    expect(result).to.deep.equal(raw);
  });

  it('forwards the resolved SCAPI backend context to the wrapper', async () => {
    const command = createCommand();

    stubParse(command, {from: '/old', to: '/new', status: 301, 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const createStub = sinon
      .stub()
      .resolves({backend: 'scapi', redirect: {id: 'uuid-1', backend: 'scapi'}, raw: {redirectId: 'uuid-1'}});
    command.operations = {...command.operations, createRedirectWithBackend: createStub};

    await command.run();

    const [input] = createStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.source).to.equal('/old');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
