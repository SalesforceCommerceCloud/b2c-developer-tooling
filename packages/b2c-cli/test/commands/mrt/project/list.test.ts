/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import {TableRenderer} from '@salesforce/b2c-tooling-sdk/cli';
import MrtProjectList from '../../../../src/commands/mrt/project/list.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt project list', () => {
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
    return new MrtProjectList([], config);
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

  it('routes through the backend-aware list, forwards filters, and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {organization: 'my-org', limit: 10, offset: 5}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      projects: [{id: 'proj-1', name: 'Project 1', backend: 'legacy'}],
      raw: {count: 1, next: null, previous: null, projects: [{slug: 'proj-1', name: 'Project 1'}]},
    } as any);
    command.operations = {...command.operations, listProjectsWithBackend: listStub};

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.organization).to.equal('my-org');
    expect(input.limit).to.equal(10);
    expect(input.offset).to.equal(5);
    expect(input.origin).to.equal('https://example.com');
    // --json emits the raw backend-native list response verbatim.
    expect(result.count).to.equal(1);
    expect(result.projects[0].slug).to.equal('proj-1');
  });

  it('forwards the resolved SCAPI backend context and emits the native envelope under --json', async () => {
    const command = createCommand();

    stubParse(command, {'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtBackend: 'scapi'}}));

    const listStub = sinon.stub().resolves({
      backend: 'scapi',
      count: 1,
      projects: [{id: 'my-storefront', name: 'My Storefront', backend: 'scapi'}],
      raw: {limit: 25, offset: 0, total: 1, data: [{storefrontId: 'my-storefront', storefrontName: 'My Storefront'}]},
    } as any);
    command.operations = {...command.operations, listProjectsWithBackend: listStub};

    const result = await command.run();

    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    // --json emits the native SCAPI paginated envelope verbatim.
    expect(result.total).to.equal(1);
    expect(result.data[0].storefrontId).to.equal('my-storefront');
  });

  it('renders the table in non-JSON mode', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {}}));

    const renderStub = sinon.stub(TableRenderer.prototype, 'render').returns(void 0);
    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      projects: [{id: 'proj-1', name: 'Project 1', backend: 'legacy'}],
      raw: {count: 1, projects: [{slug: 'proj-1'}]},
    } as any);
    command.operations = {...command.operations, listProjectsWithBackend: listStub};

    await command.run();

    expect(renderStub.calledOnce).to.equal(true);
  });

  it('reports an empty project list in non-JSON mode without rendering a table', async () => {
    const command = createCommand();

    stubParse(command, {}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(false);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {}}));

    const renderStub = sinon.stub(TableRenderer.prototype, 'render').returns(void 0);
    const listStub = sinon.stub().resolves({backend: 'legacy', count: 0, projects: [], raw: {count: 0, projects: []}});
    command.operations = {...command.operations, listProjectsWithBackend: listStub};

    await command.run();

    expect(renderStub.called).to.equal(false);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
