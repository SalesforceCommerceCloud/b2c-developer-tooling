/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {expect} from 'chai';
import sinon from 'sinon';
import Test from '../../../src/commands/_test/index.js';
import {createIsolatedConfigHooks, createTestCommand} from '../../helpers/test-setup.js';

describe('commands/_test', () => {
  const hooks = createIsolatedConfigHooks();

  beforeEach(async () => {
    await hooks.beforeEach();
  });

  afterEach(() => {
    hooks.afterEach();
  });

  async function createCommand(): Promise<any> {
    return createTestCommand(Test, hooks.getConfig(), {}, {});
  }

  it('exercises logging functionality', async () => {
    const command = await createCommand();

    const logStub = sinon.stub(command, 'log');
    const traceStub = sinon.stub(command.logger, 'trace');
    const infoStub = sinon.stub(command.logger, 'info');

    await command.run();

    // Structural assertions: each logger surface gets at least one non-empty
    // string argument. The exact debug copy is not part of any contract.
    const hadStringArg = (stub: sinon.SinonStub) =>
      stub.getCalls().some((call) => typeof call.args[0] === 'string' && (call.args[0] as string).length > 0);

    expect(hadStringArg(logStub), 'command.log called with non-empty string').to.equal(true);
    expect(hadStringArg(traceStub), 'logger.trace called with non-empty string').to.equal(true);
    expect(hadStringArg(infoStub), 'logger.info called with non-empty string').to.equal(true);
  });

  it('logs with context objects', async () => {
    const command = await createCommand();

    sinon.stub(command, 'log');
    const infoStub = sinon.stub(command.logger, 'info');

    await command.run();

    // Verify info was called with context objects
    const callWithContext = infoStub
      .getCalls()
      .find((call) => call.args[0] && typeof call.args[0] === 'object' && 'operation' in call.args[0]);
    expect(callWithContext).to.exist;
    expect(callWithContext?.args[0]).to.deep.include({operation: 'test', duration: 123});
  });

  it('logs with redacted sensitive fields', async () => {
    const command = await createCommand();

    sinon.stub(command, 'log');
    const infoStub = sinon.stub(command.logger, 'info');

    await command.run();

    // Verify info was called with object containing sensitive fields
    const callWithSensitive = infoStub
      .getCalls()
      .find((call) => call.args[0] && typeof call.args[0] === 'object' && 'password' in call.args[0]);
    expect(callWithSensitive).to.exist;
    expect(callWithSensitive?.args[0]).to.have.property('password');
    expect(callWithSensitive?.args[0]).to.have.property('client_secret');
  });
});
