/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxAliasList from '../../../../src/commands/sandbox/alias/list.js';
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

describe('sandbox alias list', () => {
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
    const command = await createTestCommand(SandboxAliasList as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('lists all aliases when no alias-id is provided', async () => {
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: [
              {id: 'alias-1', name: 'a.example.com', status: 'ACTIVE'},
              {id: 'alias-2', name: 'b.example.com', status: 'PENDING'},
            ],
          },
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/aliases');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(result).to.be.an('array').with.lengthOf(2);
  });

  it('fetches a specific alias when alias-id is provided', async () => {
    const command = await setupCommand({json: true, 'alias-id': 'alias-1'}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'alias-1',
              name: 'a.example.com',
              status: 'ACTIVE',
            },
          },
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/aliases/{sandboxAliasId}');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('params.path.sandboxAliasId', 'alias-1');
    expect(result.id).to.equal('alias-1');
  });

  it('throws a helpful error when list call fails', async () => {
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001'});

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
      expect(error.message).to.include('Failed to fetch aliases');
    }
  });
});
