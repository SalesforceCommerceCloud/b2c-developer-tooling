/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Shared ESLint configuration for the b2c-cli monorepo.
 * Packages import from this file to maintain consistency.
 */

import prettierPlugin from 'eslint-plugin-prettier/recommended';

/**
 * The standard copyright header block used across all packages.
 */
export const copyrightHeader = [
  '',
  ' * Copyright (c) 2025, Salesforce, Inc.',
  ' * SPDX-License-Identifier: Apache-2',
  ' * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0',
  ' ',
];

/**
 * Shared rules used across all packages.
 */
export const sharedRules = {
  // Allow underscore-prefixed unused variables (common convention for intentionally unused params)
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  // Disable new-cap - incompatible with openapi-fetch (uses GET, POST, etc. methods)
  'new-cap': 'off',
};

/**
 * Rules for packages using eslint-config-oclif.
 * Disables perfectionist and stylistic rules that conflict with our style.
 */
export const oclifRules = {
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
};

/**
 * Rules for test files using Chai assertions.
 */
export const chaiTestRules = {
  // Allow Chai property-based assertions in test files (e.g., expect(x).to.be.true)
  '@typescript-eslint/no-unused-expressions': 'off',
};

/**
 * Re-export prettier plugin for convenience.
 */
export {prettierPlugin};
