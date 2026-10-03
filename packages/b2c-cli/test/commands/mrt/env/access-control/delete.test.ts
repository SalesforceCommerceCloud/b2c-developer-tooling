/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config} from '@oclif/core';
import MrtAccessControlDelete from '../../../../../src/commands/mrt/env/access-control/delete.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../../helpers/stub-parse.js';

const HEADER_ID = 'ff832a9e-0e55-11ef-8f23-0242ac110002';

describe('mrt env access-control delete', () => {
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
    return new MrtAccessControlDelete([], config);
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

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('deletes the header via the backend wrapper', async () => {
    const command = createCommand();

    stubParse(command, {force: true}, {id: HEADER_ID});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    stubBackendContext(command);
    sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'},
    }));

    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteAccessControlHeaderWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('auto');
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.headerId).to.equal(HEADER_ID);
    expect(result).to.deep.equal({id: HEADER_ID, project: 'my-project', environment: 'staging'});
    // The resolved backend is intentionally kept out of the --json payload.
    expect(result).to.not.have.property('backend');
  });

  it('forwards the resolved SCAPI backend context to the wrapper', async () => {
    const command = createCommand();

    stubParse(command, {force: true, 'mrt-backend': 'scapi'}, {id: HEADER_ID});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    const scapiConnection = {shortCode: 'kv7kzm78', tenantId: 'zzxy_prd', auth: {}};
    stubBackendContext(command, {preference: 'scapi', scapiConnection, legacyAuth: undefined});
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtBackend: 'scapi'}}));

    const delStub = sinon.stub().resolves({backend: 'scapi'});
    command.operations = {...command.operations, deleteAccessControlHeaderWithBackend: delStub};

    await command.run();

    const [input] = delStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(input.headerId).to.equal(HEADER_ID);
  });

  it('blocks deletion in safe mode before touching the backend', async () => {
    const command = createCommand();

    stubParse(command, {}, {id: HEADER_ID});
    await command.init();

    const assertStub = sinon
      .stub(command, 'assertDestructiveOperationAllowed')
      .throws(new Error('destructive blocked'));
    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteAccessControlHeaderWithBackend: delStub};

    try {
      await command.run();
      expect.fail('Expected error');
    } catch (error) {
      expect((error as Error).message).to.equal('destructive blocked');
    }
    expect(assertStub.calledOnce).to.equal(true);
    expect(delStub.called).to.equal(false);
  });

  it('emits no human progress under --json', async () => {
    const command = createCommand();

    stubParse(command, {}, {id: HEADER_ID});
    await command.init();

    sinon.stub(command, 'assertDestructiveOperationAllowed').returns(void 0);
    sinon.stub(command, 'jsonEnabled').returns(true);
    stubBackendContext(command);
    const logStub = sinon.stub(command, 'log').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({
      values: {mrtProject: 'my-project', mrtEnvironment: 'staging'},
    }));

    const delStub = sinon.stub().resolves({backend: 'legacy'});
    command.operations = {...command.operations, deleteAccessControlHeaderWithBackend: delStub};

    const result = await command.run();

    expect(delStub.calledOnce).to.equal(true);
    expect(logStub.called, 'no human progress under --json').to.equal(false);
    expect(result.id).to.equal(HEADER_ID);
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });

  /*
   * DO NOT REMOVE THIS COMMENT! This test was generated by Claude Code
   *
   * Verifies `access-control delete` registers a boolean `--force` flag so the
   * confirmation prompt (added to match the other MRT delete commands) can be
   * skipped non-interactively. The prompt itself is bypassed via `force: true`
   * in the backend-call tests above, mirroring the redirect/project delete tests.
   * This test leveraged the following Claude Code rules: CLAUDE.md (Testing Requirements) and .claude/rules/coding/unit-tests.md.
   * This test was generated with the following model: Opus 4.8
   */
  it('registers a boolean --force flag to skip the confirmation prompt', () => {
    expect(MrtAccessControlDelete.flags).to.have.property('force');
    expect(MrtAccessControlDelete.flags.force.type).to.equal('boolean');
  });
});
