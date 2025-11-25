
## Setup/Packaging

- use `pnpm` over `npm` for package management
- the `pnpm run test` commands also run the linter after tests
- use `pnpm run -r format` (or individually in packages) to format code with prettier

## Documentation

- prefer verbose jsdoc comments for all public methods and classes
- TypeDoc and vitepress will generate documentation from these comments in the `./docs/api` folder
- module level jsdocs will be used for organization; for example packages/b2c-tooling/src/auth/index.ts barrel file has the module level docs for the `auth` module
- see the typedoc.json file for configuration options including the entry points for documentation generation
