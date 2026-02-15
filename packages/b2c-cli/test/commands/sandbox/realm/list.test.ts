/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxRealmList from '../../../../src/commands/sandbox/realm/list.js';
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

describe('sandbox realm list', () => {
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
    const command = await createTestCommand(SandboxRealmList as any, config, flags, args);

    stubOdsHost(command);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);

    return command;
  }

  it('discovers realms from /me when no realm argument is provided', async () => {
    const command = await setupCommand({json: true}, {});

    const getStub = sinon.stub();

    getStub.callsFake(async (url: string, options: any) => {
      if (url === '/me') {
        return {
          data: {
            data: {
              realms: ['zzza', 'zzzb'],
            },
          },
        };
      }

      if (url === '/realms/{realm}/configuration') {
        const realmId = options.params.path.realm;
        return {
          data: {
            data: {
              enabled: realmId === 'zzza',
            },
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    stubOdsClient(command, {GET: getStub});

    const result: any = await runSilent(() => command.run());

    expect(result.realms).to.have.lengthOf(2);
    expect(result.realms[0].realmId).to.equal('zzza');
    expect(result.realms[0].configuration?.enabled).to.equal(true);
    expect(result.realms[1].realmId).to.equal('zzzb');
    expect(result.realms[1].configuration?.enabled).to.equal(false);
  });

  it('fetches configuration for a specific realm when argument is provided', async () => {
    const command = await setupCommand({json: true}, {realm: 'zzzz'});

    const getStub = sinon.stub().callsFake(async (url: string, options: any) => {
      if (url === '/realms/{realm}/configuration') {
        expect(options).to.have.nested.property('params.path.realm', 'zzzz');
        return {
          data: {
            data: {
              enabled: true,
            },
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    stubOdsClient(command, {GET: getStub});

    const result: any = await runSilent(() => command.run());

    expect(result.realms).to.have.lengthOf(1);
    expect(result.realms[0].realmId).to.equal('zzzz');
    expect(result.realms[0].configuration?.enabled).to.equal(true);
  });
});
