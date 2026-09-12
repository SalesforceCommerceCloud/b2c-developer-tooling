---
description: Build, run, and deploy Storefront Next (SFNext) projects with B2C CLI plugin commands for scaffolding new storefronts, generating cartridges, managing extensions, and pushing bundles to Managed Runtime.
---

# Storefront Next Commands

The `b2c sfnext` commands help you scaffold, develop, and deploy Storefront Next (SFNext) projects. The commands are provided by the `@salesforce/storefront-next-dev` package and run under the B2C CLI.

For a storefront connected to your B2C Commerce instance, start with [storefront setup in Business Manager](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-bm.html). It creates the API and MRT resources along with your storefront configuration. See our [Storefront Next guide](/guide/storefront-next) for ongoing CLI and assistant workflows.

<span id="bootstrap-a-new-project"></span>

## Explore a Project Locally

To explore the template locally, use `npx` from outside an existing project:

```bash
npx @salesforce/b2c-cli sfnext create-storefront
```

This creates local project files; it does not provision the storefront's B2C Commerce and MRT resources. See [Explore Storefront Next Code Locally](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-quick-start-create-sf.html) for the local workflow.

## In-Project Commands

Once you have a project, the scaffolded `package.json` includes scripts that wrap the most common Storefront Next operations. Run them with your package manager:

```bash
pnpm run dev               # start the local dev server
pnpm run cartridge:generate
pnpm run cartridge:deploy
pnpm run config:inspect
```

For building and uploading bundles, use the template's `push` script and follow the [Storefront Next deployment guide](https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-push-mrt-auto.html).

You can also invoke development commands directly:

```bash
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
