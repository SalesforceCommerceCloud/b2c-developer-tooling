/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtEnvClone from '../../../../src/commands/mrt/env/clone.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env clone', () => {
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
    return new MrtEnvClone([], config);
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

  it('errors when project is missing', async () => {
    const command = createCommand();
    stubParse(command, {}, {slug: 'staging-copy'});
    await command.init();
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));
    const errorStub = sinon.stub(command, 'error').throws(new Error('expected'));

    try {
      await command.run();
      expect.fail('expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('errors when the source environment is not set', async () => {
    const command = createCommand();
    stubParse(command, {'clone-redirects': false, 'clone-env-vars': false, 'clone-b2c-info': false}, {slug: 'qa'});
    await command.init();
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p'}}));
    const errorStub = sinon.stub(command, 'error').throws(new Error('expected'));

    try {
      await command.run();
      expect.fail('expected error');
    } catch {
      expect(errorStub.firstCall.args[0]).to.include('Source environment is required');
    }
  });

  it('errors when source and destination slugs are equal', async () => {
    const command = createCommand();
    stubParse(command, {'clone-redirects': false, 'clone-env-vars': false, 'clone-b2c-info': false}, {slug: 'staging'});
    await command.init();
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p', mrtEnvironment: 'staging'}}));
    const errorStub = sinon.stub(command, 'error').throws(new Error('expected'));

    try {
      await command.run();
      expect.fail('expected error');
    } catch {
      expect(errorStub.firstCall.args[0]).to.include('must differ');
    }
  });

  it('routes through the backend-aware clone on the legacy backend, forwarding flags', async () => {
    const command = createCommand();
    stubParse(
      command,
      {
        'external-hostname': 'qa.example.com',
        'certificate-id': 123,
        'clone-redirects': true,
        'clone-env-vars': true,
        'clone-b2c-info': false,
        wait: false,
      },
      {slug: 'qa'},
    );
    await command.init();
    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'p', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const cloneStub = sinon.stub().resolves({
      backend: 'legacy',
      environment: {id: 'qa', name: 'qa', status: 'CREATE_IN_PROGRESS', backend: 'legacy'},
      raw: {slug: 'qa', name: 'qa', state: 'CREATE_IN_PROGRESS'},
    } as any);
    const waitStub = sinon.stub();
    command.operations = {cloneEnvironmentWithBackend: cloneStub, waitForEnv: waitStub};

    const result = await command.run();

    expect(cloneStub.calledOnce).to.equal(true);
    const [input] = cloneStub.firstCall.args;
    expect(input.projectSlug).to.equal('p');
    expect(input.slug).to.equal('qa');
    expect(input.sourceEnvironment).to.equal('staging');
    expect(input.externalHostname).to.equal('qa.example.com');
    expect(input.certificateId).to.equal(123);
    expect(input.cloneRedirects).to.equal(true);
    expect(input.cloneEnvironmentVariables).to.equal(true);
    expect(input.cloneB2cTargetInfo).to.equal(false);
    expect(waitStub.notCalled).to.equal(true);
    expect(result.slug).to.equal('qa');
  });

  it('requires --name on the SCAPI backend', async () => {
    const command = createCommand();
    stubParse(
      command,
      {'clone-redirects': false, 'clone-env-vars': false, 'clone-b2c-info': false, 'mrt-backend': 'scapi'},
      {},
    );
    await command.init();
    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p', mrtEnvironment: 'staging'}}));
    const errorStub = sinon.stub(command, 'error').throws(new Error('expected'));

    try {
      await command.run();
      expect.fail('expected error');
    } catch {
      expect(errorStub.firstCall.args[0]).to.include('requires --name');
    }
  });

  it('clones via the SCAPI backend using the display name', async () => {
    const command = createCommand();
    stubParse(
      command,
      {name: 'QA', 'clone-redirects': true, 'clone-env-vars': false, 'clone-b2c-info': false, 'mrt-backend': 'scapi'},
      {},
    );
    await command.init();
    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p', mrtEnvironment: 'staging'}}));

    const cloneStub = sinon.stub().resolves({
      backend: 'scapi',
      environment: {id: 'qa-123', name: 'QA', status: 'building', backend: 'scapi'},
      raw: {environmentId: 'qa-123', displayName: 'QA', status: 'building'},
    } as any);
    command.operations = {cloneEnvironmentWithBackend: cloneStub, waitForEnv: sinon.stub()};

    const result = await command.run();

    const [input] = cloneStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.displayName).to.equal('QA');
    expect(input.sourceEnvironment).to.equal('staging');
    expect(input.cloneRedirects).to.equal(true);
    expect(result.environmentId).to.equal('qa-123');
  });

  it('waits for the env when --wait is set on the legacy backend', async () => {
    const command = createCommand();
    stubParse(
      command,
      {
        wait: true,
        'poll-interval': 1,
        timeout: 30,
        'clone-redirects': false,
        'clone-env-vars': false,
        'clone-b2c-info': false,
      },
      {slug: 'qa'},
    );
    await command.init();
    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'p', mrtEnvironment: 'staging'}}));

    const cloneStub = sinon.stub().resolves({
      backend: 'legacy',
      environment: {id: 'qa', name: 'qa', status: 'CREATE_IN_PROGRESS', backend: 'legacy'},
      raw: {slug: 'qa', state: 'CREATE_IN_PROGRESS'},
    } as any);
    const waitStub = sinon.stub().resolves({slug: 'qa', state: 'ACTIVE'} as any);
    command.operations = {cloneEnvironmentWithBackend: cloneStub, waitForEnv: waitStub};

    const result = await command.run();

    expect(waitStub.calledOnce).to.equal(true);
    expect(result.state).to.equal('ACTIVE');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
