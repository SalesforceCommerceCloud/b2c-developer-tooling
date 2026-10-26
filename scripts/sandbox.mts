/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Isolated sandbox for manually testing a checkout's CLI, MCP server, and VS
 * Code extension against a real instance, starting from nothing configured or
 * from only a server.
 *
 *   pnpm sandbox <command> [options]
 *
 * Every surface runs from source in this checkout (or --repo) with:
 *   - its own XDG data and config directories: no installed CLI plugins
 *     (keychain and other config sources), no shared default dw.json, and no
 *     stored sessions from your normal setup
 *   - SFCC_* and MRT_* variables removed from the environment
 *   - a scratch project (unless --project) with a demo cartridge and a dw.json
 *     holding only the hostname, or no dw.json with --empty
 *   - with --project and --server: the project's dw.json ignored
 *     (SFCC_CONFIG='') and the hostname passed as SFCC_SERVER, so the
 *     project's files aren't touched
 *
 * Each run starts signed out, so every surface shows its first sign-in. Use
 * --keep-session to reuse the previous run's sessions (for example to test
 * silent refresh). The last --server is remembered.
 */

import {spawn, spawnSync} from 'node:child_process';
import {chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {homedir, tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const USAGE = `Usage: pnpm sandbox <command> [options] [-- <args for claude or code>]

Commands:
  shell    Open a shell in the project with \`b2c\` and \`b2c-dx-mcp\` from the checkout
  env      Print exports to load the sandbox into your own shell: eval "$(pnpm -s sandbox env)"
  claude   Start Claude Code with only the checkout's MCP server
  vscode   Open an isolated VS Code window with the checkout's extension
  probe    Call an MCP tool from a scripted client and report the login prompts
  check    Automated checks that need no sign-in (MCP URL elicitation in both protocol eras);
           runs in a throwaway sandbox against --server or a placeholder host
  reset    Delete stored sessions (CLI, MCP, and VS Code) without starting anything

Options:
  --server <host|url>   Instance hostname, or any URL on the instance (remembered)
  --project <dir>       Project to open instead of the scratch project
  --empty               Scratch project without a dw.json (tests setup from nothing)
  --repo <dir>          Checkout to run from (default: this one)
  --state <dir>         Sandbox state (default: ~/.cache/b2c-dx-sandbox)
  --keep-session        Reuse sessions from the previous run instead of starting signed out
  --toolsets <list>     MCP toolsets (default: all)
  --no-build            vscode: skip building the extension

probe options:
  --protocol <version>  2026-07-28 (default) or legacy (2025-era elicitation/create)
  --answer <action>     accept (default; opens the URL), decline, or cancel
  --no-url              Don't advertise URL elicitation; the server opens the system browser
  --tool <name>         Tool to call (default: webdav_list)
  --args <json>         Tool arguments (default: {"path":"Cartridges"})
  --calls <n>           Call the tool n times; later calls shouldn't prompt (default: 2)`;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const invokedFrom = process.env.INIT_CWD ?? process.cwd();

function fail(message: string): never {
  console.error(`error: ${message}\n\n${USAGE}`);
  process.exit(1);
}

/** Hostname from a bare host or any URL on the instance. */
function parseHostname(input: string): string {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  try {
    return new URL(withScheme).host.toLowerCase();
  } catch {
    return fail(`not a hostname or URL: ${input}`);
  }
}

// ─── Arguments ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
if (argv[0] === '--') argv.shift();
const command = argv[0]?.startsWith('-') ? undefined : argv.shift();
const separator = argv.indexOf('--');
const {values: opts} = parseArgs({
  args: separator === -1 ? argv : argv.slice(0, separator),
  options: {
    server: {type: 'string'},
    project: {type: 'string'},
    empty: {type: 'boolean', default: false},
    repo: {type: 'string', default: resolve(scriptDir, '..')},
    state: {type: 'string', default: join(homedir(), '.cache', 'b2c-dx-sandbox')},
    'keep-session': {type: 'boolean', default: false},
    toolsets: {type: 'string', default: 'all'},
    'no-build': {type: 'boolean', default: false},
    protocol: {type: 'string', default: '2026-07-28'},
    answer: {type: 'string', default: 'accept'},
    'no-url': {type: 'boolean', default: false},
    tool: {type: 'string', default: 'webdav_list'},
    args: {type: 'string', default: '{"path":"Cartridges"}'},
    calls: {type: 'string', default: '2'},
    help: {type: 'boolean', short: 'h', default: false},
  },
});
const passthrough = separator === -1 ? [] : argv.slice(separator + 1);
if (opts.help || !command) {
  console.log(USAGE);
  process.exit(command || opts.help ? 0 : 1);
}

const repoDir = resolve(invokedFrom, opts.repo!);
// `check` needs a sandbox with no sessions, so it never reuses one.
const isCheck = command === 'check';
const stateDir = isCheck ? mkdtempSync(join(tmpdir(), 'b2c-dx-sandbox-check-')) : resolve(invokedFrom, opts.state!);
if (isCheck) {
  if (opts.project || opts.empty) fail('check always uses a scratch project with only a server');
  process.on('exit', () => rmSync(stateDir, {recursive: true, force: true}));
}
const paths = {
  data: join(stateDir, 'data'),
  config: join(stateDir, 'config'),
  bin: join(stateDir, 'bin'),
  scratch: join(stateDir, 'project'),
  vscodeUser: join(stateDir, 'vscode', 'user'),
  vscodeExtensions: join(stateDir, 'vscode', 'extensions'),
  settings: join(stateDir, 'sandbox.json'),
  cli: join(repoDir, 'packages', 'b2c-cli', 'bin', 'dev.js'),
  mcp: join(repoDir, 'packages', 'b2c-dx-mcp', 'bin', 'dev.js'),
  extension: join(repoDir, 'packages', 'b2c-vs-extension'),
};

function clearSessions(): void {
  // CLI and MCP sessions live under the b2c data and config dirs; VS Code keeps
  // its own in secret storage. Other tools that honor XDG (Claude Code
  // included) also write to the data dir, so leave the rest alone.
  for (const dir of [join(paths.data, 'b2c'), join(paths.config, 'b2c'), paths.vscodeUser]) {
    rmSync(dir, {recursive: true, force: true});
  }
  if (command === 'reset') console.error(`Cleared sandbox sessions in ${stateDir}`);
}

if (command === 'reset') {
  clearSessions();
  process.exit(0);
}
const COMMANDS = ['shell', 'env', 'claude', 'vscode', 'probe', 'check'];
if (!COMMANDS.includes(command)) fail(`unknown command: ${command}`);
if (!existsSync(paths.cli) || !existsSync(paths.mcp)) fail(`${repoDir} is not a checkout of this repository`);
if (!opts['keep-session']) clearSessions();

// ─── Sandbox setup ────────────────────────────────────────────────────────

const saved = existsSync(paths.settings) ? (JSON.parse(readFileSync(paths.settings, 'utf8')) as {server?: string}) : {};
const hostname = opts.server ? parseHostname(opts.server) : isCheck ? 'my-sandbox.example.com' : saved.server;
mkdirSync(stateDir, {recursive: true});
if (opts.server && !isCheck) writeFileSync(paths.settings, JSON.stringify({server: hostname}, null, 2) + '\n');
for (const dir of [paths.data, paths.config, paths.bin]) mkdirSync(dir, {recursive: true});

const env: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (value !== undefined && !/^(SFCC|MRT)_/.test(key)) env[key] = value;
}
Object.assign(env, {
  B2C_SANDBOX: stateDir,
  PATH: `${paths.bin}:${process.env.PATH ?? ''}`,
  SFCC_DISABLE_TELEMETRY: 'true',
  XDG_CONFIG_HOME: paths.config,
  XDG_DATA_HOME: paths.data,
});

let projectDir: string;
if (opts.project) {
  projectDir = resolve(invokedFrom, opts.project);
  if (hostname && !opts.empty) {
    env.SFCC_CONFIG = '';
    env.SFCC_SERVER = hostname;
  }
} else {
  projectDir = paths.scratch;
  const cartridge = join(projectDir, 'cartridges', 'app_sandbox');
  if (!existsSync(cartridge)) {
    mkdirSync(join(cartridge, 'cartridge', 'scripts'), {recursive: true});
    writeFileSync(join(cartridge, '.project'), '<?xml version="1.0" encoding="UTF-8"?>\n<projectDescription/>\n');
    writeFileSync(join(cartridge, 'cartridge', 'scripts', 'hello.js'), "'use strict';\n\nmodule.exports = 'hello';\n");
  }
  const dwJson = join(projectDir, 'dw.json');
  if (opts.empty || !hostname) rmSync(dwJson, {force: true});
  else if (opts.server || !existsSync(dwJson)) writeFileSync(dwJson, JSON.stringify({hostname}, null, 2) + '\n');
}

for (const [name, bin] of [
  ['b2c', paths.cli],
  ['b2c-dx-mcp', paths.mcp],
]) {
  const wrapper = join(paths.bin, name);
  writeFileSync(wrapper, `#!/bin/sh\nexec "${process.execPath}" --conditions development "${bin}" "$@"\n`);
  chmodSync(wrapper, 0o755);
}

const mcpArgs = [
  '--conditions',
  'development',
  paths.mcp,
  '--toolsets',
  opts.toolsets!,
  '--project-directory',
  projectDir,
];

if (command !== 'env') {
  let config = 'project configuration';
  if (!opts.project)
    config = existsSync(join(projectDir, 'dw.json')) ? `dw.json with ${hostname}` : 'nothing configured';
  else if (env.SFCC_SERVER) config = `SFCC_SERVER=${hostname}, dw.json ignored`;
  console.error(`Checkout: ${repoDir}`);
  console.error(`Project:  ${projectDir} (${config})`);
  console.error(`State:    ${stateDir}\n`);
}

// ─── Commands ─────────────────────────────────────────────────────────────

function run(cmd: string, args: string[], options: {cwd?: string; detached?: boolean} = {}): void {
  const child = spawn(cmd, args, {
    cwd: options.cwd ?? projectDir,
    env,
    stdio: options.detached ? 'ignore' : 'inherit',
    detached: options.detached,
  });
  child.on('error', (error) => fail(`could not start ${cmd}: ${error.message}`));
  if (options.detached) child.unref();
  else child.on('exit', (code) => process.exit(code ?? 0));
}

/**
 * The user's shell, set up to put the sandbox `bin` first on PATH after their
 * startup files run, since those often prepend version-manager paths (fnm, nvm)
 * that hold a globally installed `b2c`.
 */
function interactiveShell(): [string, string[]] {
  const shell = process.env.SHELL ?? '/bin/sh';
  const prepend = `export PATH='${paths.bin.replaceAll("'", `'\\''`)}':"$PATH"; hash -r 2>/dev/null\n`;
  const rcDir = join(stateDir, 'rc');
  mkdirSync(rcDir, {recursive: true});
  if (shell.endsWith('/zsh')) {
    // zsh reads startup files from ZDOTDIR; source the user's own, then prepend.
    const userDir = process.env.ZDOTDIR ?? homedir();
    env.SANDBOX_USER_ZDOTDIR = userDir;
    writeFileSync(join(rcDir, '.zshenv'), '[ -f "$SANDBOX_USER_ZDOTDIR/.zshenv" ] && . "$SANDBOX_USER_ZDOTDIR/.zshenv"\n');
    writeFileSync(
      join(rcDir, '.zshrc'),
      'ZDOTDIR="$SANDBOX_USER_ZDOTDIR"\n[ -f "$ZDOTDIR/.zshrc" ] && . "$ZDOTDIR/.zshrc"\n' + prepend,
    );
    env.ZDOTDIR = rcDir;
    return [shell, ['-i']];
  }
  if (shell.endsWith('/bash')) {
    const rcFile = join(rcDir, 'bashrc');
    writeFileSync(rcFile, '[ -f "$HOME/.bashrc" ] && . "$HOME/.bashrc"\n' + prepend);
    return [shell, ['--rcfile', rcFile, '-i']];
  }
  return [shell, ['-i']];
}

switch (command) {
  case 'shell': {
    console.error('`b2c` and `b2c-dx-mcp` run from the checkout. Exit the shell to leave the sandbox.\n');
    const [shell, args] = interactiveShell();
    run(shell, args);
    break;
  }

  case 'env': {
    const scrubbed = Object.keys(process.env).filter((key) => /^(SFCC|MRT)_/.test(key) && !(key in env));
    if (scrubbed.length > 0) console.log(`unset ${scrubbed.join(' ')}`);
    const quote = (v: string) => `'${v.replaceAll("'", `'\\''`)}'`;
    for (const key of ['B2C_SANDBOX', 'SFCC_DISABLE_TELEMETRY', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME']) {
      console.log(`export ${key}=${quote(env[key])}`);
    }
    // Extend the caller's PATH, not the one pnpm built for this script.
    console.log(`export PATH=${quote(paths.bin)}:"$PATH"`);
    if ('SFCC_SERVER' in env) console.log(`export SFCC_CONFIG='' SFCC_SERVER=${quote(env.SFCC_SERVER)}`);
    console.log(`cd ${quote(projectDir)}`);
    break;
  }

  case 'claude': {
    const mcpConfig = join(stateDir, 'mcp.json');
    writeFileSync(
      mcpConfig,
      JSON.stringify({mcpServers: {'b2c-dx-local': {command: process.execPath, args: mcpArgs}}}, null, 2) + '\n',
    );
    console.error(
      'Only the checkout\'s MCP server is loaded ("b2c-dx-local"); installed plugins\' MCP servers are not.',
    );
    console.error('Try: "list the code versions in Cartridges on my instance"\n');
    run('claude', ['--strict-mcp-config', '--mcp-config', mcpConfig, ...passthrough]);
    break;
  }

  case 'vscode': {
    if (!opts['no-build']) {
      console.error('Building the extension (skip with --no-build)...');
      const build = spawnSync('pnpm', ['run', 'build'], {cwd: paths.extension, stdio: 'inherit'});
      if (build.status !== 0) fail('extension build failed');
    }
    run(
      'code',
      [
        '--new-window',
        '--user-data-dir',
        paths.vscodeUser,
        '--extensions-dir',
        paths.vscodeExtensions,
        '--extensionDevelopmentPath',
        paths.extension,
        ...passthrough,
        projectDir,
      ],
      {detached: true},
    );
    console.error('Opened an isolated VS Code window. Its output is in the "B2C DX" and "B2C Code Upload" channels.');
    break;
  }

  case 'probe': {
    const answer = opts.answer as Answer;
    if (!['accept', 'decline', 'cancel'].includes(answer)) fail('--answer must be accept, decline, or cancel');
    if (opts.protocol !== 'legacy' && opts.protocol !== '2026-07-28') fail('--protocol must be 2026-07-28 or legacy');
    const outcome = await probe({
      answer,
      calls: Number(opts.calls),
      legacy: opts.protocol === 'legacy',
      tool: opts.tool!,
      toolArgs: JSON.parse(opts.args!) as Record<string, unknown>,
      url: !opts['no-url'],
      verbose: true,
    });
    process.exit(outcome.results.some((r) => r.isError) ? 1 : 0);
    break;
  }

  case 'check': {
    await check();
    break;
  }
}

// ─── MCP probe ────────────────────────────────────────────────────────────

type Answer = 'accept' | 'cancel' | 'decline';

interface ProbeOptions {
  answer: Answer;
  calls: number;
  legacy: boolean;
  tool: string;
  toolArgs: Record<string, unknown>;
  url: boolean;
  verbose: boolean;
}

interface ProbeOutcome {
  prompts: {message: string; mode?: string; url?: string}[];
  results: {isError: boolean; text: string}[];
}

async function probe(options: ProbeOptions): Promise<ProbeOutcome> {
  const log = (message: string) => options.verbose && console.error(message);
  const outcome: ProbeOutcome = {prompts: [], results: []};
  const client = new Client(
    {name: 'b2c-dx-sandbox', version: '1'},
    {
      versionNegotiation: options.legacy ? {mode: 'legacy'} : {mode: {pin: '2026-07-28'}},
      capabilities: options.url ? {elicitation: {url: {}}} : {},
    },
  );
  client.setRequestHandler('elicitation/create', async (request) => {
    const params = request.params as {message: string; mode?: string; url?: string};
    outcome.prompts.push(params);
    log(`\n[elicitation] mode=${params.mode}\n  message: ${params.message}\n  url: ${params.url}`);
    log(`[elicitation] answering ${options.answer}`);
    if (options.answer === 'accept' && params.url) {
      // Like a client, open the URL once the user agrees.
      const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
      spawn(opener, [params.url], {stdio: 'ignore', detached: true}).unref();
    }
    return {action: options.answer};
  });

  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: mcpArgs,
      env,
      cwd: projectDir,
      stderr: options.verbose ? 'inherit' : 'ignore',
    }),
  );
  log(`Connected (${options.legacy ? 'legacy' : '2026-07-28'}${options.url ? '' : ', no URL elicitation'})`);

  try {
    for (let i = 1; i <= options.calls; i++) {
      const before = outcome.prompts.length;
      const started = Date.now();
      log(`\n[call ${i}] ${options.tool} ${JSON.stringify(options.toolArgs)}`);
      // Signing in can take minutes; don't let the default request timeout end the call.
      const result = await client.callTool({name: options.tool, arguments: options.toolArgs}, {timeout: 10 * 60_000});
      const text = (result.content as {text?: string}[]).map((c) => c.text ?? '').join('\n');
      outcome.results.push({isError: result.isError === true, text});
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      log(
        `[call ${i}] ${result.isError ? 'error' : 'ok'} in ${seconds}s, ${outcome.prompts.length - before} login prompt(s)`,
      );
      if (options.verbose) console.log(text);
      if (result.isError) break;
    }
  } finally {
    await client.close();
  }
  return outcome;
}

