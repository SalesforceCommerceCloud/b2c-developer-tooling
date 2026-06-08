import {defineConfig} from '@vscode/test-cli';

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
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
]);
