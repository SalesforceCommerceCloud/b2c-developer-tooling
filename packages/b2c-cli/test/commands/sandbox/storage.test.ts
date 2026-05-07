/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxStorage from '../../../src/commands/sandbox/storage.js';
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

describe('sandbox storage', () => {
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
    const command = await createTestCommand(SandboxStorage as any, config, flags, args);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);
    return command;
  }

  it('calls /sandboxes/{sandboxId}/storage with resolved sandbox id', async () => {
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
            data: {
              impex: {spaceTotal: 1000, spaceUsed: 500, percentageUsed: 50},
            },
          },
        };
      },
    });

    const result = await runSilent(() => command.run());
    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/storage');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(result).to.deep.equal({
      impex: {spaceTotal: 1000, spaceUsed: 500, percentageUsed: 50},
    });
  });

  it('returns full response in JSON mode', async () => {
    const command = await setupCommand({json: true}, {sandboxId: 'zzzz-001'});
    sinon.stub(command as any, 'jsonEnabled').returns(true);
    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    const response = {
      data: {
        data: {
          logs: {spaceTotal: 200, spaceUsed: 20, percentageUsed: 10},
        },
      },
    };

    stubOdsClient(command, {
      async GET() {
        return response;
      },
    });

    const result = await runSilent(() => command.run());
    expect(result).to.deep.equal(response.data);
  });
});
