/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxAliasGet from '../../../../src/commands/sandbox/alias/get.js';
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

describe('sandbox alias get', () => {
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
    const command = await createTestCommand(SandboxAliasGet as any, config, flags, args);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);
    return command;
  }

  it('calls GET /sandboxes/{sandboxId}/aliases/{sandboxAliasId}', async () => {
    const aliasUuid = '550e8400-e29b-41d4-a716-446655440000';
    const command = await setupCommand({}, {sandboxId: 'zzzz-001', aliasId: aliasUuid});
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
              id: aliasUuid,
              name: 'www.example.com',
              status: 'verified',
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());
    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/aliases/{sandboxAliasId}');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('params.path.sandboxAliasId', aliasUuid);
    expect(result).to.deep.include({id: aliasUuid, name: 'www.example.com'});
  });

  it('returns alias model in JSON mode', async () => {
    const aliasUuid = '550e8400-e29b-41d4-a716-446655440000';
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001', aliasId: aliasUuid});
    sinon.stub(command as any, 'jsonEnabled').returns(true);
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    const alias = {id: aliasUuid, name: 'store.example.com', status: 'pending' as const};

    stubOdsClient(command, {
      async GET() {
        return {
          data: {
            status: 'Success' as const,
            data: alias,
          },
        };
      },
    });

    const result = await runSilent(() => command.run());
    expect(result).to.deep.equal(alias);
  });
});
