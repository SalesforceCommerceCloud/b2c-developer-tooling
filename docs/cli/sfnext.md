---
description: Build, run, and deploy Storefront Next (SFNext) projects with B2C CLI plugin commands for scaffolding new storefronts, generating cartridges, managing extensions, and pushing bundles to Managed Runtime.
---

# Storefront Next Commands

The `b2c sfnext` commands help you scaffold, develop, and deploy Storefront Next (SFNext) projects. The commands are provided by the `@salesforce/storefront-next-dev` package and run under the B2C CLI.

## Bootstrap a New Project

To scaffold a new Storefront Next project from outside an existing project, use `npx` so you don't need to install the B2C CLI globally first:

```bash
npx @salesforce/b2c-cli sfnext create-storefront
```

This creates a new project directory with everything you need: a Storefront Next template, scripts for development and deployment, and the B2C CLI as a development dependency.

## In-Project Commands

Once you have a project, the scaffolded `package.json` includes scripts that wrap the most common Storefront Next operations. Run them with your package manager:

```bash
pnpm run dev               # start the local dev server
pnpm run push              # build and deploy a bundle to Managed Runtime
pnpm run cartridge:generate
pnpm run cartridge:deploy
pnpm run config:inspect
```

You can also invoke any command directly:

```bash
b2c sfnext push
b2c sfnext extensions list
b2c sfnext scapi add
b2c sfnext locales aggregate-extensions
```

## Topics

- `b2c sfnext extensions` — manage Storefront Next extensions (`create`, `install`, `list`, `remove`)
- `b2c sfnext scapi` — manage SCAPI client overrides and custom APIs (`add`, `available`, `list`, `remove`)
- `b2c sfnext config` — inspect and manage storefront configuration
- `b2c sfnext locales` — manage locale and translation files

For full command reference and flags, run `b2c sfnext <command> --help`.
