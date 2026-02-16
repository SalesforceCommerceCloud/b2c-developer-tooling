/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {includeIgnoreFile} from '@eslint/compat';
import headerPlugin from 'eslint-plugin-header';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import tseslint from 'typescript-eslint';

import {copyrightHeader, sharedRules, prettierPlugin} from '../../eslint.config.mjs';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');
headerPlugin.rules.header.meta.schema = false;

export default [
  includeIgnoreFile(gitignorePath),
  ...tseslint.configs.recommended,
  prettierPlugin,
  {
    files: ['**/*.ts'],
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
    files: ['src/test/**/*.ts'],
    rules: {
      // Extension tests run in VS Code test env; allow common test patterns
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
