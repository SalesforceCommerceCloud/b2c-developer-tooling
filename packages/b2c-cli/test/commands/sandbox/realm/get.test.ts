/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxRealmGet from '../../../../src/commands/sandbox/realm/get.js';
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

describe('sandbox realm get', () => {
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
    const command = await createTestCommand(SandboxRealmGet as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('returns realm and configuration in JSON mode', async () => {
    const command = await setupCommand({json: true}, {realm: 'zzzz'});

    const response = {
      data: {
        data: {
          id: 'zzzz',
          name: 'Test Realm',
          configuration: {
            sandbox: {
              totalNumberOfSandboxes: 5,
            },
          },
        },
      },
    } as any;

    stubOdsClient(command, {
      async GET() {
        return response;
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(result.realm.id).to.equal('zzzz');
    expect(result.configuration?.sandbox?.totalNumberOfSandboxes).to.equal(5);
  });

  it('throws a helpful error when the API call fails', async () => {
    const command = await setupCommand({}, {realm: 'zzzz'});

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
      expect(error.message).to.include('Failed to fetch realm zzzz');
    }
  });
});
