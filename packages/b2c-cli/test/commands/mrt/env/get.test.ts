/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import {Config, ux} from '@oclif/core';
import MrtEnvGet, {printEnvView} from '../../../../src/commands/mrt/env/get.js';
import {isolateConfig, restoreConfig} from '@salesforce/b2c-tooling-sdk/test-utils';
import {stubParse} from '../../../helpers/stub-parse.js';

describe('mrt env get', () => {
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
    return new MrtEnvGet([], config);
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

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: undefined, mrtEnvironment: 'staging'}}));

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

    sinon.stub(command, 'resolvedConfig').get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: undefined}}));

    const errorStub = stubErrorToThrow(command);

    try {
      await command.run();
      expect.fail('Expected error');
    } catch {
      expect(errorStub.calledOnce).to.equal(true);
    }
  });

  it('routes through the backend-aware get and returns raw under --json', async () => {
    const command = createCommand();

    stubParse(command, {project: 'my-project', environment: 'staging'}, {});
    await command.init();

    stubBackendContext(command);
    sinon.stub(command, 'jsonEnabled').returns(true);
    sinon.stub(command, 'log').returns(void 0);
    sinon
      .stub(command, 'resolvedConfig')
      .get(() => ({values: {mrtProject: 'my-project', mrtEnvironment: 'staging', mrtOrigin: 'https://example.com'}}));

    const getStub = sinon.stub().resolves({
      backend: 'legacy',
      environment: {id: 'staging', name: 'Staging', status: 'ready', backend: 'legacy'},
      raw: {slug: 'staging', name: 'Staging', state: 'ready'},
    } as any);
    command.operations = {...command.operations, getEnvironmentWithBackend: getStub};

    const result = await command.run();

    expect(getStub.calledOnce).to.equal(true);
    const [input] = getStub.firstCall.args;
    expect(input.projectSlug).to.equal('my-project');
    expect(input.environment).to.equal('staging');
    expect(input.origin).to.equal('https://example.com');
    expect(result.slug).to.equal('staging');
  });

  it('forwards the resolved SCAPI backend context', async () => {
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

    const getStub = sinon.stub().resolves({
      backend: 'scapi',
      environment: {id: 'staging', name: 'Staging', status: 'ready', backend: 'scapi'},
      raw: {environmentId: 'staging', displayName: 'Staging'},
    } as any);
    command.operations = {...command.operations, getEnvironmentWithBackend: getStub};

    const result = await command.run();

    const [input] = getStub.firstCall.args;
    expect(input.preference).to.equal('scapi');
    expect(input.scapiConnection).to.equal(scapiConnection);
    expect(result.environmentId).to.equal('staging');
  });

  it('supports the SCAPI MRT backend', () => {
    const command = createCommand();
    expect(command.supportsScapiMrt()).to.equal(true);
  });

  describe('printEnvView — legacy-only fields', () => {
    function capture(fn: () => void): string {
      const stdoutStub = sinon.stub(ux, 'stdout');
      fn();
      return stdoutStub
        .getCalls()
        .map((call) => String(call.args[0] ?? ''))
        .join('\n');
    }

    it('prints the legacy-only configuration fields when present', () => {
      const output = capture(() =>
        printEnvView(
          {
            id: 'staging',
            name: 'Staging',
            status: 'ready',
            backend: 'legacy',
            hostname: 'tag.example.com',
            externalHostname: 'www.example.com',
            externalDomain: 'example.com',
            allowCookies: true,
            enableSourceMaps: true,
            logLevel: 'DEBUG',
            proxies: [{path: '/api', host: 'api.example.com'}, {host: 'ocapi.example.com'}],
          } as any,
          'my-project',
        ),
      );

      expect(output).to.include('Hostname:');
      expect(output).to.include('tag.example.com');
      expect(output).to.include('External Host:');
      expect(output).to.include('www.example.com');
      expect(output).to.include('External Domain:');
      expect(output).to.include('example.com');
      expect(output).to.include('Allow Cookies:');
      expect(output).to.include('Source Maps:');
      expect(output).to.include('Log Level:');
      expect(output).to.include('DEBUG');
      expect(output).to.include('Proxies:');
      expect(output).to.include('/api → api.example.com');
      expect(output).to.include('→ ocapi.example.com');
    });

    it('omits the legacy-only fields when absent (SCAPI-style view)', () => {
      const output = capture(() =>
        printEnvView(
          {id: 'staging', name: 'Staging', status: 'ready', backend: 'scapi', isPrimary: true} as any,
          'my-project',
        ),
      );

      expect(output).to.not.include('Hostname:');
      expect(output).to.not.include('External Host:');
      expect(output).to.not.include('Allow Cookies:');
      expect(output).to.not.include('Source Maps:');
      expect(output).to.not.include('Log Level:');
      expect(output).to.not.include('Proxies:');
      // The SCAPI-only Primary row is still shown.
      expect(output).to.include('Primary:');
    });

    it('hides Allow Cookies and Source Maps rows when the flags are false', () => {
      const output = capture(() =>
        printEnvView(
          {id: 'staging', name: 'Staging', backend: 'legacy', allowCookies: false, enableSourceMaps: false} as any,
          'my-project',
        ),
      );

      expect(output).to.not.include('Allow Cookies:');
      expect(output).to.not.include('Source Maps:');
    });
  });
});
