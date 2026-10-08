/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {expect} from 'chai';
import {confirm, ConfirmationRequiredError, resetAgentContext} from '@salesforce/b2c-tooling-sdk/ux';

describe('ux/confirm', () => {
  let savedIsTTY: boolean | undefined;
  let savedAgent: string | undefined;

  beforeEach(() => {
    savedIsTTY = process.stdin.isTTY;
    savedAgent = process.env.SFCC_AGENT;
  });

  afterEach(() => {
    process.stdin.isTTY = savedIsTTY as true;
    if (savedAgent === undefined) delete process.env.SFCC_AGENT;
    else process.env.SFCC_AGENT = savedAgent;
    resetAgentContext();
  });

  function setSession(options: {agent?: string; tty: boolean}): void {
    process.stdin.isTTY = options.tty as true;
    process.env.SFCC_AGENT = options.agent ?? '0';
    resetAgentContext();
  }

  it('throws ConfirmationRequiredError when stdin is not a TTY', async () => {
    setSession({tty: false});
    try {
      await confirm('Delete everything?');
      expect.fail('expected confirm to throw');
    } catch (error) {
      expect(error).to.be.instanceOf(ConfirmationRequiredError);
      const err = error as ConfirmationRequiredError;
      expect(err.code).to.equal('CONFIRMATION_REQUIRED');
      expect(err.prompt).to.equal('Delete everything?');
      expect(err.message).to.include('no interactive terminal');
      expect(err.message).to.include('--force');
    }
  });

  it('throws when an AI agent is detected even with a TTY', async () => {
    setSession({tty: true, agent: 'Claude Code'});
    try {
      await confirm('Delete everything?');
      expect.fail('expected confirm to throw');
    } catch (error) {
      expect(error).to.be.instanceOf(ConfirmationRequiredError);
      expect((error as Error).message).to.include('AI agent (Claude Code)');
    }
  });

  it('resolves to the default answer with nonInteractive: default', async () => {
    setSession({tty: false});
    expect(await confirm('Continue?', {nonInteractive: 'default'})).to.equal(false);
    expect(await confirm('Continue?', {defaultYes: true, nonInteractive: 'default'})).to.equal(true);
  });
});
