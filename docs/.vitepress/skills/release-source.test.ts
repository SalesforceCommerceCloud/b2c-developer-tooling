/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test, type TestContext} from 'node:test';

function workflowScript(file: string, step: string): string {
  const workflow = fs.readFileSync(new URL(`../../../.github/workflows/${file}`, import.meta.url), 'utf8');
  const match = workflow.match(
    new RegExp(`      - name: ${step}\\n(?:        [^\\n]*\\n)*?        run: \\|\\n((?:          .*\\n|\\n)+)`),
  );
  assert.ok(match, `Missing workflow step: ${step}`);
  return match[1]
    .split('\n')
    .map((line) => line.slice(10))
    .join('\n');
}

function fixture(t: TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-catalog-release-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const repository = path.join(root, 'repo');
  fs.mkdirSync(repository);
  const git = (...args: string[]) => execFileSync('git', args, {cwd: repository, stdio: 'pipe'}).toString().trim();
  git('init', '-b', 'main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.com');
  git('config', 'commit.gpgSign', 'false');
  git('config', 'core.hooksPath', path.join(root, 'no-hooks'));
  fs.mkdirSync(path.join(repository, 'skills'));
  function commit(version: string, payload = version) {
    fs.writeFileSync(path.join(repository, 'skills/package.json'), JSON.stringify({version}));
    fs.writeFileSync(path.join(repository, 'skills/payload.txt'), payload);
    fs.writeFileSync(path.join(repository, 'skills/CHANGELOG.md'), `## ${version}\n\nSkills fixture\n`);
    const files = ['skills/package.json', 'skills/payload.txt', 'skills/CHANGELOG.md'];
    git('add', '--', ...files);
    git('commit', '-m', 'Update skills fixture', '--', ...files);
  }
  const script = workflowScript('deploy-docs.yml', 'Prepare released OpenCode skills');
  const environmentFile = path.join(root, 'environment');
  const env = {...process.env, GITHUB_ENV: environmentFile, RUNNER_TEMP: root};
  const run = () => execFileSync('bash', ['-e', '-o', 'pipefail', '-c', script], {cwd: repository, env, stdio: 'pipe'});
  return {root, repository, git, commit, run, environmentFile};
}

test('production exports the highest stable reachable skills release independently of docs and prereleases', (t) => {
  const f = fixture(t);
  f.commit('1.9.0');
  f.git('tag', 'b2c-agent-plugins@1.9.0');
  f.commit('1.10.0');
  f.git('tag', 'b2c-agent-plugins@1.10.0');
  f.git('checkout', '-b', 'other-release');
  f.commit('99.0.0');
  f.git('tag', 'b2c-agent-plugins@99.0.0');
  f.git('checkout', 'main');
  f.commit('2.0.0-beta.1');
  f.git('tag', 'b2c-agent-plugins@2.0.0-beta.1');
  f.commit('2.0.0');
  f.git('tag', 'docs@9.0.0');
  f.git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  f.run();
  const declaration = fs.readFileSync(f.environmentFile, 'utf8').trim();
  assert.match(declaration, /^OPENCODE_SKILLS_SOURCE=/);
  const source = declaration.slice('OPENCODE_SKILLS_SOURCE='.length);
  assert.equal(JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8')).version, '1.10.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.repository, 'skills/package.json'), 'utf8')).version, '2.0.0');
});

function publisherFixture(t: TestContext) {
  const f = fixture(t);
  f.commit('1.0.0');
  f.git('tag', 'b2c-agent-plugins@1.0.0');
  f.git('checkout', '-b', 'release/1.0');
  f.commit('1.0.1', 'Packaged hotfix');
  const build = f.git('rev-parse', 'HEAD');
  f.git('checkout', 'main');
  f.commit('1.0.1', 'Unreleased main edits');
  const main = f.git('rev-parse', 'HEAD');
  const remote = path.join(f.root, 'remote.git');
  execFileSync('git', ['clone', '--bare', f.repository, remote], {stdio: 'pipe'});
  f.git('remote', 'add', 'origin', remote);
  f.git('fetch', 'origin');
  f.git('checkout', 'release/1.0');
  const remoteGit = (...args: string[]) =>
    execFileSync('git', ['--git-dir', remote, ...args], {stdio: 'pipe'})
      .toString()
      .trim();
  const binaryDirectory = path.join(f.root, 'bin');
  const log = path.join(f.root, 'gh.jsonl');
  const marker = path.join(f.root, 'release-created');
  fs.mkdirSync(binaryDirectory);
  fs.writeFileSync(
    path.join(binaryDirectory, 'gh'),
    `#!${process.execPath}
const fs = require('node:fs');
const {execFileSync, spawnSync} = require('node:child_process');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GH_FIXTURE_LOG, JSON.stringify(args) + '\\n');
const git = (...values) => execFileSync('git', ['--git-dir', process.env.GH_FIXTURE_REMOTE, ...values], {stdio: 'pipe'}).toString().trim();
if (args[0] !== 'release') process.exit(2);
if (args[1] === 'view') process.exit(fs.existsSync(process.env.GH_FIXTURE_MARKER) ? 0 : 1);
if (args[1] === 'create') {
  const tag = 'refs/tags/' + args[2];
  if (process.env.GH_FIXTURE_TAG_RACE) git('update-ref', tag, process.env.GH_FIXTURE_TAG_RACE);
  const exists = spawnSync('git', ['--git-dir', process.env.GH_FIXTURE_REMOTE, 'rev-parse', '--verify', tag], {stdio: 'pipe'}).status === 0;
  if (!exists) {
    // Match gh's documented default when no explicit target is supplied
    const index = args.indexOf('--target');
    const target = index === -1 ? 'refs/heads/main' : args[index + 1];
    git('update-ref', tag, git('rev-parse', target + '^{commit}'));
  }
  fs.writeFileSync(process.env.GH_FIXTURE_MARKER, 'created');
  process.exit(0);
}
if (args[1] === 'upload' && fs.existsSync(process.env.GH_FIXTURE_MARKER)) process.exit(0);
process.exit(2);
`,
    {mode: 0o755},
  );
  const script = workflowScript('publish.yml', 'Upload skills to release')
    .replace('${{ steps.package-skills.outputs.zips }}', 'b2c-skills.zip')
    .replaceAll('/tmp/plugins-release-notes.md', '"$GH_FIXTURE_NOTES"');
  const publish = (extraEnvironment: NodeJS.ProcessEnv = {}) =>
    execFileSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      cwd: f.repository,
      env: {
        ...process.env,
        PATH: binaryDirectory + path.delimiter + process.env.PATH,
        PLUGINS_VERSION: '1.0.1',
        GH_FIXTURE_REMOTE: remote,
        GH_FIXTURE_LOG: log,
        GH_FIXTURE_MARKER: marker,
        GH_FIXTURE_NOTES: path.join(f.root, 'release-notes.md'),
        ...extraEnvironment,
      },
      stdio: 'pipe',
    });
  const calls = () =>
    fs.existsSync(log)
      ? fs
          .readFileSync(log, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as string[])
      : [];
  return {...f, build, main, remoteGit, publish, calls, marker};
}

