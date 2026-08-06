/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {ux} from '@oclif/core';
import {expect} from 'chai';
import {afterEach, beforeEach} from 'mocha';
import sinon from 'sinon';
import SitesList from '../../../src/commands/sites/list.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('sites list', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(hooks.beforeEach);

  afterEach(hooks.afterEach);

  async function createCommand(flags: Record<string, unknown> = {}, args: Record<string, unknown> = {}) {
    return createTestCommand(SitesList, hooks.getConfig(), flags, args);
  }

  // The instance carries SCAPI resolution now: a stub instance with no
  // `scapiClientConfig` (and `apiBackend: 'auto'`) makes the dual-backend
  // factory resolve to the OCAPI backend, which reads `/sites?select=(**)`.
  function stubInstance(command: any, ocapiGet: sinon.SinonStub) {
    sinon.stub(command, 'instance').get(() => ({
      ocapi: {GET: ocapiGet},
      apiBackend: 'auto',
      scapiClientConfig: undefined,
    }));
  }

  function stubCommon(command: any, {jsonEnabled}: {jsonEnabled: boolean}) {
    sinon.stub(command, 'requireOAuthCredentials').returns(void 0);
    sinon.stub(command, 'resolvedConfig').get(() => ({values: {hostname: 'example.com'}}));
    sinon.stub(command, 'jsonEnabled').returns(jsonEnabled);
  }

  it('returns data in JSON mode', async () => {
    const command: any = await createCommand();

    stubCommon(command, {jsonEnabled: true});

    const ocapiGet = sinon.stub().resolves({
      data: {count: 1, data: [{id: 'site1', display_name: {default: 'Site One'}, storefront_status: 'online'}]},
      error: undefined,
      response: {status: 200},
    });
    stubInstance(command, ocapiGet);

    const result = await command.run();
    expect(result.count).to.equal(1);
    expect(result.data[0].id).to.equal('site1');
    expect(ocapiGet.calledOnce).to.equal(true);
  });

  it('prints "no sites" message when there are no sites in non-JSON mode', async () => {
    const command: any = await createCommand();

    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon.stub().resolves({data: {count: 0, data: []}, error: undefined, response: {status: 200}});
    stubInstance(command, ocapiGet);

    const stdoutStub = sinon.stub(ux, 'stdout').returns(void 0 as any);

    const result = await command.run();
    expect(result.count).to.equal(0);
    expect(stdoutStub.calledOnce).to.equal(true);
    const stdoutOutput = stdoutStub
      .getCalls()
      .map((c) => String(c.args[0] ?? ''))
      .join('');
    expect(stdoutOutput).to.include('No sites found');
  });

  it('throws when the backend returns an error', async () => {
    const command: any = await createCommand();

    stubCommon(command, {jsonEnabled: false});
    sinon.stub(command, 'log').returns(void 0);

    const ocapiGet = sinon
      .stub()
      .resolves({data: undefined, error: {fault: {message: 'boom'}}, response: {status: 500}});
    stubInstance(command, ocapiGet);

    // The OCAPI backend throws on error; the command surfaces it via catch().
    try {
      await command.run();
      expect.fail('Expected the run to throw');
    } catch (error) {
      expect((error as Error).message).to.include('boom');
    }
  });
});
