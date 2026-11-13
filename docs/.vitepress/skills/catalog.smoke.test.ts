/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {generateSkillCatalogs} from './catalog.js';

const SMOKE_TIMEOUT_MS = 120_000;
const DISCOVERY_TIMEOUT_MS = 45_000;
const MAX_ERROR_CHARACTERS = 4000;

test(
  'OpenCode discovers generated collections and refreshes a reference-only update without a plugin',
  {
    skip: process.env.OPENCODE_CATALOG_SMOKE !== '1',
    timeout: SMOKE_TIMEOUT_MS,
  },
  async (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b2c-catalog-smoke-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const source = path.join(root, 'source');
    fs.cpSync(path.resolve(import.meta.dirname, '../../../skills'), source, {recursive: true});
    const output = path.join(root, 'site/opencode');
    generateSkillCatalogs(source, output);
    const index = JSON.parse(fs.readFileSync(path.join(output, 'b2c/index.json'), 'utf8'));
    const selected = index.skills.find((entry: {files: string[]}) =>
      entry.files.some((file) => file.startsWith('references/') && file.endsWith('.md')),
    );
    assert.ok(selected, 'A published B2C skill must exercise supporting-file delivery');
    const reference = selected.files.find((file: string) => file.startsWith('references/') && file.endsWith('.md'));

    const server = createServer((request, response) => {
      const relative = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
      const file = path.resolve(root, 'site', '.' + relative);
      if (!file.startsWith(path.join(root, 'site') + path.sep)) {
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
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/opencode`;
    const config = path.join(root, 'config/opencode');
    const project = path.join(root, 'project');
    fs.mkdirSync(config, {recursive: true});
    fs.mkdirSync(project);
    fs.writeFileSync(
      path.join(config, 'opencode.json'),
      JSON.stringify({skills: {urls: [`${base}/b2c/`, `${base}/b2c-cli/`]}}),
    );
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      XDG_CONFIG_HOME: path.join(root, 'config'),
      XDG_CACHE_HOME: path.join(root, 'cache'),
      XDG_DATA_HOME: path.join(root, 'data'),
      XDG_STATE_HOME: path.join(root, 'state'),
      OPENCODE_CONFIG_DIR: config,
      OPENCODE_DISABLE_PROJECT_CONFIG: '1',
      OPENCODE_DISABLE_CLAUDE_CODE: '1',
      OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
      OPENCODE_DISABLE_DEFAULT_PLUGINS: '1',
      OPENCODE_DISABLE_MODELS_FETCH: '1',
    };
    for (const key of ['OPENCODE_CONFIG', 'OPENCODE_CONFIG_CONTENT', 'OPENCODE_PID', 'OPENCODE_SESSION_ID'])
      delete env[key];
    const binary = process.env.OPENCODE_BINARY || 'opencode';
    async function discover() {
      const capture = path.join(root, 'discovered.json');
      const descriptor = fs.openSync(capture, 'w');
      try {
        await new Promise<void>((resolve, reject) => {
          const child = spawn(binary, ['debug', 'skill'], {cwd: project, env, stdio: ['ignore', descriptor, 'pipe']});
          let errors = '';
          child.stderr?.on('data', (chunk) => {
            errors = (errors + chunk.toString()).slice(-MAX_ERROR_CHARACTERS);
          });
          const timer = setTimeout(() => child.kill(), DISCOVERY_TIMEOUT_MS);
          child.on('error', (error) => {
            clearTimeout(timer);
            reject(error);
          });
          child.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) resolve();
            else reject(new Error(`OpenCode discovery failed (${code}): ${errors}`));
          });
        });
      } finally {
        fs.closeSync(descriptor);
      }
      return JSON.parse(fs.readFileSync(capture, 'utf8')) as {name: string; location: string}[];
    }
    const first = await discover();
    const cliIndex = JSON.parse(fs.readFileSync(path.join(output, 'b2c-cli/index.json'), 'utf8'));
    assert.deepEqual(
      first
        .filter((entry) => entry.name.startsWith('b2c-'))
        .map((entry) => entry.name)
        .sort(),
      [...index.skills, ...cliIndex.skills].map((entry) => entry.name).sort(),
    );
    const skill = first.find((entry) => entry.name === selected.name);
    assert.ok(skill);
    const cachedReference = path.join(path.dirname(skill.location), reference);
    assert.deepEqual(
      fs.readFileSync(cachedReference),
      fs.readFileSync(path.join(source, 'b2c/skills', selected.name, reference)),
    );
    fs.appendFileSync(
      path.join(source, 'b2c/skills', selected.name, reference),
      '\nCatalog reference update smoke marker\n',
    );
    generateSkillCatalogs(source, output);
    await discover();
    assert.match(fs.readFileSync(cachedReference, 'utf8'), /Catalog reference update smoke marker/);
  },
);