/**
 * Checks what can be verified without signing in: with no session, a WebDAV
 * call asks the client to open the Account Manager login in both protocol
 * eras, and declining or cancelling ends the call. Runs in a throwaway
 * sandbox; no request reaches the instance.
 */
async function check(): Promise<void> {
  const cases: {answer: Answer; expect: string; legacy: boolean}[] = [
    {legacy: false, answer: 'decline', expect: 'Account Manager login declined.'},
    {legacy: false, answer: 'cancel', expect: 'Account Manager login cancelled.'},
    {legacy: true, answer: 'decline', expect: 'Account Manager login declined.'},
    {legacy: true, answer: 'cancel', expect: 'Account Manager login cancelled.'},
  ];
  let failed = 0;
  for (const c of cases) {
    const label = `${c.legacy ? 'legacy    ' : '2026-07-28'} ${c.answer.padEnd(7)}`;
    try {
      const outcome = await probe({
        answer: c.answer,
        calls: 1,
        legacy: c.legacy,
        tool: 'webdav_list',
        toolArgs: {path: 'Cartridges'},
        url: true,
        verbose: false,
      });
      const prompt = outcome.prompts[0];
      const problems = [
        outcome.prompts.length === 1 ? '' : `expected 1 prompt, saw ${outcome.prompts.length}`,
        prompt?.mode === 'url' ? '' : `expected mode url, saw ${prompt?.mode}`,
        prompt?.url?.includes('/dwsso/oauth2/authorize') ? '' : `unexpected URL ${prompt?.url}`,
        outcome.results[0]?.text.includes(c.expect) ? '' : `unexpected result: ${outcome.results[0]?.text}`,
      ].filter(Boolean);
      if (problems.length > 0) failed++;
      console.log(`${problems.length === 0 ? 'PASS' : 'FAIL'}  ${label} ${problems.join('; ')}`);
    } catch (error) {
      failed++;
      console.log(`FAIL  ${label} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failed > 0) {
    console.log(`\n${failed} check(s) failed. Run \`pnpm sandbox probe --answer decline\` to see the server's output.`);
    process.exit(1);
  }
  console.log('\nAll checks passed. Sign-in itself needs a manual run: `pnpm sandbox probe` or `pnpm sandbox claude`.');
}
