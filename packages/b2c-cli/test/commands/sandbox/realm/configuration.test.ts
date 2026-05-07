/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import SandboxRealmConfiguration from '../../../../src/commands/sandbox/realm/configuration.js';
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

describe('sandbox realm configuration', () => {
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
    const command = await createTestCommand(SandboxRealmConfiguration as any, config, flags, args);
    (command as any).log = () => {};
    makeCommandThrowOnError(command);
    return command;
  }

  it('calls /realms/{realm}/configuration with provided realm', async () => {
    const command = await setupCommand({}, {realm: 'zzzz'});
    sinon.stub(command as any, 'jsonEnabled').returns(false);

    let requestUrl: string | undefined;
    let requestOptions: any;

    stubOdsClient(command, {
      async GET(url: string, options: any) {
        requestUrl = url;
        requestOptions = options;
        return {data: {data: {enabled: true}}};
      },
    });

    const result = await runSilent(() => command.run());
    expect(requestUrl).to.equal('/realms/{realm}/configuration');
    expect(requestOptions).to.have.nested.property('params.path.realm', 'zzzz');
    expect(result).to.deep.equal({enabled: true});
  });

  it('returns full response in JSON mode', async () => {
    const command = await setupCommand({json: true}, {realm: 'zzzz'});
    sinon.stub(command as any, 'jsonEnabled').returns(true);

    const response = {data: {data: {enabled: false}}};

    stubOdsClient(command, {
      async GET() {
        return response;
      },
    });

    const result = await runSilent(() => command.run());
    expect(result).to.deep.equal(response.data);
  });
});
