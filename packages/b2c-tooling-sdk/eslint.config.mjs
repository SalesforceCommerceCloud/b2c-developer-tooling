import {includeIgnoreFile} from '@eslint/compat';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
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
    },
  },
];
