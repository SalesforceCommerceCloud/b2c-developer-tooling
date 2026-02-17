/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxRealmUpdate from '../../../../src/commands/sandbox/realm/update.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
} from '../../../helpers/test-setup.js';

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

describe('sandbox realm update', () => {
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
    const command = await createTestCommand(SandboxRealmUpdate as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('builds TTL update body correctly', async () => {
    const command = await setupCommand({'max-sandbox-ttl': 72, 'default-sandbox-ttl': 24, json: true}, {realm: 'zzzz'});

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async PATCH(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {data: {}};
      },
    });

    await runSilent(() => command.run());

    expect(requestUrl).to.equal('/realms/{realm}/configuration');
    expect(requestOptions).to.have.nested.property('params.path.realm', 'zzzz');
    expect(requestOptions).to.have.nested.property('body.sandbox.sandboxTTL.maximum', 72);
    expect(requestOptions).to.have.nested.property('body.sandbox.sandboxTTL.defaultValue', 24);
  });

  it('parses scheduler flags and includes them in the body', async () => {
    const startSchedule = {weekdays: ['MONDAY'], time: '08:00:00Z'};

    const command = await setupCommand(
      {
        'start-scheduler': JSON.stringify(startSchedule),
        'stop-scheduler': 'null',
        json: true,
      },
      {realm: 'zzzz'},
    );

    let requestOptions: any;

    stubOdsClient(command, {
      async PATCH(_url: string, options: any) {
        requestOptions = options;
        return {data: {}};
      },
    });

    await runSilent(() => command.run());

    expect(requestOptions).to.have.nested.property('body.sandbox.startScheduler');
    expect(requestOptions.body.sandbox.startScheduler).to.deep.equal(startSchedule);
    expect(requestOptions).to.have.nested.property('body.sandbox.stopScheduler', null);
  });

  it('throws a helpful error on invalid scheduler JSON', async () => {
    const command = await setupCommand({'start-scheduler': 'not-json'}, {realm: 'zzzz'});

    stubOdsClient(command, {
      async PATCH() {
        return {data: {}};
      },
    });

    try {
      await runSilent(() => command.run());
      expect.fail('Expected error');
    } catch (error: any) {
      expect(error.message).to.include('Invalid JSON for scheduler');
    }
  });
});
