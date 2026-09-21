/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import headerPlugin from 'eslint-plugin-header';
import tseslint from 'typescript-eslint';
import {copyrightHeader, sharedRules, prettierPlugin} from '../eslint.config.mjs';

headerPlugin.rules.header.meta.schema = false;

export default [
  ...tseslint.configs.recommended,
  prettierPlugin,
  {
    files: ['.vitepress/releases/**/*.ts'],
    plugins: {header: headerPlugin},
    languageOptions: {
      parserOptions: {
        project: './.vitepress/releases/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'header/header': ['error', 'block', copyrightHeader],
      ...sharedRules,
    },
  },
];
