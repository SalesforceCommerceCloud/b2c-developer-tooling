import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {defineConfig} from '@vscode/test-cli';

// The default user-data-dir lives under `.vscode-test/` inside the project. VS
// Code opens an IPC control socket at `<user-data-dir>/<n>-main.sock`, and macOS
// caps AF_UNIX socket paths at ~103 chars. When this repo is checked out at a
// deep path the default socket path overflows that limit and the test host fails
// to launch ("listen EINVAL ... .sock"). Redirect the user-data-dir to a short
// path under the OS temp dir so the socket path stays well under the cap. The
// A fresh root per invocation also prevents settings and workspaceState from a
// prior run from affecting instance-selection tests.
const shortTempDirectory = process.platform === 'darwin' ? '/tmp' : os.tmpdir();
const testRoot = fs.mkdtempSync(path.join(shortTempDirectory, 'b2cv-'));
const configVariables = Object.keys(process.env).filter((key) => key.startsWith('SFCC_') || key.startsWith('MRT_'));
const testPaths = (label) => {
  const root = path.join(testRoot, label);
  return {
    userData: path.join(root, 'user-data'),
    extensions: path.join(root, 'extensions'),
    b2cConfig: path.join(root, 'b2c-config'),
  };
};
const launchArgs = (label) => {
  const paths = testPaths(label);
  return ['--user-data-dir', paths.userData, '--extensions-dir', paths.extensions];
};
const isolatedEnvironment = (label, extra = {}) => {
  const paths = testPaths(label);
  return {
    ...Object.fromEntries(configVariables.map((key) => [key, undefined])),
    B2C_CONFIG_DIR: paths.b2cConfig,
    MRT_CREDENTIALS_FILE: path.join(paths.b2cConfig, 'missing.mobify'),
    ...extra,
  };
};

// Run the integration suite twice against different workspaces. The second run
// points the test host at a workspace whose dw.json is intentionally malformed:
// it guards the activation path against a regression where a garbled local
// dw.json would throw out of activateInner() and disable the entire extension
// (leaving only the two fallback commands), which breaks offline code browsing.
export default defineConfig([
  {
    label: 'valid-workspace',
    files: 'out/test/**/*.test.js',
    version: 'stable',
    workspaceFolder: 'src/test/fixtures/empty-workspace',
    launchArgs: launchArgs('valid-workspace'),
    // Forward opt-in ISML formatter dev vars into the extension host (which does
    // not inherit the parent env): B2C_ISML_CORPUS (corpus idempotency probe) and
    // UPDATE_ISML_SNAPSHOTS (regenerate vendored fixture snapshots).
    env: isolatedEnvironment('valid-workspace', {
      B2C_ISML_CORPUS: process.env.B2C_ISML_CORPUS,
      UPDATE_ISML_SNAPSHOTS: process.env.UPDATE_ISML_SNAPSHOTS,
    }),
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
  {
    label: 'malformed-dw-json',
    files: 'out/test/integration/activation.test.js',
    version: 'stable',
    workspaceFolder: 'src/test/fixtures/malformed-workspace',
    launchArgs: launchArgs('malformed-dw-json'),
    env: isolatedEnvironment('malformed-dw-json'),
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
  {
    label: 'nested-dw-json',
    files: 'out/test/config-provider.test.js',
    version: 'stable',
    workspaceFolder: 'src/test/fixtures/nested-workspace',
    launchArgs: launchArgs('nested-dw-json'),
    env: isolatedEnvironment('nested-dw-json'),
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
  {
    label: 'multi-root-dw-json',
    files: 'out/test/config-provider.test.js',
    version: 'stable',
    workspaceFolder: 'src/test/fixtures/multi-root.code-workspace',
    launchArgs: launchArgs('multi-root-dw-json'),
    env: isolatedEnvironment('multi-root-dw-json'),
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
]);
