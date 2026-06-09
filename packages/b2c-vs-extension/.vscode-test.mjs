import {defineConfig} from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/**/*.test.js',
  version: 'stable',
  workspaceFolder: 'src/test/fixtures/empty-workspace',
  mocha: {
    ui: 'tdd',
    timeout: 20000,
  },
});
