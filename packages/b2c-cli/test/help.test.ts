/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {fileURLToPath} from 'node:url';
import {Config} from '@oclif/core';
import {detectAgentContext} from '@salesforce/b2c-tooling-sdk/ux';
import {expect} from 'chai';
import B2CHelp from '../src/help.js';

class TestHelp extends B2CHelp {
  output: string[] = [];

  protected log(...args: string[]): void {
    this.output.push(args.join(' '));
  }

  setAgent(env: Record<string, string>): this {
    this.agentContext = detectAgentContext(env);
    return this;
  }
}

describe('B2CHelp', () => {
  let config: Config;

  before(async () => {
    config = await Config.load({root: fileURLToPath(new URL('..', import.meta.url))});
  });

  it('is registered as the oclif help class', () => {
    expect(config.pjson.oclif.helpClass).to.equal('./dist/help');
  });

  it('adds discovery pointers without agent guidance for humans', async () => {
    const help = new TestHelp(config).setAgent({});
    await help.showHelp([]);
    const text = help.output.join('\n');
    expect(text).to.include('DISCOVER');
    expect(text).to.include('docs skill');
    expect(text).to.not.include('AGENT GUIDANCE');
  });

  it('points topic and command help at the covering skill', async () => {
    const topic = new TestHelp(config).setAgent({});
    await topic.showHelp(['code']);
    expect(topic.output.join('\n')).to.include('docs skill b2c-code');

    const command = new TestHelp(config).setAgent({});
    await command.showHelp(['auth', 'login']);
    expect(command.output.join('\n')).to.include('docs skill b2c-config');
  });

  it('omits the skill pointer for topics without a skill', async () => {
    const help = new TestHelp(config).setAgent({});
    await help.showHelp(['preferences']);
    expect(help.output.join('\n')).to.not.include('SKILL');
  });

  it('appends agent guidance to root help when an agent is detected', async () => {
    const help = new TestHelp(config).setAgent({CLAUDECODE: '1'});
    await help.showHelp([]);
    const text = help.output.join('\n');
    expect(text).to.include('AGENT GUIDANCE');
    expect(text).to.include('Claude Code');
    expect(text).to.include('commands search');
    expect(text).to.include('docs skill --search');
    expect(text).to.not.include('setup skills');
  });

  it('appends topic-scoped search guidance to topic help', async () => {
    const help = new TestHelp(config).setAgent({SFCC_AGENT: 'test'});
    await help.showHelp(['mrt']);
    expect(help.output.join('\n')).to.include('--topic "mrt"');
  });

  it('tailors command help notes to the command flags', async () => {
    const help = new TestHelp(config).setAgent({SFCC_AGENT: 'test'});
    await help.showHelp(['sandbox', 'delete']);
    const text = help.output.join('\n');
    expect(text).to.include('AGENT NOTES');
    expect(text).to.include('--json');
    expect(text).to.include('pass --force');
  });

  it('omits the confirmation note for commands without --force/--yes', async () => {
    const help = new TestHelp(config).setAgent({SFCC_AGENT: 'test'});
    await help.showHelp(['code', 'list']);
    const text = help.output.join('\n');
    expect(text).to.include('AGENT NOTES');
    expect(text).to.not.include('Interactive prompts are disabled');
  });
});
