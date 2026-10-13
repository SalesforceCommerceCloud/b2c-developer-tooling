/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvList from '../../../../src/commands/mrt/env/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env list', () => {
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
    return new MrtEnvList([], config);
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

  it('routes through the backend-aware list, forwards limit/offset, and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', limit: 10, offset: 5}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      environments: [{id: 'staging', name: 'Staging', status: 'ready', backend: 'legacy'}],
      raw: {environments: [{slug: 'staging', name: 'Staging', state: 'ready'}]},
    } as any);
    command.operations = {...command.operations, listEnvironmentsWithBackend: listStub};

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.limit).to.equal(10);
    expect(input.offset).to.equal(5);
    expect(input.origin).to.equal('https://example.com');
    // --json emits the raw backend-native list response verbatim.
    expect(result.environments[0].slug).to.equal('staging');
  });

  it('forwards the resolved SCAPI backend context and emits the native envelope under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtBackend: 'scapi'}}));

    const listStub = sinon.stub().resolves({
      backend: 'scapi',
      count: 1,
      environments: [{id: 'staging', name: 'Staging', status: 'ready', backend: 'scapi'}],
      raw: {limit: 25, offset: 0, total: 1, data: [{environmentId: 'staging', displayName: 'Staging'}]},
    } as any);
    command.operations = {...command.operations, listEnvironmentsWithBackend: listStub};

    const result = await command.run();

    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    // --json emits the native SCAPI paginated envelope verbatim.
    expect(result.total).to.equal(1);
    expect(result.data[0].environmentId).to.equal('staging');
  });

  it('renders the table in non-JSON mode (renderTable is stubbed)', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project'}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    sinon.stub(command, 'renderTable').returns(void 0);
    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      environments: [{id: 'staging', name: 'Staging', status: 'ready', backend: 'legacy'}],
      raw: {environments: [{slug: 'staging'}]},
    } as any);
    command.operations = {...command.operations, listEnvironmentsWithBackend: listStub};

    await command.run();

    expect((command.renderTable as sinon.SinonStub).calledOnce).to.equal(true);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
