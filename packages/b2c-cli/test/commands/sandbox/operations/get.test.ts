/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxOperationsGet from '../../../../src/commands/sandbox/operations/get.js';
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

describe('sandbox operations get', () => {
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
    const command = await createTestCommand(SandboxOperationsGet as any, config, flags, args);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);
    return command;
  }

  it('calls GET /sandboxes/{sandboxId}/operations/{operationId}', async () => {
    const opId = '550e8400-e29b-41d4-a716-446655440000';
    const command = await setupCommand({}, {sandboxId: 'zzzz-001', operationId: opId});
    sinon.stub(command as any, 'jsonEnabled').returns(false);
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            status: 'Success',
            data: {
              id: opId,
              operation: 'start',
              operationState: 'finished',
              status: 'success',
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());
    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/operations/{operationId}');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('params.path.operationId', opId);
    expect(result).to.include({id: opId, operation: 'start'});
  });

  it('returns operation model in JSON mode', async () => {
    const opId = '550e8400-e29b-41d4-a716-446655440000';
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001', operationId: opId});
    sinon.stub(command as any, 'jsonEnabled').returns(true);
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    const operation = {id: opId, operation: 'stop' as const, operationState: 'finished' as const};

    stubOdsClient(command, {
      async GET() {
        return {
          data: {
            status: 'Success' as const,
            data: operation,
          },
        };
      },
    });

    const result = await runSilent(() => command.run());
    expect(result).to.deep.equal(operation);
  });
});
