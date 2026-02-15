/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxUsage from '../../../src/commands/sandbox/usage.js';
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

describe('sandbox usage', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    sinon.restore();
    hooks.afterEach();
  });

  async function setupCommand(flags: Record<string, unknown>, args: Record<string, unknown>): Promise<any> {
    const config = hooks.getConfig();
    const command = await createTestCommand(SandboxUsage as any, config, flags, args);

    // Avoid real config / OAuth behavior
    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('calls /sandboxes/{sandboxId}/usage with resolved sandbox id and date range', async () => {
    const command = await setupCommand({from: '2024-01-01', to: '2024-01-31'}, {sandboxId: 'zzzz-001'});

    // Stub JSON mode off so we exercise the summary path
    sinon.stub(command as any, 'jsonEnabled').returns(false);

    // Stub resolveSandboxId so we do not depend on its implementation here
    const resolveStub = sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              sandboxSeconds: 42,
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());

    // ensure resolveSandboxId was used
    expect(resolveStub.calledOnceWithExactly('zzzz-001')).to.be.true;

    // ensure correct endpoint and query params
    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/usage');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('params.query.from', '2024-01-01');
    expect(requestOptions).to.have.nested.property('params.query.to', '2024-01-31');

    // summary mode returns the inner usage model
    expect(result).to.deep.equal({sandboxSeconds: 42});
  });

  it('returns full response in JSON mode', async () => {
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001'});
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    const response = {
      data: {
        data: {
          sandboxSeconds: 10,
        },
      },
    };

    stubOdsClient(command, {
      async GET() {
        return response;
      },
    });

    const result = await runSilent(() => command.run());

    // In JSON mode, the command returns the inner usage model
    expect(result).to.deep.equal(response.data.data as any);
  });

  it('logs and returns undefined when no data is returned', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    const logSpy = sinon.spy(command, 'log');

    stubOdsClient(command, {
      async GET() {
        return {data: {data: undefined}};
      },
    });

    (command as any).argv = ['zzzz-001'];

    const result = await runSilent(() => command.run());

    expect(result).to.be.undefined;
    expect(logSpy.called).to.be.true;
  });

  it('throws a helpful error when the API call fails', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001'});
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

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
      expect(error.message).to.include('Failed to fetch sandbox usage');
    }
  });
});
