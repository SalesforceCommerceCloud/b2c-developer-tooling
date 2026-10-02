/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MrtRedirectGet from '../../../../../src/commands/mrt/env/redirect/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

const FROM_PATH = '/old-page';
const REDIRECT_ID = '3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

describe('mrt env redirect get', () => {
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
    return new MrtRedirectGet([], config);
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

    stubParse(command, {}, {identifier: FROM_PATH});
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

  it('gets the redirect via the backend wrapper and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {identifier: FROM_PATH});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const raw = {from_path: FROM_PATH, to_url: '/new'};
    const getStub = sinon.stub().resolves({
      backend: 'legacy',
      redirect: {id: FROM_PATH, source: FROM_PATH, destination: '/new', backend: 'legacy'},
      raw,
    });
    command.operations = {...command.operations, getRedirectWithBackend: getStub};

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.identifier).to.equal(FROM_PATH);
    expect(result).to.deep.equal(raw);
  });

  it('prints the redirect detail via ux.stdout in non-JSON mode', async () => {
    const command = createCommand();

    stubParse(command, {}, {identifier: REDIRECT_ID});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging'},
    }));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0);
    const getStub = sinon.stub().resolves({
      backend: 'scapi',
      redirect: {
        id: REDIRECT_ID,
        source: '/old',
        destination: '/new',
        httpStatusCode: 302,
        forwardQuerystring: true,
        forwardWildcard: false,
        status: 'completed',
        createdAt: '2026-04-08T21:47:28.188965Z',
        createdBy: 'dev@example.com',
        backend: 'scapi',
      },
      raw: {redirectId: REDIRECT_ID},
    });
    command.operations = {...command.operations, getRedirectWithBackend: getStub};

    await command.run();

    expect(stdoutStub.called).to.equal(true);
    const printed = stdoutStub
      .getCalls()
      .map((c) => String(c.args[0]))
      .join('\n');
    expect(printed).to.include(REDIRECT_ID);
    expect(printed).to.include('/old');
    expect(printed).to.include('/new');
    expect(printed).to.include('completed');
    expect(printed).to.include('dev@example.com');
  });

  it('forwards the resolved SCAPI backend context with the UUID identifier', async () => {
    const command = createCommand();

    stubParse(command, {'mrt-backend': 'scapi'}, {identifier: REDIRECT_ID});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const getStub = sinon
      .stub()
      .resolves({backend: 'scapi', redirect: {id: REDIRECT_ID, backend: 'scapi'}, raw: {redirectId: REDIRECT_ID}});
    command.operations = {...command.operations, getRedirectWithBackend: getStub};

    await command.run();

    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.identifier).to.equal(REDIRECT_ID);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
