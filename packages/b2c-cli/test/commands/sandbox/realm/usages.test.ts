/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxRealmUsages from '../../../../src/commands/sandbox/realm/usages.js';
import {
  createIsolatedConfigHooks,
  createTestCommand,
  makeCommandThrowOnError,
  runSilent,
} from '../../../helpers/test-setup.js';

function stubOdsClient(command: any, client: Partial<{GET: any; POST: any}>): void {
  Object.defineProperty(command, 'odsClient', {
    value: client,
    configurable: true,
  });
}

describe('sandbox realm usages', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    sinon.restore();
    hooks.afterEach();
  });

  async function setupCommand(flags: Record<string, unknown>): Promise<any> {
    const config = hooks.getConfig();
    const command = await createTestCommand(SandboxRealmUsages as any, config, flags, {});
    (command as any).log = () => {};
    makeCommandThrowOnError(command);
    return command;
  }

  it('calls /realms/usages with provided realms', async () => {
    const command = await setupCommand({
      realm: ['zzzz', 'yyyy'],
      from: '2026-01-01',
      to: '2026-01-31',
      'detailed-report': true,
    });

    sinon.stub(command as any, 'jsonEnabled').returns(false);

    let requestBody: any;
    stubOdsClient(command, {
      async POST(url: string, options: any) {
        expect(url).to.equal('/realms/usages');
        requestBody = options.body;
        return {data: {data: [{realmName: 'zzzz', realmUsage: {activeSandboxes: 1}}]}};
      },
    });

    const result = await runSilent(() => command.run());

    expect(requestBody).to.deep.equal({
      from: '2026-01-01',
      to: '2026-01-31',
      realms: ['zzzz', 'yyyy'],
      detailedReport: true,
    });
    expect(result).to.deep.equal([{realmName: 'zzzz', realmUsage: {activeSandboxes: 1}}]);
  });

  it('discovers realms from /me when no realm flag is provided', async () => {
    const command = await setupCommand({});
    sinon.stub(command as any, 'jsonEnabled').returns(false);

    const getStub = sinon.stub().resolves({data: {data: {realms: ['zzzz', 'yyyy']}}});
    const postStub = sinon.stub().resolves({data: {data: [{realmName: 'zzzz'}, {realmName: 'yyyy'}]}});

    stubOdsClient(command, {
      GET: getStub,
      POST: postStub,
    });

    await runSilent(() => command.run());

    expect(getStub.calledOnceWithExactly('/me', {})).to.be.true;
    expect(postStub.calledOnce).to.be.true;
    expect(postStub.firstCall.args[1].body.realms).to.deep.equal(['zzzz', 'yyyy']);
  });
});
