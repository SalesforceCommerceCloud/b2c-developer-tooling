---
description: Configure IDE tooling like the IntelliJ SFCC plugin to consume resolved B2C CLI configuration, plus enable Script API IntelliSense via TypeScript definitions.
---

# IDE Integration

This guide explains how to connect third-party IDE tooling (such as the IntelliJ SFCC plugin) to your B2C CLI configuration, and how to enable Script API IntelliSense in any IDE.

> Looking for the **Salesforce B2C Commerce VS Code Extension**? See the dedicated [VS Code Extension](../vscode-extension/) section — it consumes `dw.json` and the active instance directly, no bridge script required.

## Script API IntelliSense

Get autocomplete and inline documentation on `require('dw/catalog/ProductMgr')`, hover docs from JSDoc, signature help, and member completion in cartridge JavaScript files. The B2C tooling ships TypeScript definitions for the Script API (currently version 26.7) covering all `dw/*` modules, top-level globals (`request`, `customer`, `session`), and the `ICustomAttributes` extension hook.

There are three setup paths depending on your IDE:

### Salesforce B2C Commerce VS Code Extension (recommended)

If you have the Salesforce B2C Commerce VS Code extension installed, IntelliSense is automatic:

- No configuration files are written into your repository.
- The extension registers a TypeScript Server plugin that resolves `dw/*` modules transparently for any file inside a detected cartridge (folders containing a `.project` file alongside a `cartridge/` directory).
- Files outside your cartridges are unaffected.

You can disable the feature with the `b2c-dx.features.scriptTypes` setting (default: `true`).

The plugin also resolves SFCC cartridge-style requires, matching runtime semantics:

- `require('~/cartridge/scripts/foo')` — resolves only within the cartridge that contains the current file (the SFCC `~` shortcut for "current cartridge"). If `foo` doesn't exist there, IntelliSense reports it unresolved — same as runtime.
- `require('*/cartridge/scripts/foo')` — walks the cartridge path with owner-first override priority (SFRA-style override).
- `require('app_storefront_base/cartridge/scripts/foo')` — resolves only within the named cartridge.
- `require('server')`, `require('server/middleware')`, etc. — bare requires resolve against the SFRA `modules` cartridge if present (its tree is exposed at the root, not under `cartridge/scripts/`). When a `modules` cartridge is detected, the plugin also injects ambient type declarations for the SFRA `server` API (Server, Route, Request, Response, middleware, forms, querystring) so cartridge code type-checks under `checkJs: true` despite the dynamic property assignments in `modules/server.js` that TypeScript can't infer on its own.

Cartridge resolution order matches your runtime cartridge path: the `cartridges` field from your resolved configuration (`dw.json`, `SFCC_CARTRIDGES`, `.env`, etc.) wins. When that's not set, cartridges fall back to discovery order with known base cartridges (`app_storefront_base`, `modules`) sorted last. The same ordering also drives the extension's **Cartridges** tree view.

### Standalone VS Code, WebStorm, or IntelliJ Ultimate

For IDEs without the extension, run the following from your project root to vendor the type bundle and a `jsconfig.json`:

```bash
b2c setup ide vscode-types
```

This creates two artifacts at the repo root:

- `./.b2c-script-types/types/` — vendored copy of the Script API definitions.
- `./jsconfig.json` — TypeScript Language Service configuration mapping `dw/*` to the vendored types.

You can commit both into your repository if you want everyone on the team to share the same setup. To re-vendor after upgrading the CLI, re-run the command with `--force` to overwrite the existing files. The vendored types are refreshed automatically because the `--copy` flag defaults to true. The `jsconfig.json` lives at the repo root by design — the `paths` mappings inside it are repo-root-relative and will not resolve correctly from a subdirectory.

