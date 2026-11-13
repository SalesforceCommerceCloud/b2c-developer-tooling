/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test, type TestContext} from 'node:test';
import {generateSkillCatalogs} from './catalog.js';
import {writeSkillIndexes} from './indexes.js';

function fixture(t: TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-catalog-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const source = path.join(root, 'skills');
  const output = path.join(root, 'out/opencode');
  function write(file: string, content: string | Buffer) {
    const destination = path.join(source, file);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, content);
  }
  write('package.json', JSON.stringify({version: '1.2.3'}));
  write('plugins.json', JSON.stringify({plugins: [{name: 'b2c'}, {name: 'b2c-ops'}]}));
  for (const [collection, name] of [
    ['b2c', 'b2c-example'],
    ['b2c-ops', 'b2c-incident'],
  ]) {
    write(
      `${collection}/skills/${name}/SKILL.md`,
      `---\nname: ${name}\ndescription: Example guidance\n---\nRead references/example.md\n`,
    );
    write(`${collection}/skills/${name}/references/example.md`, 'Reference bytes\r\n');
  }
  const index = (collection = 'b2c') =>
    JSON.parse(fs.readFileSync(path.join(output, collection, 'index.json'), 'utf8'));
  return {source, output, write, index};
}

test('publishes every registered collection with complete byte-preserved skill assets', (t) => {
  const f = fixture(t);
  const image = Buffer.from([0, 255, 12, 34]);
  f.write('b2c/skills/b2c-example/assets/example.png', image);
  f.write('b2c/skills/b2c-example/evals/private.json', '{}');
  generateSkillCatalogs(f.source, f.output);
  assert.ok(fs.existsSync(path.join(f.output, 'b2c/index.json')), 'Expected a native catalog');
  assert.deepEqual(fs.readdirSync(f.output).sort(), ['b2c', 'b2c-ops']);
  const [entry] = f.index().skills;
  assert.equal(entry.name, 'b2c-example');
  assert.match(entry.version, /^1\.2\.3-[a-f0-9]{64}$/);
  assert.deepEqual(entry.files, ['SKILL.md', 'assets/example.png', 'references/example.md']);
  assert.deepEqual(fs.readFileSync(path.join(f.output, 'b2c/b2c-example/assets/example.png')), image);
  assert.equal(
    fs.readFileSync(path.join(f.output, 'b2c/b2c-example/references/example.md'), 'utf8'),
    'Reference bytes\r\n',
  );
  assert.equal(f.index('b2c-ops').skills[0].name, 'b2c-incident');
  assert.ok(fs.existsSync(path.join(f.source, 'b2c/skills/b2c-example/evals/private.json')));
});

test('keeps versions deterministic and refreshes them for reference-only edits and removals', (t) => {
  const f = fixture(t);
  generateSkillCatalogs(f.source, f.output);
  const first = fs.readFileSync(path.join(f.output, 'b2c/index.json'), 'utf8');
  const version = f.index().skills[0].version;
  generateSkillCatalogs(f.source, f.output);
  assert.equal(fs.readFileSync(path.join(f.output, 'b2c/index.json'), 'utf8'), first);
  f.write('b2c/skills/b2c-example/references/example.md', 'Changed reference');
  generateSkillCatalogs(f.source, f.output);
  const changed = f.index().skills[0].version;
  assert.notEqual(changed, version);
  fs.unlinkSync(path.join(f.source, 'b2c/skills/b2c-example/references/example.md'));
  generateSkillCatalogs(f.source, f.output);
  assert.notEqual(f.index().skills[0].version, changed);
  assert.deepEqual(f.index().skills[0].files, ['SKILL.md']);
  assert.ok(!fs.existsSync(path.join(f.output, 'b2c/b2c-example/references/example.md')));
});

test('removes retired collections and sorts skill entries independently of directory creation order', (t) => {
  const f = fixture(t);
  f.write('b2c/skills/b2c-alpha/SKILL.md', '---\nname: b2c-alpha\ndescription: Alpha\n---\nAlpha');
  generateSkillCatalogs(f.source, f.output);
  assert.deepEqual(
    f.index().skills.map((entry: {name: string}) => entry.name),
    ['b2c-alpha', 'b2c-example'],
  );
  f.write('plugins.json', JSON.stringify({plugins: [{name: 'b2c'}]}));
  generateSkillCatalogs(f.source, f.output);
  assert.ok(!fs.existsSync(path.join(f.output, 'b2c-ops')));
});

