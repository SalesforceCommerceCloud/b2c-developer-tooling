/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtCacheInvalidate from '../../../../src/commands/mrt/env/invalidate.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env invalidate', () => {
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
    return new MrtCacheInvalidate([], config);
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

    stubParse(command, {pattern: '/*'}, {});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'production'}}));

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

    stubParse(command, {project: 'my-project', pattern: '/*'}, {});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('calls command.error when the pattern does not start with /', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production', pattern: 'invalid-pattern'}, {});
    await command.init();

    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
      expect(errorStub.firstCall.args[0]).to.include('Pattern must start with a forward slash');
    }
  });

  it('routes through the backend-aware invalidation on the legacy backend and returns the raw payload under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production', pattern: '/*'}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtOrigin: 'https://example.com'},
    }));

    const invalidateStub = sinon.stub().resolves({
      backend: 'legacy',
      raw: {result: 'Cache invalidation request accepted.', slug: 'production'},
    } as any);
    command.operations = {...command.operations, invalidateCacheWithBackend: invalidateStub};

    const result = await command.run();

    expect(invalidateStub.calledOnce).to.equal(true);
    const [input] = invalidateStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('production');
    expect(input.pattern).to.equal('/*');
    // Legacy response is returned verbatim, preserving the existing contract.
    expect(result).to.deep.equal({result: 'Cache invalidation request accepted.', slug: 'production'});
  });

  it('invalidates via the SCAPI backend and returns a structured ack with null raw (empty 202)', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'production', pattern: '/*', 'mrt-backend': 'scapi'}, {});
    await command.init();

    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'production', mrtBackend: 'scapi'},
    }));

    const invalidateStub = sinon.stub().resolves({backend: 'scapi', raw: null} as any);
    command.operations = {...command.operations, invalidateCacheWithBackend: invalidateStub};

    const result = await command.run();

    const [input] = invalidateStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    // The SCAPI 202 has no body, but --json must still emit a usable payload.
    expect(result).to.deep.include({
      project: 'my-project',
      environment: 'production',
      pattern: '/*',
      backend: 'scapi',
      requested: true,
      raw: null,
    });
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });
});
