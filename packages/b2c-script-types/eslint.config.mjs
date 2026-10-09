/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import headerPlugin from 'eslint-plugin-header';
import tseslint from 'typescript-eslint';

import {copyrightHeader, sharedRules, chaiTestRules, prettierPlugin} from '../../eslint.config.mjs';

headerPlugin.rules.header.meta.schema = false;

export default [
  {
    ignores: ['plugin/**', 'types/**'],
  },
  ...tseslint.configs.recommended,
  prettierPlugin,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    plugins: {
      header: headerPlugin,
    },
    languageOptions: {
      parserOptions: {ecmaVersion: 2022, sourceType: 'module'},
    },
    rules: {
      'header/header': ['error', 'block', copyrightHeader],
      ...sharedRules,
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: chaiTestRules,
  },
  {
    // The usage-inference suites are plain CommonJS .js files that exercise
    // the compiled plugin/ output directly, so they use require() rather than
    // the src/ package's ESM-style import syntax.
    files: ['test/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
