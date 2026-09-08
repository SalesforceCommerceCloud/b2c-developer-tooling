/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtBundleHistory from '../../../../src/commands/mrt/bundle/history.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt bundle history', () => {
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
    return new MrtBundleHistory([], config);
  }

  function stubErrorToThrow(command: any): sinon.SinonStub {
    return sinon.stub(command, 'error').throws(new Error('Expected error'));
  }

  function stubCommonAuth(command: any): void {
    sinon.stub(command, 'requireMrtCredentials').returns(void 0);
    sinon.stub(command, 'getMrtAuth').returns({} as any);
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

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls command.error when environment is missing', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project'}, {});
    await command.init();

    stubCommonAuth(command);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('routes through the backend-aware listMrtDeployments and returns the raw legacy list under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging', limit: 10, offset: 5}, {});
    await command.init();

    stubCommonAuth(command);
    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 1,
      deployments: [
        {
          bundleId: 123,
          bundleMessage: 'Deploy 1',
          status: 'Finished',
          deploymentType: 'Publish',
          createdBy: 'test@example.com',
          creationDate: '2025-01-01T00:00:00Z',
          backend: 'legacy',
        },
      ],
      raw: {
        count: 1,
        next: null,
        previous: null,
        deployments: [
          {
            deploy_uuid: 'd-1',
            user: 'test@example.com',
            bundle: {id: 123, message: 'Deploy 1'},
            status: 'Finished',
            deploy_type: 'Publish',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
    } as any);
    command.operations = {...command.operations, listMrtDeployments: listStub};

    const result = await command.run();

    expect(listStub.calledOnce).to.equal(true);
    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.targetSlug).to.equal('staging');
    expect(input.limit).to.equal(10);
    expect(input.offset).to.equal(5);
    expect(input.origin).to.equal('https://example.com');
    // --json emits the raw legacy MRT Cloud API list response verbatim.
    expect(result.count).to.equal(1);
    expect(result.next).to.equal(null);
    expect(result.deployments[0].deploy_uuid).to.equal('d-1');
    expect(result.deployments[0].bundle.id).to.equal(123);
  });

  it('forwards the resolved SCAPI backend context to listMrtDeployments', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging', 'mrt-backend': 'scapi'}, {});
    await command.init();

    stubCommonAuth(command);
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
      deployments: [{deploymentId: 'dep-1', bundleId: 170, status: 'finished', backend: 'scapi'}],
      raw: {
        limit: 25,
        offset: 0,
        total: 1,
        data: [{deploymentId: 'dep-1', bundle: {bundleId: 170}, status: 'finished'}],
      },
    } as any);
    command.operations = {...command.operations, listMrtDeployments: listStub};

    const result = await command.run();

    const [input] = listStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    // --json emits the native SCAPI Storefront Deployments response verbatim.
    expect(result.total).to.equal(1);
    expect(result.data[0].deploymentId).to.equal('dep-1');
  });

  it('handles empty deployment list', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging'}, {});
    await command.init();

    stubCommonAuth(command);
    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const listStub = sinon.stub().resolves({
      backend: 'legacy',
      count: 0,
      deployments: [],
      raw: {count: 0, next: null, previous: null, deployments: []},
    } as any);
    command.operations = {...command.operations, listMrtDeployments: listStub};

    const result = await command.run();

    // --json emits the raw legacy list response (still has count/deployments).
    expect(result.deployments).to.have.lengthOf(0);
    expect(result.count).to.equal(0);
  });
});
