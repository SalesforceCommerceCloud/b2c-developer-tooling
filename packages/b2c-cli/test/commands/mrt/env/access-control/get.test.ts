/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MrtAccessControlGet from '../../../../../src/commands/mrt/env/access-control/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

const HEADER_ID = 'ff832a9e-0e55-11ef-8f23-0242ac110002';

describe('mrt env access-control get', () => {
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
    return new MrtAccessControlGet([], config);
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

    stubParse(command, {}, {id: HEADER_ID});
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

  it('gets the header via the backend wrapper and returns the raw response under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {id: HEADER_ID});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const raw = {id: HEADER_ID, value: '****3456'};
    const getStub = sinon.stub().resolves({
      backend: 'legacy',
      header: {id: HEADER_ID, value: '****3456', backend: 'legacy'},
      raw,
    });
    command.operations = {...command.operations, getAccessControlHeaderWithBackend: getStub};

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.headerId).to.equal(HEADER_ID);
    expect(result).to.deep.equal(raw);
  });

  it('prints the header detail via ux.stdout in non-JSON mode', async () => {
    const command = createCommand();

    stubParse(command, {}, {id: HEADER_ID});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging'},
    }));

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0);
    const getStub = sinon.stub().resolves({
      backend: 'scapi',
      header: {
        id: HEADER_ID,
        value: '****3456',
        status: 'completed',
        createdAt: '2026-04-08T21:47:28.188965Z',
        createdBy: 'dev@example.com',
        backend: 'scapi',
      },
      raw: {id: HEADER_ID},
    });
    command.operations = {...command.operations, getAccessControlHeaderWithBackend: getStub};

    await command.run();

    expect(stdoutStub.called).to.equal(true);
    const printed = stdoutStub
      .getCalls()
      .map((c) => String(c.args[0]))
      .join('\n');
    expect(printed).to.include(HEADER_ID);
    expect(printed).to.include('****3456');
    expect(printed).to.include('completed');
    expect(printed).to.include('dev@example.com');
  });

  it('forwards the resolved SCAPI backend context to the wrapper', async () => {
    const command = createCommand();

    stubParse(command, {'mrt-backend': 'scapi'}, {id: HEADER_ID});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const getStub = sinon
      .stub()
      .resolves({backend: 'scapi', header: {id: HEADER_ID, backend: 'scapi'}, raw: {id: HEADER_ID}});
    command.operations = {...command.operations, getAccessControlHeaderWithBackend: getStub};

    await command.run();

    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.headerId).to.equal(HEADER_ID);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
