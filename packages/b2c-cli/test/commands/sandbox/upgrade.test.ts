/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxUpgrade from '../../../src/commands/sandbox/upgrade.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
  stubOdsClient,
} from '../../helpers/test-setup.js';

function stubOdsHost(command: any, host = 'admin.dx.test.com'): void {
  Object.defineProperty(command, 'odsHost', {
    value: host,
    configurable: true,
  });
}

describe('sandbox upgrade', () => {
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
    const command = await createTestCommand(SandboxUpgrade as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('triggers upgrade operation without wait and returns operation', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async POST(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'op-1',
              operationState: 'accepted',
              sandboxState: 'upgrading',
            },
          },
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/operations');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('body.operation', 'upgrade');

    expect(result.id).to.equal('op-1');
    expect(result.operationState).to.equal('accepted');
  });

  it('waits for sandbox to reach started state when --wait is set', async () => {
    const command = await setupCommand(
      {wait: true, 'poll-interval': 0, timeout: 60, json: true},
      {
        sandboxId: 'zzzz-001',
      },
    );

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    stubOdsClient(command, {
      async POST() {
        return {
          data: {
            data: {
              id: 'op-1',
              operationState: 'accepted',
              sandboxState: 'upgrading',
            },
          },
        };
      },
      async GET() {
        return {
          data: {
            data: {
              id: 'sb-uuid-123',
              realm: 'zzzz',
              state: 'started',
            },
          },
          response: new Response(),
        } as any;
      },
    });

    const result: any = await runSilent(() => command.run());

    // We verify that the upgrade operation itself was created; detailed polling
    // behavior is covered by the SDK's own tests for waitForSandbox.
    expect(result.id).to.equal('op-1');
  });

  it('throws a helpful error when the upgrade operation fails', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    stubOdsClient(command, {
      async POST() {
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
      expect(error.message).to.include('Failed to upgrade sandbox');
    }
  });
});
