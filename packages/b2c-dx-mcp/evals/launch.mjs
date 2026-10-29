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
 *
 * Live cases (the `live/` suite, `pnpm run mcp:eval:live`) instead set `EVAL_MCP_LIVE: "1"`. They
 * use a real configuration supplied by the operator, never a committed one:
 * - `EVAL_LIVE_CONFIG`: path to a dw.json-format file. It is copied into the temporary project
 *   directory as `dw.json`, so the copy (with any secret) lives only in the run's temp directory.
 * - `EVAL_LIVE_INSTANCE`: optional named instance in that file.
 * The server is started with `SFCC_SAFETY_LEVEL=READ_ONLY`; safety levels merge to the strictest
 * source, so the run cannot write even if the configuration allows it.
 */
import {spawn} from 'node:child_process';
import {copyFileSync, cpSync, existsSync, mkdtempSync} from 'node:fs';
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
const live = process.env.EVAL_MCP_LIVE === '1';
const serverEnv = {...process.env, SF_DISABLE_TELEMETRY: 'true', SFCC_DISABLE_TELEMETRY: 'true'};

if (live) {
  const liveConfig = process.env.EVAL_LIVE_CONFIG;
  if (!liveConfig || !existsSync(liveConfig)) {
    throw new Error('b2c-dx-mcp eval: live cases need EVAL_LIVE_CONFIG set to an existing dw.json-format file');
  }

  const projectDirectory = mkdtempSync(path.join(os.tmpdir(), 'b2c-eval-live-'));
  copyFileSync(liveConfig, path.join(projectDirectory, 'dw.json'));
  args.push('--project-directory', projectDirectory);
  if (process.env.EVAL_LIVE_INSTANCE) args.push('--instance', process.env.EVAL_LIVE_INSTANCE);
  serverEnv.SFCC_SAFETY_LEVEL = 'READ_ONLY';
  process.stderr.write(
    `b2c-dx-mcp eval: live configuration copied to ${projectDirectory} (contains credentials; delete kept temp directories)\n`,
  );
} else if (project) {
  const fixture = path.join(evalsRoot, 'fixtures', project);
  if (!existsSync(fixture)) {
    throw new Error(`b2c-dx-mcp eval: unknown fixture "${project}"`);
  }

  const projectDirectory = path.join(mkdtempSync(path.join(os.tmpdir(), 'b2c-eval-')), project);
  cpSync(fixture, projectDirectory, {recursive: true});
  args.push('--project-directory', projectDirectory);
}

const child = spawn(process.execPath, [entry, ...args], {
  env: serverEnv,
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
