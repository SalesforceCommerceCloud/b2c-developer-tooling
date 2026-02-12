/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxIps from '../../../src/commands/sandbox/ips.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
} from '../../helpers/test-setup.js';

function stubOdsClient(command: any, client: Partial<{GET: any}>): void {
  Object.defineProperty(command, 'odsClient', {
    value: client,
    configurable: true,
  });
}

function stubOdsHost(command: any, host = 'admin.dx.test.com'): void {
  Object.defineProperty(command, 'odsHost', {
    value: host,
    configurable: true,
  });
}

function stubJsonEnabled(command: any, enabled: boolean): void {
  command.jsonEnabled = () => enabled;
}

describe('sandbox ips', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    sinon.restore();
    hooks.afterEach();
  });

  async function setupCommand(flags: Record<string, unknown>): Promise<any> {
    const config = hooks.getConfig();
    const command = await createTestCommand(SandboxIps as any, config, flags, {});

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('calls /system when no realm flag is provided', async () => {
    const command = await setupCommand({});

    stubJsonEnabled(command, false);

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              inboundIps: ['1.1.1.1'],
              outboundIps: ['2.2.2.2'],
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/system');
    expect(requestOptions).to.deep.equal({});
    expect(result).to.deep.equal({inboundIps: ['1.1.1.1'], outboundIps: ['2.2.2.2']});
  });

  it('calls /realms/{realm}/system when realm flag is provided', async () => {
    const command = await setupCommand({realm: 'zzzz'});

    stubJsonEnabled(command, false);

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              inboundIps: ['1.1.1.1'],
              outboundIps: ['2.2.2.2'],
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/realms/{realm}/system');
    expect(requestOptions).to.have.nested.property('params.path.realm', 'zzzz');
    expect(result).to.deep.equal({inboundIps: ['1.1.1.1'], outboundIps: ['2.2.2.2']});
  });

  it('returns full response in JSON mode', async () => {
    const command = await setupCommand({json: true});

    stubJsonEnabled(command, true);

    const response = {
      data: {
        inboundIps: ['1.1.1.1'],
        outboundIps: ['2.2.2.2'],
      },
    } as any;

    stubOdsClient(command, {
      async GET() {
        return {data: response};
      },
    });

    const result = await runSilent(() => command.run());

    expect(result).to.equal(response as any);
  });

  it('logs and returns undefined when no data is returned', async () => {
    const command = await setupCommand({});

    stubJsonEnabled(command, false);

    const logSpy = sinon.spy(command, 'log');

    stubOdsClient(command, {
      async GET() {
        return {data: {data: undefined}};
      },
    });

    const result = await runSilent(() => command.run());

    expect(result).to.be.undefined;
    expect(logSpy.called).to.be.true;
  });

  it('throws a helpful error when the API call fails', async () => {
    const command = await setupCommand({});

    stubJsonEnabled(command, false);

    stubOdsClient(command, {
      async GET() {
        return {
          data: undefined,
          error: {error: {message: 'Something went wrong'}},
          response: {statusText: 'Bad Request'},
        };
      },
    });

    try {
      await runSilent(() => command.run());
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to fetch sandbox IP information');
    }
  });
});
