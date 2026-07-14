import os from 'node:os';
import path from 'node:path';
import {defineConfig} from '@vscode/test-cli';

// Redirect the user-data-dir to a short temp path so VS Code's AF_UNIX control
// socket (`<user-data-dir>/<n>-main.sock`) stays under the ~103-char macOS limit
// when this repo is checked out at a deep path. See .vscode-test.mjs for detail.
const shortUserDataDir = (label) => path.join(os.tmpdir(), `b2cvsct-${label}`);

export default defineConfig([
  {
    label: 'jobs-menu-and-step-types',
    files: ['out/test/jobs-menu.test.js', 'out/test/cartridge-step-types.test.js', 'out/test/jobs-xml-parser.test.js'],
    version: 'stable',
    workspaceFolder: 'src/test/fixtures/empty-workspace',
    launchArgs: ['--user-data-dir', shortUserDataDir('jobs-menu-and-step-types')],
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
]);
