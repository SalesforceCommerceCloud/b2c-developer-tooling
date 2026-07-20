/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import headerPlugin from 'eslint-plugin-header';
import tseslint from 'typescript-eslint';

import {copyrightHeader, sharedRules, prettierPlugin} from '../../eslint.config.mjs';

headerPlugin.rules.header.meta.schema = false;

export default [
  {
    ignores: ['plugin/**', 'types/**'],
  },
  ...tseslint.configs.recommended,
  prettierPlugin,
  {
    files: ['src/**/*.ts'],
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
    // Tests run directly via `node --test` (no bundler/loader), so they're
    // plain CommonJS .js files using require() rather than the src/ package's
    // ESM-style import syntax.
    files: ['test/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
