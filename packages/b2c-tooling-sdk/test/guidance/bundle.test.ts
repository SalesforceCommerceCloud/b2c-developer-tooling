/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect} from 'chai';
import {bundleGuidance, type GuidanceManifest} from '@salesforce/b2c-tooling-sdk/guidance';

describe('guidance bundler', () => {
  let repoRoot: string;
  let destination: string;

  function writeSkill(
    name: string,
    body = '# Skill\n',
    frontmatter = `name: ${name}\ndescription: ${name} skill`,
    plugin = 'demo',
  ) {
    const dir = join(repoRoot, 'skills', plugin, 'skills', name);
    mkdirSync(join(dir, 'references'), {recursive: true});
    writeFileSync(join(dir, 'SKILL.md'), `---\n${frontmatter}\n---\n${body}`);
    writeFileSync(join(dir, 'references/extra.md'), '# Extra\n');
  }

  function bundle(checkSkillUris?: boolean) {
    return bundleGuidance({
      repoRoot,
      collections: [{id: 'demo', title: 'Demo', isGA: true, plugin: 'demo'}],
      checkSkillUris,
      destination,
    });
  }

  beforeEach(() => {
    repoRoot = mkdtempSync(join(tmpdir(), 'b2c-bundle-'));
    destination = join(repoRoot, 'out');
    mkdirSync(join(repoRoot, 'skills'), {recursive: true});
    writeFileSync(join(repoRoot, 'skills/plugins.json'), JSON.stringify({plugins: [{name: 'demo'}, {name: 'other'}]}));
    mkdirSync(join(repoRoot, 'skills/other/skills'), {recursive: true});
  });

  afterEach(() => {
    rmSync(repoRoot, {recursive: true, force: true});
  });

  it('writes files with verbatim frontmatter and digests', () => {
    writeSkill('alpha', '# Alpha\n\nSee [extra](references/extra.md) and skill://demo/alpha/references/extra.md.\n');

    expect(bundle()).to.deep.equal({entries: 1, files: 2});
    const manifest = JSON.parse(readFileSync(join(destination, 'index.json'), 'utf8')) as GuidanceManifest;
    const [entry] = manifest.entries;
    expect(entry.frontmatter).to.deep.equal({name: 'alpha', description: 'alpha skill'});
    expect(entry.files.map((file) => file.digest)).to.satisfy((digests: string[]) =>
      digests.every((digest) => /^sha256:[0-9a-f]{64}$/.test(digest)),
    );
  });

  it('rejects a name that differs from its directory', () => {
    writeSkill('alpha', '# Alpha\n', 'name: beta\ndescription: mismatched');
    expect(() => bundle()).to.throw('must equal its directory');
  });

  it('rejects frontmatter that is not JSON-compatible', () => {
    writeSkill('alpha', '# Alpha\n', 'name: alpha\ndescription: dated\nupdated: 2026-01-01');
    expect(() => bundle()).to.throw('JSON-compatible');
  });

  it('rejects relative links outside the skill', () => {
    writeSkill('alpha', '# Alpha\n\nSee [beta](../beta/SKILL.md).\n');
    writeSkill('beta');
    expect(() => bundle()).to.throw('must resolve to a file in the same skill');
  });

  it('rejects tooling docs links to HTML pages', () => {
    writeSkill(
      'alpha',
      '# Alpha\n\n[Guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/x)\n',
    );
    expect(() => bundle()).to.throw('Markdown page');
  });

  it('checks skill:// URIs unless disabled for a partial bundle', () => {
    writeSkill('alpha', '# Alpha\n\nRead skill://other/gamma/SKILL.md first.\n');

    expect(() => bundle()).to.throw('Unknown skill URI skill://other/gamma/SKILL.md');
    expect(bundle(false).entries).to.equal(1);
  });

  it('resolves <plugin>:<skill> references across bundled and unbundled plugins', () => {
    writeSkill('gamma', '# Gamma\n', undefined, 'other');
    writeSkill('alpha', '# Alpha\n\nUse other:gamma, then demo:alpha.\n');
    expect(bundle().entries).to.equal(1);

    writeSkill('alpha', '# Alpha\n\nUse other:missing.\n');
    expect(() => bundle()).to.throw('Unknown skill other:missing in demo/alpha/SKILL.md');
  });

  it('validates skills in plugins that are not bundled', () => {
    writeSkill('alpha');
    writeSkill('gamma', '# Gamma\n\nSee [x](../alpha/SKILL.md).\n', undefined, 'other');
    expect(() => bundle()).to.throw('other/gamma/SKILL.md must resolve to a file in the same skill');

    writeSkill('gamma', '# Gamma\n', 'name: wrong\ndescription: mismatched', 'other');
    expect(() => bundle()).to.throw('must equal its directory');
  });

  it('preserves the previous bundle when validation fails', () => {
    writeSkill('alpha');
    bundle();
    writeSkill('beta', '# Beta\n', 'name: Beta\ndescription: bad name');

    expect(() => bundle()).to.throw('Skill name must be');
    expect(readFileSync(join(destination, 'index.json'), 'utf8')).to.include('"demo/alpha"');
  });
});
