import os from 'node:os';
import path from 'node:path';
import {defineConfig} from '@vscode/test-cli';

// The default user-data-dir lives under `.vscode-test/` inside the project. VS
// Code opens an IPC control socket at `<user-data-dir>/<n>-main.sock`, and macOS
// caps AF_UNIX socket paths at ~103 chars. When this repo is checked out at a
// deep path the default socket path overflows that limit and the test host fails
// to launch ("listen EINVAL ... .sock"). Redirect the user-data-dir to a short
// path under the OS temp dir so the socket path stays well under the cap. The
// dir is per-label so the two configs below don't share a control socket.
const shortUserDataDir = (label) => path.join(os.tmpdir(), `b2cvsct-${label}`);

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
    launchArgs: ['--user-data-dir', shortUserDataDir('valid-workspace')],
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
    launchArgs: ['--user-data-dir', shortUserDataDir('malformed-dw-json')],
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
]);