test('rejects invalid or duplicate registry names without replacing published output', (t) => {
  const f = fixture(t);
  generateSkillCatalogs(f.source, f.output);
  const before = fs.readFileSync(path.join(f.output, 'b2c/index.json'), 'utf8');
  for (const plugins of [[{name: '../escape'}], [{name: 'b2c'}, {name: 'b2c'}], []]) {
    f.write('plugins.json', JSON.stringify({plugins}));
    assert.throws(() => generateSkillCatalogs(f.source, f.output), /Invalid|Duplicate|empty/i);
    assert.equal(fs.readFileSync(path.join(f.output, 'b2c/index.json'), 'utf8'), before);
  }
});

test('rejects missing collections and malformed skill metadata', (t) => {
  const f = fixture(t);
  f.write('plugins.json', JSON.stringify({plugins: [{name: 'missing'}]}));
  assert.throws(() => generateSkillCatalogs(f.source, f.output), /missing/i);
  f.write('plugins.json', JSON.stringify({plugins: [{name: 'b2c'}]}));
  for (const content of [
    'No frontmatter',
    '---\nname: other\ndescription: Wrong name\n---',
    '---\nname: b2c-example\ndescription: false\n---',
  ]) {
    f.write('b2c/skills/b2c-example/SKILL.md', content);
    assert.throws(() => generateSkillCatalogs(f.source, f.output), /Invalid.*metadata/i);
  }
});

test('rejects symlinks and URL-ambiguous supporting paths', (t) => {
  const f = fixture(t);
  const link = path.join(f.source, 'b2c/skills/b2c-example/leak');
  fs.symlinkSync(path.join(f.source, 'package.json'), link);
  assert.throws(() => generateSkillCatalogs(f.source, f.output), /symbolic link/i);
  fs.unlinkSync(link);
  for (const file of ['fragment#name.md', 'reference.md ', ' reference.md']) {
    f.write(`b2c/skills/b2c-example/${file}`, 'Bad URL');
    assert.throws(() => generateSkillCatalogs(f.source, f.output), /Unsafe.*path/i);
    fs.unlinkSync(path.join(f.source, 'b2c/skills/b2c-example', file));
  }
  f.write('b2c/skills/b2c-example/references /example.md', 'Bad directory');
  assert.throws(() => generateSkillCatalogs(f.source, f.output), /Unsafe.*path/i);
});

test('writes native indexes beside source skills without changing instructions or references', (t) => {
  const f = fixture(t);
  const instructions = fs.readFileSync(path.join(f.source, 'b2c/skills/b2c-example/SKILL.md'));
  const reference = fs.readFileSync(path.join(f.source, 'b2c/skills/b2c-example/references/example.md'));
  writeSkillIndexes(f.source);
  const indexFile = path.join(f.source, 'b2c/skills/index.json');
  const first = fs.readFileSync(indexFile);
  const index = JSON.parse(first.toString());
  assert.equal(index.skills[0].name, 'b2c-example');
  assert.deepEqual(index.skills[0].files, ['SKILL.md', 'references/example.md']);
  writeSkillIndexes(f.source, true);
  writeSkillIndexes(f.source);
  assert.deepEqual(fs.readFileSync(indexFile), first);
  assert.deepEqual(fs.readFileSync(path.join(f.source, 'b2c/skills/b2c-example/SKILL.md')), instructions);
  assert.deepEqual(fs.readFileSync(path.join(f.source, 'b2c/skills/b2c-example/references/example.md')), reference);
  generateSkillCatalogs(f.source, f.output);
  assert.deepEqual(fs.readFileSync(path.join(f.output, 'b2c/index.json')), first);
});

