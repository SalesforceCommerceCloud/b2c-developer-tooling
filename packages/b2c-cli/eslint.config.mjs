/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {includeIgnoreFile} from '@eslint/compat';
import oclif from 'eslint-config-oclif';
import headerPlugin from 'eslint-plugin-header';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {copyrightHeader, sharedRules, oclifRules, chaiTestRules, prettierPlugin} from '../../eslint.config.mjs';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');
headerPlugin.rules.header.meta.schema = false;

export default [
  // Global ignores must come first - these patterns apply to all subsequent configs
  // node_modules must be explicitly ignored because the .gitignore pattern only covers
  // packages/b2c-cli/node_modules, not the monorepo root node_modules
  {
    ignores: ['**/node_modules/**', 'test/functional/fixtures/**/*.js', '**/node_modules/marked-terminal/**'],
  },
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettierPlugin,
  {
    plugins: {
      header: headerPlugin,
    },
    linterOptions: {
      // Downgrade to warn - import/namespace behaves inconsistently across environments
      // when parsing CJS modules like marked-terminal
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      'header/header': ['error', 'block', copyrightHeader],
      ...sharedRules,
      ...oclifRules,
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      ...chaiTestRules,
      // Tests use stubbing patterns that intentionally return undefined
      'unicorn/no-useless-undefined': 'off',
      // Some tests use void 0 to satisfy TS stub typings; allow it in tests
      'no-void': 'off',
      // Command tests frequently use `any` to avoid over-typing oclif command internals
      '@typescript-eslint/no-explicit-any': 'off',
      // Helper functions in tests are commonly declared within suites for clarity
      'unicorn/consistent-function-scoping': 'off',
      // Sinon default import is intentional and idiomatic in tests
      'import/no-named-as-default-member': 'off',
      // import/namespace behaves inconsistently across environments when parsing CJS modules like marked-terminal
      'import/namespace': 'off',
      // Disable for tests: ESLint import resolver doesn't understand conditional exports (development condition)
      // but Node.js resolves them correctly at runtime
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['src/commands/docs/**/*.ts'],
    rules: {
      // marked-terminal is CJS and breaks import/namespace static analysis
      'import/namespace': 'off',
    },
  },
  {
    files: ['src/commands/setup/**/*.ts'],
    rules: {
      // ESLint import resolver doesn't understand conditional exports (development condition)
      // but Node.js resolves them correctly at runtime
      'import/no-unresolved': 'off',
    },
  },
];
