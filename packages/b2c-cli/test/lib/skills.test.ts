/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {readdirSync, readFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Config} from '@oclif/core';
import {expect} from 'chai';
import {
  DEFAULT_SKILL_COLLECTION,
  SKILL_TOPIC_OVERRIDES,
  loadSkillCatalog,
  skillArgument,
  skillForCommand,
} from '../../src/lib/skills.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const skillsRoot = join(repoRoot, 'skills/b2c-cli/skills');

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap((item) => {
    if (item.name === 'evals' || item.name.startsWith('.')) return [];
    const path = join(dir, item.name);
    if (item.isDirectory()) return markdownFiles(path);
    return item.name.endsWith('.md') ? [path] : [];
  });
}

/** `b2c <words...>` invocations inside fenced code blocks. */
function codeBlockInvocations(markdown: string): string[][] {
  const invocations: string[][] = [];
  for (const block of markdown.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)) {
    for (const match of block[1].matchAll(/(?:^|[\s$(|&;`'"])b2c((?:\s+[a-z][a-z0-9-]*)+)/gm)) {
      invocations.push(match[1].trim().split(/\s+/));
    }
  }
  return invocations;
}

describe('lib/skills', () => {
  let config: Config;
  const catalog = loadSkillCatalog();
  const has = (id: string) => catalog?.has(id) ?? false;

  before(async () => {
    config = await Config.load({root: fileURLToPath(new URL('../..', import.meta.url))});
  });

  it('loads the bundled skills (run: pnpm --filter @salesforce/b2c-cli run generate:guidance)', () => {
    expect(catalog, 'bundled skills').to.not.equal(undefined);
    expect(has('b2c-cli/b2c-code')).to.equal(true);
  });

  describe('skillForCommand', () => {
    it('applies the b2c-<topic> convention', () => {
      expect(skillForCommand('code:deploy', has)).to.equal('b2c-cli/b2c-code');
      expect(skillForCommand('mrt env var set', has)).to.equal('b2c-cli/b2c-mrt');
    });

    it('prefers the most specific prefix', () => {
      expect(skillForCommand('scapi:custom:status', has)).to.equal('b2c-cli/b2c-scapi-custom');
      expect(skillForCommand('job:import', has)).to.equal('b2c-cli/b2c-site-import-export');
      expect(skillForCommand('job:run', has)).to.equal('b2c-cli/b2c-job');
    });

    it('applies overrides and explicit no-skill topics', () => {
      expect(skillForCommand('auth:login', has)).to.equal('b2c-cli/b2c-config');
      expect(skillForCommand('ods:list', has)).to.equal('b2c-cli/b2c-sandbox');
      expect(skillForCommand('preferences:site:get', has)).to.equal(undefined);
      expect(skillForCommand('scapi:replications:list', has)).to.equal(undefined);
    });
  });

  it('abbreviates default-collection skill IDs', () => {
    expect(skillArgument('b2c-cli/b2c-code')).to.equal('b2c-code');
    expect(skillArgument('b2c/b2c-hooks')).to.equal('b2c/b2c-hooks');
  });

  // Drift guards: skills are the maintained guidance, so help pointers and
  // skill examples must stay in sync with the command tree.
  describe('drift', () => {
    it('maps every override to an existing skill', () => {
      const missing = Object.values(SKILL_TOPIC_OVERRIDES).filter((id) => id !== null && !has(id));
      expect(missing).to.deep.equal([]);
    });

    it('maps every command to a skill or an explicit no-skill topic', () => {
      const unmapped = config.commands
        .filter((command) => command.pluginName === config.name && !command.hidden)
        .filter((command) => !skillForCommand(command.id, has))
        .filter((command) => {
          const segments = command.id.split(':');
          return !segments.some((_, i) => SKILL_TOPIC_OVERRIDES[segments.slice(0, i + 1).join(':')] === null);
        })
        .map((command) => command.id);
      expect(unmapped, 'add a skill or a SKILL_TOPIC_OVERRIDES entry in src/lib/skills.ts').to.deep.equal([]);
    });

    it(`references only real commands in ${DEFAULT_SKILL_COLLECTION} skill code blocks`, () => {
      const isCommand = (id: string) => Boolean(config.findCommand(id));
      const isTopic = (id: string) => Boolean(config.findTopic(id));
      const unknown: string[] = [];
      let checked = 0;
      for (const file of markdownFiles(skillsRoot)) {
        for (const words of codeBlockInvocations(readFileSync(file, 'utf8'))) {
          checked++;
          let length = words.length;
          while (length > 0 && !isCommand(words.slice(0, length).join(':'))) length--;
          if (length > 0) continue;
          // No command prefix: acceptable only for a bare topic (e.g. `b2c mrt --help`).
          if (isTopic(words.join(':'))) continue;
          unknown.push(`${relative(repoRoot, file)}: b2c ${words.join(' ')}`);
        }
      }
      expect(checked, 'invocations found').to.be.greaterThan(100);
      expect(unknown).to.deep.equal([]);
    });
  });
});
