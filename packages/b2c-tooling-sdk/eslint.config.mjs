/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {includeIgnoreFile} from '@eslint/compat';
import headerPlugin from 'eslint-plugin-header';
import tseslint from 'typescript-eslint';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {copyrightHeader, sharedRules, chaiTestRules, prettierPlugin} from '../../eslint.config.mjs';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');
headerPlugin.rules.header.meta.schema = false;

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['**/*.generated.ts', 'test/fixtures/**', 'data/**'],
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
    // API clients must use the shared transport (clients/http-transport.ts) so
    // SDK-wide HTTP policy such as TLS settings applies to every client.
    files: ['src/**/*.ts'],
    ignores: ['src/clients/http-transport.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'openapi-fetch',
              importNames: ['default'],
              message: 'Use createHttpClient() from clients/http-transport.js (or buildScapiClient) instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // Direct requests use getApiFetch() (or an auth strategy's fetch) for the
    // same reason. Allowed: the transport itself, and requests to non-B2C hosts.
    files: ['src/**/*.ts'],
    ignores: [
      'src/clients/http-transport.ts',
      'src/auth/dispatch-fetch.ts',
      'src/docs/search.ts',
      'src/scapi/local.ts',
      'src/skills/github.ts',
      'src/telemetry/app-insights-client.ts',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use getApiFetch() from clients/http-transport.js (or the auth strategy fetch) instead.',
        },
      ],
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      ...chaiTestRules,
    },
  },
];
