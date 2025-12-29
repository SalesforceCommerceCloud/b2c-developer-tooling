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
];
