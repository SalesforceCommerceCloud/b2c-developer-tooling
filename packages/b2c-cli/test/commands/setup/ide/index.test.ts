/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import sinon from 'sinon';
import SetupIdeIndex from '../../../../src/commands/setup/ide/index.js';

describe('setup ide', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should have a description', () => {
    expect(SetupIdeIndex.description).to.be.a('string');
    expect(SetupIdeIndex.description).to.include('IDE');
  });

  it('should show setup ide help when run', async () => {
    const command = new SetupIdeIndex([], {} as any);
    const runCommand = sinon.stub().resolves(undefined);

    Object.defineProperty(command, 'config', {
      value: {runCommand},
      configurable: true,
    });

    await command.run();

    expect(runCommand.calledOnceWithExactly('help', ['setup', 'ide'])).to.equal(true);
  });
});
