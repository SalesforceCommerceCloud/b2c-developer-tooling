import {defineConfig} from '@vscode/test-cli';

export default defineConfig([
  {
    label: 'jobs-menu-and-step-types',
    files: ['out/test/jobs-menu.test.js', 'out/test/cartridge-step-types.test.js'],
    version: 'stable',
    workspaceFolder: 'src/test/fixtures/empty-workspace',
    mocha: {
      ui: 'tdd',
      timeout: 20000,
    },
  },
]);
