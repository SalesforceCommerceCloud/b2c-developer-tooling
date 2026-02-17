/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxAliasDelete from '../../../../src/commands/sandbox/alias/delete.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
} from '../../../helpers/test-setup.js';

function stubOdsClient(command: any, client: Partial<{DELETE: any}>): void {
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

describe('sandbox alias delete', () => {
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
    const command = await createTestCommand(SandboxAliasDelete as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('deletes an alias when --force is provided', async () => {
    const command = await setupCommand({force: true}, {sandboxId: 'zzzz-001', aliasId: 'alias-1'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async DELETE(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          response: {status: 204},
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/aliases/{sandboxAliasId}');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('params.path.sandboxAliasId', 'alias-1');
    expect(result.success).to.equal(true);
  });

  it('ignores 404 errors and still reports success', async () => {
    const command = await setupCommand({force: true}, {sandboxId: 'zzzz-001', aliasId: 'alias-1'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    stubOdsClient(command, {
      async DELETE() {
        return {
          response: {status: 404},
          error: {error: {message: 'Not Found'}},
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(result.success).to.equal(true);
  });

  it('throws a helpful error when delete fails with non-404', async () => {
    const command = await setupCommand({force: true}, {sandboxId: 'zzzz-001', aliasId: 'alias-1'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    stubOdsClient(command, {
      async DELETE() {
        return {
          response: {status: 500, statusText: 'Internal Server Error'},
          error: {error: {message: 'Something went wrong'}},
        };
      },
    });

    try {
      await runSilent(() => command.run());
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to delete alias');
    }
  });
});
