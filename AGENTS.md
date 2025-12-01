
- this is a monorepo project; packages:
  - ./packages/b2c-cli - the command line interface built with oclif
  - ./packages/b2c-tooling - the SDK/library for B2C Commerce operations; support the CLI and can be used standalone

## Setup/Packaging

- use `pnpm` over `npm` for package management
- the `pnpm run test` commands also run the linter after tests
- use `pnpm run -r format` (or individually in packages) to format code with prettier
- use `exports` field in package.json files to define public API surface for packages; use `development` field for nodejs --conditions for development ergonomics (packages/b2c-cli/bin/dev.js will use this condition)

## Documentation

- prefer verbose jsdoc comments for all public methods and classes
- TypeDoc and vitepress will generate documentation from these comments in the `./docs/api` folder
- module level jsdocs will be used for organization; for example packages/b2c-tooling/src/auth/index.ts barrel file has the module level docs for the `auth` module
- see the typedoc.json file for configuration options including the entry points for documentation generation
- update the docs/ markdown files (non-generated) for user guides and CLI reference when updating major CLI functionalty or adding new commands

## Logging

- when logging use the logger instance from `@salesforce/b2c-tooling/logger` package
- CLI commands have access to this logger via `this.log` method from oclif Command class
- CLI commands can write directly to stdout/stderr if their primary purpose is to output or stream data
