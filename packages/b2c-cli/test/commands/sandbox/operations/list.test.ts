/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxOperationsList from '../../../../src/commands/sandbox/operations/list.js';
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

describe('sandbox operations list', () => {
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
    const command = await createTestCommand(SandboxOperationsList as any, config, flags, args);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);
    return command;
  }

  it('calls GET /sandboxes/{sandboxId}/operations with resolved sandbox id', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001'});
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
            data: [
              {
                id: 'op-1',
                operation: 'start',
                operationState: 'finished',
                status: 'success',
              },
            ],
            metadata: {page: 0, totalCount: 1},
          },
        };
      },
    });

    const result = (await runSilent(() => command.run())) as {data?: {length: number}};
    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/operations');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(result).to.have.property('data');
    expect(result.data).to.have.length(1);
  });

  it('passes query filters when provided', async () => {
    const command = await setupCommand(
      {'operation-state': 'finished', page: 1, 'per-page': 10},
      {sandboxId: 'zzzz-001'},
    );
    sinon.stub(command as any, 'jsonEnabled').returns(false);
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestOptions: any;

    stubOdsClient(command, {
      async GET(_url: string, options: any) {
        requestOptions = options;
        return {data: {status: 'Success', data: []}};
      },
    });

    await runSilent(() => command.run());
    expect(requestOptions.params.query).to.deep.include({
      operation_state: 'finished',
      page: 1,
      per_page: 10,
    });
  });

  it('returns full API payload in JSON mode', async () => {
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001'});
    sinon.stub(command as any, 'jsonEnabled').returns(true);
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    const apiResponse = {
      status: 'Success' as const,
      data: [],
      metadata: {page: 0},
    };

    stubOdsClient(command, {
      async GET() {
        return {data: apiResponse};
      },
    });

    const result = await runSilent(() => command.run());
    expect(result).to.deep.equal(apiResponse);
  });
});