test('skills publishing tags the packaged hotfix commit even when main contains newer edits', (t) => {
  const f = publisherFixture(t);
  f.publish();
  assert.equal(f.remoteGit('rev-parse', 'refs/tags/b2c-agent-plugins@1.0.1^{commit}'), f.build);
  assert.equal(f.remoteGit('show', 'b2c-agent-plugins@1.0.1:skills/payload.txt'), 'Packaged hotfix');
  assert.equal(f.git('rev-parse', 'HEAD'), f.build);
  assert.ok(f.calls().some((args) => args[1] === 'upload'));
  f.git('merge', '--no-edit', '-s', 'ours', 'main');
  f.git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  f.git('fetch', '--no-tags', 'origin', 'refs/tags/b2c-agent-plugins@1.0.1:refs/tags/b2c-agent-plugins@1.0.1');
  f.run();
  const source = fs.readFileSync(f.environmentFile, 'utf8').trim().slice('OPENCODE_SKILLS_SOURCE='.length);
  assert.equal(fs.readFileSync(path.join(source, 'payload.txt'), 'utf8'), 'Packaged hotfix');
});

test('skills publishing reuses matching lightweight and annotated tags without moving them', (t) => {
  for (const annotated of [false, true]) {
    const f = publisherFixture(t);
    if (annotated) f.git('tag', '-a', 'fixture-release', '-m', 'Release fixture', f.build);
    const object = annotated ? f.git('rev-parse', 'refs/tags/fixture-release') : f.build;
    if (annotated) f.remoteGit('fetch', f.repository, 'refs/tags/fixture-release');
    f.remoteGit('update-ref', 'refs/tags/b2c-agent-plugins@1.0.1', object);
    fs.writeFileSync(f.marker, 'existing');
    f.publish();
    assert.equal(f.remoteGit('rev-parse', 'refs/tags/b2c-agent-plugins@1.0.1'), object);
    assert.ok(!f.calls().some((args) => args[1] === 'create'));
    assert.ok(f.calls().some((args) => args[1] === 'upload'));
  }
});

test('skills publishing refuses a mismatched tag before creating or uploading a release', (t) => {
  for (const existingRelease of [false, true]) {
    const f = publisherFixture(t);
    f.remoteGit('update-ref', 'refs/tags/b2c-agent-plugins@1.0.1', f.main);
    if (existingRelease) fs.writeFileSync(f.marker, 'existing');
    assert.throws(f.publish, /points to.*expected|does not match/i);
    assert.ok(!f.calls().some((args) => ['create', 'upload'].includes(args[1])));
    assert.equal(f.remoteGit('rev-parse', 'refs/tags/b2c-agent-plugins@1.0.1'), f.main);
  }
});

test('skills publishing rejects a mismatched tag created during release creation before upload', (t) => {
  const f = publisherFixture(t);
  assert.throws(() => f.publish({GH_FIXTURE_TAG_RACE: f.main}), /points to.*expected/i);
  assert.ok(f.calls().some((args) => args[1] === 'create'));
  assert.ok(!f.calls().some((args) => args[1] === 'upload'));
});

test('skills publishing stops before release operations when the remote cannot be read', (t) => {
  const f = publisherFixture(t);
  f.git('remote', 'set-url', 'origin', path.join(f.root, 'missing.git'));
  assert.throws(f.publish, /does not appear to be a git repository|Could not read from remote/i);
  assert.deepEqual(f.calls(), []);
});

test('production refuses to substitute unreleased checkout content when no stable skills tag exists', (t) => {
  const f = fixture(t);
  f.commit('1.0.0');
  f.git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  assert.throws(f.run, /No stable agent skills tag/);
  assert.ok(!fs.existsSync(f.environmentFile));
});
