/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {includeIgnoreFile} from '@eslint/compat';
import headerPlugin from '@tony.ganchev/eslint-plugin-header';
import tseslint from 'typescript-eslint';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {copyrightHeader, sharedRules, chaiTestRules, prettierPlugin} from '../../eslint.config.mjs';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['**/*.generated.ts'],
  },
  ...tseslint.configs.recommended,
  prettierPlugin,
  {
    files: ['**/*.ts'],
    plugins: {
      header: headerPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'header/header': ['error', 'block', copyrightHeader],
      ...sharedRules,
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      ...chaiTestRules,
    },
  },
];
