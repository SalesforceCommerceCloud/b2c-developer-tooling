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
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettierPlugin,
  {
    plugins: {
      header: headerPlugin,
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
      // Helper functions in tests are commonly declared within suites for clarity
      'unicorn/consistent-function-scoping': 'off',
      // Sinon default import is intentional and idiomatic in tests
      'import/no-named-as-default-member': 'off',
      // import/namespace behaves inconsistently across environments when parsing CJS modules
      'import/namespace': 'off',
      // Disable for tests: ESLint import resolver doesn't understand conditional exports (development condition)
      // but Node.js resolves them correctly at runtime
      'import/no-unresolved': 'off',
    },
  },
];
