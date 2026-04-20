/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxUpdate from '../../../src/commands/sandbox/update.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
  stubJsonEnabled,
} from '../../helpers/test-setup.js';

function stubOdsClient(command: any, client: Partial<{PATCH: any}>): void {
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

describe('sandbox update', () => {
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
    const command = await createTestCommand(SandboxUpdate as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('sends resourceProfile in PATCH body when --resource-profile is set', async () => {
    const command = await setupCommand({'resource-profile': 'large'}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');
    stubJsonEnabled(command, true);

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async PATCH(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'sb-uuid-123',
              realm: 'zzzz',
              state: 'started',
              resourceProfile: 'large',
            },
          },
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestUrl).to.equal('/sandboxes/{sandboxId}');
    expect(requestOptions).to.have.nested.property('params.path.sandboxId', 'sb-uuid-123');
    expect(requestOptions).to.have.nested.property('body.resourceProfile', 'large');
    expect(result.resourceProfile).to.equal('large');
  });

  it('allows combining --resource-profile with other update flags', async () => {
    const command = await setupCommand(
      {'resource-profile': 'xlarge', ttl: 48, tags: 'ci,nightly'},
      {sandboxId: 'zzzz-001'},
    );

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');
    stubJsonEnabled(command, true);

    let requestOptions: any;
    stubOdsClient(command, {
      async PATCH(_: string, options: any) {
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'sb-uuid-123',
              realm: 'zzzz',
              state: 'started',
              resourceProfile: 'xlarge',
              tags: ['ci', 'nightly'],
            },
          },
        };
      },
    });

    await runSilent(() => command.run());

    expect(requestOptions.body).to.include({
      ttl: 48,
      resourceProfile: 'xlarge',
    });
    expect(requestOptions.body.tags).to.deep.equal(['ci', 'nightly']);
  });

  it('supports --no-auto-scheduled and sends autoScheduled=false', async () => {
    const command = await setupCommand({'auto-scheduled': false}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');
    stubJsonEnabled(command, true);

    let requestOptions: any;
    stubOdsClient(command, {
      async PATCH(_: string, options: any) {
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'sb-uuid-123',
              realm: 'zzzz',
              state: 'started',
              autoScheduled: false,
            },
          },
        };
      },
    });

    await runSilent(() => command.run());

    expect(requestOptions.body).to.include({
      autoScheduled: false,
    });
  });

  it('trims tags and emails when combined with --resource-profile', async () => {
    const command = await setupCommand(
      {
        'resource-profile': 'xxlarge',
        tags: ' ci , nightly ',
        emails: ' dev@example.com , qa@example.com ',
      },
      {sandboxId: 'zzzz-001'},
    );

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');
    stubJsonEnabled(command, true);

    let requestOptions: any;
    stubOdsClient(command, {
      async PATCH(_: string, options: any) {
        requestOptions = options;
        return {
          data: {
            data: {
              id: 'sb-uuid-123',
              realm: 'zzzz',
              state: 'started',
              resourceProfile: 'xxlarge',
              tags: ['ci', 'nightly'],
              emails: ['dev@example.com', 'qa@example.com'],
            },
          },
        };
      },
    });

    const result: any = await runSilent(() => command.run());

    expect(requestOptions.body.resourceProfile).to.equal('xxlarge');
    expect(requestOptions.body.tags).to.deep.equal(['ci', 'nightly']);
    expect(requestOptions.body.emails).to.deep.equal(['dev@example.com', 'qa@example.com']);
    expect(result.tags).to.deep.equal(['ci', 'nightly']);
    expect(result.emails).to.deep.equal(['dev@example.com', 'qa@example.com']);
  });

  it('requires at least one update flag including --resource-profile', async () => {
    const command = await setupCommand({}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');
    stubOdsClient(command, {
      async PATCH() {
        throw new Error('PATCH should not be called when no flags are provided');
      },
    });

    try {
      await runSilent(() => command.run());
      expect.fail('Expected command to error when no update flags are provided');
    } catch (error: any) {
      expect(error.message).to.include('At least one update flag is required');
      expect(error.message).to.include('--resource-profile');
    }
  });

  it('throws a helpful error when API update fails', async () => {
    const command = await setupCommand({'resource-profile': 'large'}, {sandboxId: 'zzzz-001'});

    sinon.stub(command as any, 'resolveSandboxId').resolves('sb-uuid-123');
    stubOdsClient(command, {
      async PATCH() {
        return {
          data: undefined,
          error: {error: {message: 'Profile update not allowed in current state'}},
          response: {statusText: 'Bad Request'},
        };
      },
    });

    try {
      await runSilent(() => command.run());
      expect.fail('Expected command to throw on API error');
    } catch (error: any) {
      expect(error.message).to.include('Failed to update sandbox');
      expect(error.message).to.match(/Profile update not allowed|Bad Request/);
    }
  });
});
