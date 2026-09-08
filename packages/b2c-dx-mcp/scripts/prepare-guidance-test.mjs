/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/* eslint-disable no-await-in-loop -- Read continuation and sequential latency samples require ordered calls. */
import {execFileSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(packageRoot, '../..');
const testRoot = mkdtempSync(join(tmpdir(), 'b2c-mcp-guidance-'));
const artifacts = join(testRoot, 'artifacts');
const workspace = join(testRoot, 'workspace');
const codexHome = join(testRoot, 'codex-home');
for (const directory of [artifacts, workspace, codexHome]) mkdirSync(directory, {mode: 0o700});

function pnpm(args, cwd = repoRoot) {
  if (!process.env.npm_execpath) throw new Error('Run this script with pnpm run prepare:guidance-test.');
  process.stdout.write(`Running pnpm ${args.join(' ')}\n`);
  try {
    execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
      cwd,
      stdio: 'pipe',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    process.stderr.write(error.stdout ?? '');
    process.stderr.write(error.stderr ?? '');
    throw error;
  }
}

pnpm(['--filter', '@salesforce/b2c-tooling-sdk', 'run', 'build:esm']);
pnpm(['--filter', '@salesforce/b2c-dx-mcp', 'run', 'build']);
const bundleManifest = readFileSync(join(packageRoot, 'content/guidance/index.json'));
pnpm(['--filter', '@salesforce/b2c-tooling-sdk', 'pack', '--pack-destination', artifacts]);
pnpm(['--filter', '@salesforce/b2c-dx-mcp', 'pack', '--pack-destination', artifacts]);
assert.deepEqual(
  readFileSync(join(packageRoot, 'content/guidance/index.json')),
  bundleManifest,
  'Build and prepack must generate identical manifests',
);

const archives = readdirSync(artifacts);
const sdkArchive = join(
  artifacts,
  archives.find((file) => file.startsWith('salesforce-b2c-tooling-sdk-')),
);
const mcpArchive = join(
  artifacts,
  archives.find((file) => file.startsWith('salesforce-b2c-dx-mcp-')),
);
writeFileSync(
  join(testRoot, 'package.json'),
  `${JSON.stringify(
    {
      name: 'b2c-guidance-isolated-test',
      private: true,
      type: 'module',
      dependencies: {
        '@salesforce/b2c-dx-mcp': `file:${mcpArchive}`,
        '@salesforce/b2c-tooling-sdk': `file:${sdkArchive}`,
      },
      pnpm: {overrides: {'@salesforce/b2c-tooling-sdk': `file:${sdkArchive}`}},
    },
    null,
    2,
  )}\n`,
);
pnpm(['install', '--prefer-offline', '--ignore-scripts'], testRoot);

const installedMcp = join(testRoot, 'node_modules/@salesforce/b2c-dx-mcp');
const runJs = join(installedMcp, 'bin/run.js');
const manifest = JSON.parse(readFileSync(join(installedMcp, 'content/guidance/index.json'), 'utf8'));
assert.deepEqual(manifest, JSON.parse(bundleManifest));
for (const entry of manifest.entries) {
  for (const file of entry.files) {
    const bytes = readFileSync(join(installedMcp, 'content/guidance', entry.id, file.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.hash);
    assert.deepEqual(bytes, readFileSync(join(repoRoot, dirname(entry.source), file.path)));
  }
}

// The smoke test fails on any TCP connection; no credentials are needed or copied.
const offlineModule = join(testRoot, 'offline.cjs');
writeFileSync(
  offlineModule,
  "require('node:net').Socket.prototype.connect = function () { throw new Error('Network disabled for guidance smoke test'); };\n",
);
const env = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^(SFCC_|MRT_|DW_|NODE_OPTIONS$|CODEX_HOME$)/.test(key)),
);
const proc = spawn(process.execPath, ['--require', offlineModule, runJs, '--project-directory', workspace], {
  cwd: workspace,
  env: {...env, SFCC_DISABLE_TELEMETRY: 'true'},
  stdio: ['pipe', 'pipe', 'pipe'],
});
let stderr = '';
proc.stderr.on('data', (chunk) => {
  stderr += chunk;
});
const pending = new Map();
let requestId = 0;
const lines = createInterface({input: proc.stdout});
lines.on('line', (line) => {
  const response = JSON.parse(line);
  const waiter = pending.get(response.id);
  if (!waiter) return;
  pending.delete(response.id);
  if (response.error) waiter.reject(new Error(JSON.stringify(response.error)));
  else waiter.resolve(response.result);
});
proc.on('error', (error) => {
  for (const waiter of pending.values()) waiter.reject(error);
});
proc.on('exit', (code) => {
  for (const waiter of pending.values()) waiter.reject(new Error(`MCP exited (${code}): ${stderr}`));
});
async function request(method, params = {}) {
  const id = ++requestId;
  let timer;
  try {
    return await new Promise((resolveRequest, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout: ${method}. ${stderr}`)), 20_000);
      pending.set(id, {resolve: resolveRequest, reject});
      proc.stdin.write(`${JSON.stringify({jsonrpc: '2.0', id, method, params})}\n`);
    });
  } finally {
    clearTimeout(timer);
    pending.delete(id);
  }
}
async function guidance(args) {
  const response = await request('tools/call', {name: 'skills_read', arguments: args});
  assert.notEqual(response.isError, true, JSON.stringify(response));
  assert.deepEqual(JSON.parse(response.content[0].text), response.structuredContent);
  return response.structuredContent.result;
}

let metrics;
try {
  const initialized = await request('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: {name: 'offline-package-test', version: '1'},
  });
  proc.stdin.write(`${JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'})}\n`);
  const catalog = await request('tools/list');
  const guideTool = catalog.tools.find((tool) => tool.name === 'skills_read');
  assert.ok(guideTool?.outputSchema);
  assert.ok(catalog.tools.some((tool) => tool.name === 'cartridge_deploy'));
  assert.ok(catalog.tools.some((tool) => tool.name === 'mrt_bundle_push'));
  assert.ok(
    !catalog.tools.some((tool) => ['pwakit_get_guidelines', 'scapi_custom_api_generate_scaffold'].includes(tool.name)),
  );
  assert.ok(!catalog.tools.some((tool) => /^(sfnext_|figma_)/.test(tool.name)));
  const resources = await request('resources/list');
  assert.deepEqual(resources.resources.map((resource) => resource.name).sort(), [
    'mcp/b2c-config',
    'mcp/debugger',
    'mcp/server',
    'skill-index',
  ]);
  for (const resource of resources.resources) {
    assert.ok(initialized.instructions.includes(resource.uri));
  }
  const index = await request('resources/read', {uri: 'skill://index'});
  const indexText = index.contents[0].text;
  assert.equal([...indexText.matchAll(/\]\(skill:\/\//g)].length, manifest.entries.length);
  const broaderSkill = await guidance({id: 'b2c-cli/b2c-code'});
  assert.equal(broaderSkill.uri, 'skill://b2c-cli/b2c-code/SKILL.md');
  const broaderResource = await request('resources/read', {uri: broaderSkill.uri});
  assert.ok(broaderResource.contents[0].text.startsWith(broaderSkill.content));
  const directory = await guidance({});
  assert.equal(directory.total, manifest.entries.length);
  const hits = await guidance({query: 'deploy cartridges'});
  assert.ok(hits.entries.some((entry) => entry.id === 'b2c-cli/b2c-code'));
  let read = await guidance({id: 'mcp/server'});
  const native = await request('resources/read', {uri: read.uri});
  let content = read.content;
  while (!read.complete) {
    read = await guidance({cursor: read.nextCursor});
    content += read.content;
  }
  assert.equal(content, native.contents[0].text);
  const project = join(testRoot, 'context-project');
  mkdirSync(project);
  writeFileSync(join(project, 'package.json'), JSON.stringify({dependencies: {'@salesforce/pwa-kit-react-sdk': '1'}}));
  const docs = await request('tools/call', {
    name: 'docs_search',
    arguments: {query: 'components', projectDirectory: project},
  });
  assert.deepEqual(JSON.parse(docs.content[0].text).workspace, ['pwa-kit-v3']);
  const times = [];
  for (let index = 0; index < 30; index++) {
    const start = performance.now();
    await guidance({query: 'debugger session'});
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  metrics = {
    entries: manifest.entries.length,
    markdownFiles: manifest.entries.reduce((count, entry) => count + entry.files.length, 0),
    tools: catalog.tools.length,
    catalogBytes: Buffer.byteLength(JSON.stringify(catalog)),
    guidanceToolBytes: Buffer.byteLength(JSON.stringify(guideTool)),
    instructionBytes: Buffer.byteLength(initialized.instructions ?? ''),
    resourceListBytes: Buffer.byteLength(JSON.stringify(resources)),
    skillIndexBytes: Buffer.byteLength(indexText),
    warmSearchP95Ms: Number(times[Math.ceil(times.length * 0.95) - 1].toFixed(2)),
    network: 'TCP connections blocked during stdio smoke test',
  };
} finally {
  lines.close();
  proc.stdin.end();
  proc.kill();
}

const quote = (value) => JSON.stringify(value);
writeFileSync(
  join(codexHome, 'config.toml'),
  `cli_auth_credentials_store = "file"\n\n[mcp_servers.b2c_guidance]\ncommand = ${quote(process.execPath)}\nargs = [${[runJs, '--tools', 'skills_read', '--project-directory', workspace].map((value) => quote(value)).join(', ')}]\ncwd = ${quote(workspace)}\nstartup_timeout_sec = 30\n\n[mcp_servers.b2c_guidance.env]\nSFCC_DISABLE_TELEMETRY = "true"\n`,
  {mode: 0o600},
);
writeFileSync(join(testRoot, 'verification.json'), `${JSON.stringify(metrics, null, 2)}\n`);
process.stdout.write(
  `\nOffline packed-package verification passed.\n${JSON.stringify(metrics, null, 2)}\n\nTest directory: ${testRoot}\nSee guidance/TESTING.md for login, launch, and evaluation prompts.\n`,
);
