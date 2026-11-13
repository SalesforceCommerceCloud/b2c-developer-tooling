/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';
import {writeSkillIndexes} from './indexes.js';

const SMOKE_TIMEOUT_MS = 120_000;
const DISCOVERY_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 250;
const SHUTDOWN_TIMEOUT_MS = 5000;
// V2 registers configured skills together after loading every source
const READY_SKILL = 'catalog-smoke-ready';
const PASSWORD = 'catalog-smoke-fixture';

interface Skill {
  id: string;
  path: string;
}

test(
  'OpenCode 2 preserves release pins and references across source changes, rollback, and a missing release',
  {
    skip: !process.env.OPENCODE_V2_BINARY,
    timeout: SMOKE_TIMEOUT_MS,
  },
  async (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-catalog-v2-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const site = path.join(root, 'site');
    const releaseA = path.join(site, 'release-a/skills');
    const releaseB = path.join(site, 'release-b/skills');
    fs.cpSync(path.resolve(import.meta.dirname, '../../../skills'), releaseA, {recursive: true});
    const index = JSON.parse(fs.readFileSync(path.join(releaseA, 'b2c/skills/index.json'), 'utf8'));
    const selected = index.skills.find((entry: {files: string[]}) =>
      entry.files.some((file) => file.startsWith('references/') && file.endsWith('.md')),
    );
    assert.ok(selected, 'The real collection must contain a reference file');
    const reference = selected.files.find((file: string) => file.startsWith('references/') && file.endsWith('.md'));
    const relativeReference = path.join('b2c/skills', selected.name, reference);
    const bytesA = fs.readFileSync(path.join(releaseA, relativeReference));
    fs.cpSync(releaseA, releaseB, {recursive: true});
    fs.appendFileSync(path.join(releaseB, relativeReference), '\nRelease B reference marker\n');
    writeSkillIndexes(releaseB);
    const health = path.join(site, 'health');
    fs.mkdirSync(path.join(health, READY_SKILL), {recursive: true});
    fs.writeFileSync(
      path.join(health, 'index.json'),
      JSON.stringify({skills: [{name: READY_SKILL, version: '1', files: ['SKILL.md']}]}),
    );
    fs.writeFileSync(
      path.join(health, READY_SKILL, 'SKILL.md'),
      `---\nname: ${READY_SKILL}\ndescription: Discovery readiness marker\n---\nReady\n`,
    );
    const requests = new Set<string>();
    const server = createServer((request, response) => {
      const pathname = new URL(request.url || '/', 'http://localhost').pathname;
      requests.add(pathname);
      const file = path.resolve(site, '.' + pathname);
      if (!file.startsWith(site + path.sep)) {
        response.writeHead(404).end();
        return;
      }
      try {
        const content = fs.readFileSync(file);
        response.writeHead(200, {'content-length': content.length}).end(content);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const config = path.join(root, 'config/opencode');
    fs.mkdirSync(config, {recursive: true});
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('OPENCODE_')));
    for (const [key, directory] of Object.entries({
      HOME: '',
      XDG_CONFIG_HOME: 'config',
      XDG_CACHE_HOME: 'cache',
      XDG_DATA_HOME: 'data',
      XDG_STATE_HOME: 'state',
    }))
      env[key] = path.join(root, directory);
    env.OPENCODE_PASSWORD = PASSWORD;
    const authorization = 'Basic ' + Buffer.from(`opencode:${PASSWORD}`).toString('base64');

    async function discover(release: string, missing = false): Promise<Skill[]> {
      const project = path.join(root, release);
      fs.mkdirSync(project, {recursive: true});
      fs.writeFileSync(
        path.join(config, 'opencode.json'),
        JSON.stringify({skills: [`${base}/health/`, `${base}/${release}/skills/b2c/skills/`]}),
      );
      const portServer = createServer();
      await new Promise<void>((resolve) => portServer.listen(0, '127.0.0.1', resolve));
      const port = (portServer.address() as AddressInfo).port;
      await new Promise<void>((resolve) => portServer.close(() => resolve()));
      const log = fs.openSync(path.join(root, 'server.log'), 'w');
      const child = spawn(
        process.env.OPENCODE_V2_BINARY!,
        ['serve', '--hostname', '127.0.0.1', '--port', String(port)],
        {cwd: project, env, stdio: ['ignore', log, log]},
      );
      const exited = once(child, 'exit');
      try {
        const deadline = Date.now() + DISCOVERY_TIMEOUT_MS;
        while (Date.now() < deadline) {
          assert.equal(child.exitCode, null, 'OpenCode server exited before discovery');
          try {
            const response = await fetch(`http://127.0.0.1:${port}/api/skill`, {
              headers: {Authorization: authorization},
              signal: AbortSignal.timeout(2000),
            });
            if (response.ok) {
              const {data} = (await response.json()) as {data: Skill[]};
              const expected = missing
                ? [READY_SKILL]
                : [READY_SKILL, ...index.skills.map((entry: {name: string}) => entry.name)];
              if (expected.every((name) => data.some((entry) => entry.id === name))) return data;
            }
          } catch (error) {
            if (child.exitCode !== null) throw error;
          }
          await delay(POLL_INTERVAL_MS);
        }
        throw new Error('OpenCode 2 skill discovery timed out');
      } finally {
        child.kill();
        const timer = setTimeout(() => child.kill('SIGKILL'), SHUTDOWN_TIMEOUT_MS);
        try {
          await exited;
        } finally {
          clearTimeout(timer);
          fs.closeSync(log);
        }
      }
    }

    const first = (await discover('release-a')).find((entry) => entry.id === selected.name);
    assert.ok(first);
    const cachedA = path.join(path.dirname(first.path), reference);
    assert.deepEqual(fs.readFileSync(cachedA), bytesA);
    const second = (await discover('release-b')).find((entry) => entry.id === selected.name);
    assert.ok(second);
    assert.notEqual(second.path, first.path);
    const cachedB = path.join(path.dirname(second.path), reference);
    assert.match(fs.readFileSync(cachedB, 'utf8'), /Release B reference marker/);
    assert.deepEqual(fs.readFileSync(cachedA), bytesA);
    const rollback = (await discover('release-a')).find((entry) => entry.id === selected.name);
    assert.equal(rollback?.path, first.path);
    assert.deepEqual(fs.readFileSync(cachedA), bytesA);
    assert.match(fs.readFileSync(cachedB, 'utf8'), /Release B reference marker/);
    const absent = await discover('missing-release', true);
    assert.ok(requests.has('/missing-release/skills/b2c/skills/index.json'));
    assert.ok(!absent.some((entry) => entry.id === selected.name));
  },
);
