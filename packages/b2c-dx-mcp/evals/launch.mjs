/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Starts the locally built MCP server for `claude plugin eval` runs.
 *
 * Cases configure the server through `EVAL_*` variables in prompt.md `env`:
 * - `EVAL_MCP_ARGS`: extra server arguments, whitespace separated (e.g. `--toolsets MRT`).
 * - `EVAL_MCP_PROJECT`: fixture directory name under `fixtures/`. It is copied to a temporary
 *   directory (configuration discovery walks parent directories) and passed as `--project-directory`.
 *
 * Eval runs provide a temporary HOME, so no user configuration or credentials are visible.
 */
import {spawn} from 'node:child_process';
import {cpSync, existsSync, mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const evalsRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(evalsRoot, '..');
const entry = path.join(packageRoot, 'bin', 'run.js');

if (!existsSync(path.join(packageRoot, 'dist', 'commands', 'mcp.js'))) {
  throw new Error('b2c-dx-mcp eval: build the MCP first (pnpm --filter @salesforce/b2c-dx-mcp run build)');
}

const args = (process.env.EVAL_MCP_ARGS ?? '').split(/\s+/).filter(Boolean);
const project = process.env.EVAL_MCP_PROJECT;
if (project) {
  const fixture = path.join(evalsRoot, 'fixtures', project);
  if (!existsSync(fixture)) {
    throw new Error(`b2c-dx-mcp eval: unknown fixture "${project}"`);
  }

  const projectDirectory = path.join(mkdtempSync(path.join(os.tmpdir(), 'b2c-eval-')), project);
  cpSync(fixture, projectDirectory, {recursive: true});
  args.push('--project-directory', projectDirectory);
}

const child = spawn(process.execPath, [entry, ...args], {
  env: {...process.env, SF_DISABLE_TELEMETRY: 'true', SFCC_DISABLE_TELEMETRY: 'true'},
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