test('check mode rejects missing, reference-stale, and version-stale indexes without writing', (t) => {
  const f = fixture(t);
  const indexFile = path.join(f.source, 'b2c/skills/index.json');
  assert.throws(() => writeSkillIndexes(f.source, true), /stale.*index|index.*stale/i);
  assert.ok(!fs.existsSync(indexFile));
  writeSkillIndexes(f.source);
  const first = fs.readFileSync(indexFile);
  f.write('b2c/skills/b2c-example/references/example.md', 'Changed reference');
  assert.throws(() => writeSkillIndexes(f.source, true), /stale/i);
  assert.deepEqual(fs.readFileSync(indexFile), first);
  writeSkillIndexes(f.source);
  assert.notDeepEqual(fs.readFileSync(indexFile), first);
  const second = fs.readFileSync(indexFile);
  f.write('package.json', JSON.stringify({version: '1.2.4'}));
  assert.throws(() => writeSkillIndexes(f.source, true), /stale/i);
  assert.deepEqual(fs.readFileSync(indexFile), second);
  writeSkillIndexes(f.source);
  assert.match(JSON.parse(fs.readFileSync(indexFile, 'utf8')).skills[0].version, /^1\.2\.4-/);
  writeSkillIndexes(f.source, true);
});

test('validates all collections and rejects linked indexes before changing any source index', (t) => {
  const f = fixture(t);
  writeSkillIndexes(f.source);
  const first = fs.readFileSync(path.join(f.source, 'b2c/skills/index.json'));
  f.write('b2c/skills/b2c-example/references/example.md', 'Changed reference');
  const indexFile = path.join(f.source, 'b2c-ops/skills/index.json');
  fs.unlinkSync(indexFile);
  fs.symlinkSync(path.join(f.source, 'package.json'), indexFile);
  for (const check of [false, true]) assert.throws(() => writeSkillIndexes(f.source, check), /symbolic link/i);
  assert.deepEqual(fs.readFileSync(path.join(f.source, 'b2c/skills/index.json')), first);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.source, 'package.json'), 'utf8')).version, '1.2.3');
});

test('retains release A indexes and supporting files after publishing B and rebuilding docs', (t) => {
  const f = fixture(t);
  const git = (...args: string[]) => execFileSync('git', args, {cwd: f.source, stdio: 'pipe'});
  git('init', '-b', 'main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'commit.gpgSign', 'false');
  git('config', 'core.hooksPath', path.join(f.source, 'no-hooks'));
  writeSkillIndexes(f.source);
  const files = [
    'package.json',
    'plugins.json',
    'b2c/skills/index.json',
    'b2c/skills/b2c-example/SKILL.md',
    'b2c/skills/b2c-example/references/example.md',
    'b2c-ops/skills/index.json',
    'b2c-ops/skills/b2c-incident/SKILL.md',
    'b2c-ops/skills/b2c-incident/references/example.md',
  ];
  git('add', '--', ...files);
  git('commit', '-m', 'Create release A', '--', ...files);
  const releaseA = git('rev-parse', 'HEAD').toString().trim();
  git('tag', 'b2c-agent-plugins@1.2.3');
  const indexA = fs.readFileSync(path.join(f.source, 'b2c/skills/index.json'));
  f.write('package.json', JSON.stringify({version: '1.2.4'}));
  f.write('b2c/skills/b2c-example/references/example.md', 'Release B reference\n');
  writeSkillIndexes(f.source);
  git('add', '--', ...files);
  git('commit', '-m', 'Create release B', '--', ...files);
  git('tag', 'b2c-agent-plugins@1.2.4');
  for (const build of ['stable', 'dev', 'preview']) generateSkillCatalogs(f.source, path.join(f.output, build));
  for (const ref of [releaseA, 'b2c-agent-plugins@1.2.3']) {
    assert.deepEqual(git('show', `${ref}:b2c/skills/index.json`), indexA);
    assert.equal(git('show', `${ref}:b2c/skills/b2c-example/references/example.md`).toString(), 'Reference bytes\r\n');
  }
  assert.notDeepEqual(fs.readFileSync(path.join(f.source, 'b2c/skills/index.json')), indexA);
  assert.equal(git('status', '--porcelain').toString(), '');
});

test('index command supports generation, read-only checks, help, and usage failures', (t) => {
  const f = fixture(t);
  const command = path.join(import.meta.dirname, 'indexes.ts');
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ['--import', 'tsx', command, ...args], {encoding: 'utf8'});
  for (const flag of ['-h', '--help']) {
    const result = run(flag);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
    assert.equal(result.stderr, '');
  }
  assert.equal(run('-cs', f.source).status, 1);
  assert.equal(run(`--source=${f.source}`).status, 0);
  assert.equal(run('-cs' + f.source, '--').status, 0);
  assert.equal(run('--check', '--source', f.source).status, 0);
  for (const args of [['--unknown'], ['--source'], ['--source='], ['--', '--check']]) {
    const result = run(...args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim());
  }
});
