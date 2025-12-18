/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {includeIgnoreFile} from '@eslint/compat';
import oclif from 'eslint-config-oclif';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import headerPlugin from '@tony.ganchev/eslint-plugin-header';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['test/functional/fixtures/**/*.js'],
  },
  ...oclif,
  prettierPlugin,
  {
    plugins: {
      header: headerPlugin,
    },
    rules: {
      'header/header': [
        'error',
        'block',
        [
          '',
          ' * Copyright (c) 2025, Salesforce, Inc.',
          ' * SPDX-License-Identifier: Apache-2',
          ' * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0',
          ' ',
        ],
      ],
      // Disable perfectionist rules - we use prettier for formatting
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-named-exports': 'off',
      'perfectionist/sort-named-imports': 'off',
      // Disable stylistic rules that conflict with our style
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      // Allow TODO comments
      'no-warning-comments': 'off',
      // Don't require destructuring
      'prefer-destructuring': 'off',
      // Disable new-cap - incompatible with openapi-fetch (uses GET, POST, etc. methods)
      'new-cap': 'off',
      // Allow underscore-prefixed unused variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
