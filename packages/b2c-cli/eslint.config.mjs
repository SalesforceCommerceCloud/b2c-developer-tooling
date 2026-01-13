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

import {copyrightHeader, sharedRules, oclifRules, prettierPlugin} from '../../eslint.config.mjs';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');
headerPlugin.rules.header.meta.schema = false;

export default [
  // Global ignores must come first - these patterns apply to all subsequent configs
  // node_modules must be explicitly ignored because the .gitignore pattern only covers
  // packages/b2c-cli/node_modules, not the monorepo root node_modules
  {
    ignores: ['**/node_modules/**', 'test/functional/fixtures/**/*.js'],
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
];
