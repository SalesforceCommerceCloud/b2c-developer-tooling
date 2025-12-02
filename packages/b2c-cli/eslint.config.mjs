import {includeIgnoreFile} from '@eslint/compat';
import oclif from 'eslint-config-oclif';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettierPlugin,
  {
    rules: {
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
