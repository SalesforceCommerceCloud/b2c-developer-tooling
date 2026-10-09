/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtRedirectClone from '../../../../../src/commands/mrt/env/redirect/clone.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

describe('mrt env redirect clone', () => {
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
    return new MrtRedirectClone([], config);
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

    stubParse(command, {from: 'staging', to: 'production', force: true}, {});
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

  it('rejects a same-source clone before touching the backend', async () => {
    const command = createCommand();

    stubParse(command, {from: 'staging', to: 'staging', force: true}, {});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project'}}));

    const errorStub = stubErrorToThrow(command);
    const cloneStub = sinon.stub().resolves({backend: 'legacy', count: 1, raw: {count: 1}});
    command.operations = {...command.operations, cloneRedirectsWithBackend: cloneStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('must differ');
    }
    expect(cloneStub.called).to.equal(false);
  });

  it('clones via the backend wrapper and returns raw under --json (legacy)', async () => {
    const command = createCommand();

    stubParse(command, {from: 'staging', to: 'production', force: true}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtOrigin: 'https://example.com'},
    }));

    const raw = {count: 5, results: []};
    const cloneStub = sinon.stub().resolves({backend: 'legacy', count: 5, raw});
    command.operations = {...command.operations, cloneRedirectsWithBackend: cloneStub};

    const result = await command.run();

    expect(cloneStub.calledOnce).to.equal(true);
    const [input] = cloneStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.sourceEnvironment).to.equal('staging');
    expect(input.targetEnvironment).to.equal('production');
    expect(result).to.deep.equal(raw);
  });

  it('forwards the resolved SCAPI backend context and synthesizes a stable --json object', async () => {
    const command = createCommand();

    stubParse(command, {from: 'staging', to: 'production', force: true, 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtBackend: 'scapi'}}));

    const cloneStub = sinon.stub().resolves({backend: 'scapi', count: null, raw: null});
    command.operations = {...command.operations, cloneRedirectsWithBackend: cloneStub};

    const result = await command.run();

    const [input] = cloneStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    // SCAPI returns an empty 201 (no body); the command synthesizes a stable
    // object rather than emitting a bare `null`. `count` is null since SCAPI
    // reports no cloned count.
    expect(result).to.deep.equal({from: 'staging', to: 'production', count: null});
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
