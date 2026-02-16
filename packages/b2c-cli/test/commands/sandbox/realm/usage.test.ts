/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxRealmUsage from '../../../../src/commands/sandbox/realm/usage.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
} from '../../../helpers/test-setup.js';

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

describe('sandbox realm usage', () => {
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
    const command = await createTestCommand(SandboxRealmUsage as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('calls /realms/{realm}/usage with correct query parameters', async () => {
    const command = await setupCommand(
      {
        from: '2024-01-01',
        to: '2024-01-31',
        granularity: 'daily',
        'detailed-report': true,
      },
      {realm: 'zzzz'},
    );

    sinon.stub(command as any, 'jsonEnabled').returns(false);

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              activeSandboxes: 3,
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/realms/{realm}/usage');
    expect(requestOptions).to.have.nested.property('params.path.realm', 'zzzz');
    expect(requestOptions).to.have.nested.property('params.query.from', '2024-01-01');
    expect(requestOptions).to.have.nested.property('params.query.to', '2024-01-31');
    expect(requestOptions).to.have.nested.property('params.query.granularity', 'daily');
    expect(requestOptions).to.have.nested.property('params.query.detailedReport', true);

    // summary mode returns the inner usage model
    expect(result).to.deep.equal({activeSandboxes: 3});
  });

  it('returns full response in JSON mode', async () => {
    const command = await setupCommand({json: true}, {realm: 'zzzz'});

    const response = {
      data: {
        data: {
          activeSandboxes: 5,
        },
      },
    };

    stubOdsClient(command, {
      async GET() {
        return response;
      },
    });

    const result = await runSilent(() => command.run());

    expect(result).to.deep.equal(response.data.data as any);
  });

  it('logs and returns undefined when no data is returned', async () => {
    const command = await setupCommand({}, {realm: 'zzzz'});

    sinon.stub(command as any, 'jsonEnabled').returns(false);

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
    const command = await setupCommand({}, {realm: 'zzzz'});

    sinon.stub(command as any, 'jsonEnabled').returns(false);

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
      expect(error.message).to.include('Failed to fetch realm usage');
    }
  });
});
