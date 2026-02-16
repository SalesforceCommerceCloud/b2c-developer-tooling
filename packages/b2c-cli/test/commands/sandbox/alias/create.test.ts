/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxAliasCreate from '../../../../src/commands/sandbox/alias/create.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
} from '../../../helpers/test-setup.js';

function stubOdsClient(command: any, client: Partial<{POST: any}>): void {
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

describe('sandbox alias create', () => {
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
    const command = await createTestCommand(SandboxAliasCreate as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('creates an alias with correct body and returns the alias', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001', hostname: 'my-store.example.com'});

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
              id: 'alias-1',
              name: 'my-store.example.com',
              status: 'PENDING',
            },
          },
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/sandboxes/{sandboxId}/aliases');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('body.name', 'my-store.example.com');

    expect(result.id).to.equal('alias-1');
    expect(result.name).to.equal('my-store.example.com');
  });

  it('sets unique and letsencrypt flags in the request body', async () => {
    const command = await setupCommand(
      {unique: true, letsencrypt: true},
      {
        sandboxId: 'zzzz-001',
        hostname: 'secure-store.example.com',
      },
    );

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');

    let requestOptions: any;

    stubOdsClient(command, {
      async POST(_url: string, options: any) {
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'alias-2',
              name: 'secure-store.example.com',
              status: 'PENDING',
              unique: true,
              requestLetsEncryptCertificate: true,
            },
          },
        };
      },
    });

    await runSilent(() => command.run());

    expect(requestOptions).to.have.nested.property('body.unique', true);
    expect(requestOptions).to.have.nested.property('body.requestLetsEncryptCertificate', true);
  });

  it('throws a helpful error when the create call fails', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001', hostname: 'my-store.example.com'});

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
      expect(error.message).to.include('Failed to create alias');
    }
  });
});
