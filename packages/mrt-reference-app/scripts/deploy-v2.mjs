/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// `bundle upload-v2` is upload-only, so a v2 deploy is a three-step chain:
// build the v2 bundle -> upload it (capturing the new bundle id via --json) ->
// deploy that id to an environment. Passthrough args (everything after `--`)
// are routed to whichever sub-command understands them: `upload-v2` has no
// --environment flag, and `deploy <id>` ignores build/config flags, so the same
// args cannot be forwarded to both blindly.
const DEPLOY_ONLY_VALUE = new Set(['-e', '--environment', '--poll-interval', '--timeout']);
const DEPLOY_ONLY_BOOL = new Set(['-w', '--wait']);
const SHARED_VALUE = new Set(['-p', '--project']); // both sub-commands accept --project

/** Splits passthrough argv into args for `upload-v2` and for `deploy`. */
function routeArgs(argv) {
  const uploadArgs = [];
  const deployArgs = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') continue; // pnpm forwards the `--` separator; it means nothing here
    const eq = arg.startsWith('-') ? arg.indexOf('=') : -1;
    const name = eq !== -1 ? arg.slice(0, eq) : arg;
    const hasInlineValue = eq !== -1;
    if (DEPLOY_ONLY_BOOL.has(name)) {
      deployArgs.push(arg);
    } else if (DEPLOY_ONLY_VALUE.has(name)) {
      deployArgs.push(arg);
      if (!hasInlineValue && i + 1 < argv.length) deployArgs.push(argv[++i]);
    } else if (SHARED_VALUE.has(name)) {
      uploadArgs.push(arg);
      deployArgs.push(arg);
      if (!hasInlineValue && i + 1 < argv.length) {
        const value = argv[++i];
        uploadArgs.push(value);
        deployArgs.push(value);
      }
    } else {
      // Build/config flags (message, build-dir, root-dir, ssr-*, etc.) and their
      // values go to upload-v2 only.
      uploadArgs.push(arg);
    }
  }
  return {uploadArgs, deployArgs};
}

/** Spawns a command, inheriting stdio unless capturing stdout for parsing. */
function run(command, args, {captureStdout = false, ...options} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: captureStdout ? ['inherit', 'pipe', 'inherit'] : 'inherit', ...options});
    let stdout = '';
    if (captureStdout) child.stdout.on('data', (chunk) => (stdout += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`\`${command} ${args.join(' ')}\` exited with code ${code}`));
    });
  });
}

async function main() {
  const {uploadArgs, deployArgs} = routeArgs(process.argv.slice(2));

  // 1. Build the app. upload-v2 reads config.server.ts from the project
  //    directory at upload time and writes the derived config into the bundle.
  await run(process.execPath, [path.join(__dirname, 'build.mjs')]);

  // 2. Upload the v2 bundle; --json yields a machine-readable result on stdout.
  const json = await run('b2c', ['mrt', 'bundle', 'upload-v2', '--json', ...uploadArgs], {captureStdout: true});

  let bundleId;
  try {
    bundleId = JSON.parse(json).bundleId;
  } catch {
    throw new Error(`Could not parse the bundle id from \`upload-v2 --json\` output:\n${json}`);
  }
  if (bundleId === undefined || bundleId === null) {
    throw new Error(`\`upload-v2 --json\` output did not include a bundleId:\n${json}`);
  }

  // 3. Deploy the uploaded bundle to the target environment.
  await run('b2c', ['mrt', 'bundle', 'deploy', String(bundleId), ...deployArgs]);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
