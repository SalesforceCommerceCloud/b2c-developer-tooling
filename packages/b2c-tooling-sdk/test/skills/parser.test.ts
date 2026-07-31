/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {expect} from 'chai';
import {configureLogger, resetLogger} from '../../src/logging/logger.js';
import {parseSkillFrontmatter, scanSkills} from '../../src/skills/parser.js';
import {CapturingStream} from '../helpers/null-stream.js';

describe('parseSkillFrontmatter', () => {
  it('parses simple key: value frontmatter', () => {
    const content = `---
name: my-skill
description: A simple skill description
---

# My Skill

Body content here.`;

    const result = parseSkillFrontmatter(content);
    expect(result).to.deep.equal({
      name: 'my-skill',
      description: 'A simple skill description',
    });
  });

  it('parses multi-line YAML block scalar (>-)', () => {
    const content = `---
name: scaffold-app
description: >-
  Generate complete commerce app scaffolding with architecture-aware structure.
  Use immediately when users mention "new app", "create app", "scaffold", "starter template",
  or describe building a commerce integration (tax, payment, shipping, loyalty, etc.).
---

# Scaffold App`;

    const result = parseSkillFrontmatter(content);
    expect(result).to.not.be.null;
    expect(result!.name).to.equal('scaffold-app');
    expect(result!.description).to.include('Generate complete commerce app scaffolding');
    expect(result!.description).to.include('commerce integration');
  });

  it('parses literal block scalar (|)', () => {
    const content = `---
name: test-skill
description: |
  Line one.
  Line two.
  Line three.
---

# Test`;

    const result = parseSkillFrontmatter(content);
    expect(result).to.not.be.null;
    expect(result!.name).to.equal('test-skill');
    expect(result!.description).to.include('Line one.');
    expect(result!.description).to.include('Line two.');
  });

  it('returns null for missing frontmatter', () => {
    expect(parseSkillFrontmatter('# No frontmatter')).to.be.null;
  });

  it('returns null for missing name', () => {
    const content = `---
description: Has description but no name
---`;
    expect(parseSkillFrontmatter(content)).to.be.null;
  });

  it('returns null for missing description', () => {
    const content = `---
name: has-name-only
---`;
    expect(parseSkillFrontmatter(content)).to.be.null;
  });

  it('returns null for invalid YAML', () => {
    const content = `---
name: [invalid
description: also [broken
---`;
    expect(parseSkillFrontmatter(content)).to.be.null;
  });

  it('identifies the invalid skill path in scan warnings', async () => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'b2c-skill-parser-'));
    const skillDir = path.join(tempDir, 'skills', 'broken-skill');
    const skillPath = path.join(skillDir, 'SKILL.md');
    const output = new CapturingStream();

    try {
      await fs.promises.mkdir(skillDir, {recursive: true});
      await fs.promises.writeFile(skillPath, '---\nname: [invalid\n---\n');
      configureLogger({level: 'warn', destination: output, colorize: false});

      expect(await scanSkills(tempDir, 'b2c')).to.deep.equal([]);
      expect(output.getOutput()).to.include(`Invalid frontmatter in ${skillPath}`);
    } finally {
      resetLogger();
      await fs.promises.rm(tempDir, {recursive: true, force: true});
    }
  });
});
