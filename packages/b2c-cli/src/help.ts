/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {Command, Help, type Interfaces} from '@oclif/core';
import {getAgentContext, type AgentContext} from '@salesforce/b2c-tooling-sdk/ux';
import {loadSkillCatalog, skillArgument, skillForCommand} from './lib/skills.js';

/**
 * Custom help class that adds discovery pointers (command search, skills, docs
 * search) and links topics and commands to the skill that covers them. Workflow
 * guidance itself lives in the skills (`b2c docs skill`) rather than in help.
 * When the CLI is driven by an AI coding agent (Claude Code, Cursor, Codex, ...)
 * short notes on agent behavior (prompts, --json) are appended.
 *
 * Registered via `oclif.helpClass` in package.json.
 */
export default class B2CHelp extends Help {
  /** Overridable for tests. */
  protected agentContext: AgentContext = getAgentContext();

  /** Overridable for tests. */
  protected skillExists: (id: string) => boolean = (id) => loadSkillCatalog()?.has(id) ?? false;

  protected formatAgentCommandNotes(command: Command.Loadable): string {
    const bin = this.config.bin;
    const flags = command.flags ?? {};
    const notes: string[] = [];
    if (flags.json) {
      notes.push('Add --json for machine-readable output on stdout (logs go to stderr).');
    }
    const skipPrompt = ['force', 'yes'].find((name) => flags[name]);
    if (skipPrompt) {
      notes.push(
        `Interactive prompts are disabled for agents; pass --${skipPrompt} to confirm destructive actions ` +
          'after verifying the target.',
      );
    }
    notes.push(`Find related commands: ${bin} commands search "<task>" --json`);
    return this.section('AGENT NOTES', notes.map((n) => `- ${n}`).join('\n')) + '\n';
  }

  protected formatAgentGuidance(): string {
    const bin = this.config.bin;
    const lines = [
      `Detected AI agent: ${this.agentContext.harness?.name ?? 'unknown'}.`,
      `- Read the skill for your task before running commands: ${bin} docs skill --search "<task>"`,
      '- Most commands support --json (results on stdout, logs on stderr).',
      '- Interactive prompts are disabled; destructive commands fail unless --force (or --yes) is passed.',
      `- Inspect resolved configuration (instance, auth, safety): ${bin} setup inspect --json`,
    ];
    return this.section('AGENT GUIDANCE', lines.join('\n')) + '\n';
  }

  protected formatDiscovery(): string {
    const bin = this.config.bin;
    const lines = [
      `Find a command for a task:      ${bin} commands search "<task>"`,
      `Read workflow guidance:         ${bin} docs skill [<topic>]`,
      `Search B2C documentation:       ${bin} docs search "<query>"`,
    ];
    return this.section('DISCOVER', lines.join('\n')) + '\n';
  }

  /** `SKILL` section pointing at the skill for a command or topic, if one exists. */
  protected formatSkill(id: string): string | undefined {
    const skill = skillForCommand(id, this.skillExists);
    if (!skill) return undefined;
    return this.section('SKILL', `${this.config.bin} docs skill ${skillArgument(skill)}`) + '\n';
  }

  async showCommandHelp(command: Command.Loadable): Promise<void> {
    await super.showCommandHelp(command);
    const skill = this.formatSkill(command.id);
    if (skill) this.log(skill);
    if (this.agentContext.isAgentic) {
      this.log(this.formatAgentCommandNotes(command));
    }
  }

  protected async showRootHelp(): Promise<void> {
    await super.showRootHelp();
    this.log(this.formatDiscovery());
    if (this.agentContext.isAgentic) {
      this.log(this.formatAgentGuidance());
    }
  }

  protected async showTopicHelp(topic: Interfaces.Topic): Promise<void> {
    await super.showTopicHelp(topic);
    const skill = this.formatSkill(topic.name);
    if (skill) this.log(skill);
    if (this.agentContext.isAgentic) {
      const bin = this.config.bin;
      const display = topic.name.replaceAll(':', ' ');
      this.log(
        this.section(
          'AGENT NOTES',
          [
            `- Search within this topic: ${bin} commands search "<task>" --topic "${display}" --json`,
            `- Search B2C docs: ${bin} docs search "<topic>" --json`,
          ].join('\n'),
        ) + '\n',
      );
    }
  }
}