The generated `jsconfig.json` looks like this — feel free to author it yourself if you prefer:

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "dw/*": ["./.b2c-script-types/types/dw/*"]
    },
    "types": []
  },
  "include": [".b2c-script-types/types/global.d.ts", "**/cartridge/**/*.js"],
  "exclude": ["**/cartridge/static/**", "**/node_modules/**"]
}
```

### Neovim, Helix, Zed, Sublime, or other LSP-based editors

Modern editors that drive `tsserver` through the Language Server Protocol have two ways to wire up Script API IntelliSense:

**Option A — vendored `jsconfig.json` (dw/\* only).** Run `b2c setup ide vscode-types` at the repo root and your LSP picks it up on next start. Provides only `dw/*` resolution; cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`) are not handled because TypeScript `paths` mappings can't express multi-cartridge lookups.

**Option B — load the bundled TS Server plugin (full feature parity with the VS Code extension).** Configure your LSP client to load `@salesforce/b2c-script-types` as a TypeScript Server plugin via `init_options`. The plugin auto-discovers cartridges by walking the project for `.project` files, and honors `dw.json`'s `cartridges` field for ordering — no separate vendoring step.

Resolve the plugin location via the CLI:

```bash
b2c setup ide tsserver-plugin --json
# {"pluginName":"@salesforce/b2c-script-types","pluginPath":"/usr/lib/.../dist/script-types","typesPath":"...","version":"26.7.0"}
```

The recommended language servers and what to install:

- **Neovim** with [`nvim-lspconfig`](https://github.com/neovim/nvim-lspconfig) — use the `ts_ls` server (formerly `tsserver`), backed by the `typescript-language-server` npm package. Older `coc-tsserver` setups also work. The [nvim-sfcc](https://github.com/clavery/nvim-sfcc) plugin wraps the wiring below.
- **Helix** — bundles `typescript-language-server`; nothing to wire up beyond installing the package globally (`npm i -g typescript-language-server typescript`).
- **Zed** — ships TypeScript support out of the box; no extra configuration.
- **Sublime Text** — install `LSP` and `LSP-typescript` from Package Control.

A minimal Neovim 0.10+ snippet using `nvim-lspconfig` and the TS Server plugin:

```lua
local function b2c_plugin_path()
  local out = vim.fn.system({ 'b2c', 'setup', 'ide', 'tsserver-plugin', '--json' })
  return (vim.fn.json_decode(out) or {}).pluginPath
end

require('lspconfig').ts_ls.setup({
  root_dir = require('lspconfig.util').root_pattern('jsconfig.json', 'tsconfig.json', '.project', '.git'),
  filetypes = { 'javascript', 'javascriptreact', 'typescript', 'typescriptreact' },
  init_options = {
    plugins = {
      { name = '@salesforce/b2c-script-types', location = b2c_plugin_path() },
    },
  },
})
```

If your editor's LSP client is launched outside the repo root (for example, opening a single cartridge subdirectory), point it at the project root so the plugin's auto-discovery walks the right tree.

### Inferring types for undocumented helpers (experimental)

JSDoc-documented functions get full hover/completion support because TypeScript reads the `@param`/`@returns` annotations directly. Plain, undocumented helper functions don't — an unannotated parameter or return value gets widened to `any`, and that `any` propagates to every caller, silencing completion for anything built on top of it.

Enable the `b2c-dx.features.scriptTypesInferUsage` setting (default: `false`) or pass `inferUsage: true` in the plugin config (`init_options.plugins` for other LSP hosts) to have the plugin infer a plausible type for these cases from how the value is actually used elsewhere in the project — call-site arguments for parameters, return statements for return values — chasing through undocumented call chains (a helper calling a helper calling a helper), multi-hop method chains (`product.getPriceModel().getPrice()`), and intermediate local variables (`var priceModel = product.getPriceModel(); return priceModel.getPrice();`) rather than stopping at the first `any`.

`module.superModule` is understood too: in an overlay cartridge that extends a base module (`var base = module.superModule;`), hover and completions on `base` and on values derived from it resolve against the same-path module in the next cartridge down the cartridge path — including recursing into the base module's own undocumented helpers.

Cross-file inference (call sites in other files, `module.superModule`) needs those files in the same TypeScript project. A `jsconfig.json` that includes all cartridge sources — like the one `b2c setup ide vscode-types` generates — provides that; without one, each open file gets its own inferred project and only same-file usage is visible.

Inferred results are heuristic and clearly labeled:

- Hover text gets an appended `Inferred from usage: <type>` line.
- Member completions synthesized this way are still offered alongside (not instead of) whatever TypeScript already resolved.

This won't recover types TypeScript genuinely can't infer — for example, values that are never called with a consistent, well-typed argument anywhere in the project — and it's off by default because it's new and heuristic.

### Notes

- The bundle is version-locked to a Script API release (currently 26.7). Re-run `b2c setup ide vscode-types` after upgrading the CLI to refresh the vendored copy; use `--force` to overwrite existing files if they were previously created. The plugin path returned by `b2c setup ide tsserver-plugin` always points at the bundle shipped with your installed CLI.
- The vendored `jsconfig.json` only configures `dw/*` IntelliSense. Cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`, `cartridgeName/cartridge/...`) cannot be expressed in standalone TypeScript `paths` mappings (TypeScript allows at most one `*` per pattern), so they will appear unresolved without the Salesforce B2C Commerce VS Code extension or another host that loads `@salesforce/b2c-script-types/plugin` via LSP.

## IntelliJ SFCC Plugin

The [IntelliJ SFCC plugin](https://plugins.jetbrains.com/plugin/13668-salesforce-b2c-commerce-sfcc-) manages its own connection settings in `.idea/misc.xml`. A community B2C CLI plugin lets you share that configuration with the CLI so both tools stay in sync.

### Setup

Install the [b2c-plugin-intellij-sfcc-config](https://github.com/sfcc-solutions-share/b2c-plugin-intellij-sfcc-config) plugin:

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

Once installed, run CLI commands from your IntelliJ project directory and the plugin will automatically load connection settings from `.idea/misc.xml`.

See the [3rd Party Plugins](./third-party-plugins#intellij-sfcc-config-plugin) guide for full details on environment variables, credential decryption, and instance selection.
