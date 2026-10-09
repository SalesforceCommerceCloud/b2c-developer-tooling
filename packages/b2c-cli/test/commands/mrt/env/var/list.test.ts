/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvVarList from '../../../../../src/commands/mrt/env/var/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env var list', () => {
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
    return new MrtEnvVarList([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  /**
   * Stubs the resolved MRT backend context. `getMrtBackendContext()` reads
   * `resolvedConfig.hasMrtConfig()` and builds auth strategies, which the plain
   * `{values}` config stub can't satisfy — so we stub the resolver directly.
   */
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

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('routes through the backend-aware list and returns the raw response under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging'}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {
        mrtProject: 'my-project',
        mrtEnvironment: 'staging',
        mrtOrigin: 'https://example.com',
      },
    }));

    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      variables: [{name: 'A', value: '1', backend: 'legacy'}],
      raw: {count: 1, variables: [{name: 'A', value: '1'}]},
    } as any);
    command.operations = {...command.operations, listEnvVarsWithBackend: listStub};

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.origin).to.equal('https://example.com');
    // --json emits the raw backend-native list response verbatim.
    expect(result.count).to.equal(1);
    expect(result.variables[0].name).to.equal('A');
  });

  it('forwards the resolved SCAPI backend context and emits the native map under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const listStub = sinon.stub().resolves({
      backend: 'scapi',
      count: 1,
      variables: [{name: 'API_KEY', value: '****key', status: 'completed', backend: 'scapi'}],
      raw: {API_KEY: {value: '****key', publishingStatus: 'completed'}},
    } as any);
    command.operations = {...command.operations, listEnvVarsWithBackend: listStub};

    const result = await command.run();

    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    // --json emits the native SCAPI Environments map verbatim.
    expect(result.API_KEY.value).to.equal('****key');
  });

  it('renders the table in non-JSON mode (renderTable is stubbed)', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging'}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging'}}));

    sinon.stub(command, 'renderTable').returns(void 0);
    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      variables: [{name: 'A', value: '1', backend: 'legacy'}],
      raw: {count: 1, variables: [{name: 'A', value: '1'}]},
    } as any);
    command.operations = {...command.operations, listEnvVarsWithBackend: listStub};

    await command.run();

    expect((command.renderTable as sinon.SinonStub).calledOnce).to.equal(true);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
