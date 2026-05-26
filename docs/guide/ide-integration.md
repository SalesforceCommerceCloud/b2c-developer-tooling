---
description: Configure IDE tooling like Prophet VS Code extension and IntelliJ SFCC plugin to consume resolved B2C CLI configuration, plus enable Script API IntelliSense via TypeScript definitions.
---

# IDE Integration

This guide explains how to connect third-party IDE extensions (Prophet, IntelliJ SFCC) to your B2C CLI configuration, and how to enable Script API IntelliSense in any IDE.

> Looking for the **Salesforce-published B2C DX VS Code Extension**? See the dedicated [VS Code Extension](../vscode-extension/) section — it consumes `dw.json` and the active instance directly, no bridge script required.

## Script API IntelliSense

Get autocomplete and inline documentation on `require('dw/catalog/ProductMgr')`, hover docs from JSDoc, signature help, and member completion in cartridge JavaScript files. The B2C tooling ships TypeScript definitions for the Script API (currently version 26.7) covering all `dw/*` modules, top-level globals (`request`, `customer`, `session`), and the `ICustomAttributes` extension hook.

There are three setup paths depending on your IDE:

### B2C DX VS Code Extension (recommended)

If you have the B2C DX VS Code extension installed, IntelliSense is automatic:

- No configuration files are written into your repository.
- The extension registers a TypeScript Server plugin that resolves `dw/*` modules transparently for any file inside a detected cartridge (folders containing a `.project` file alongside a `cartridge/` directory).
- Files outside your cartridges are unaffected.

You can disable the feature with the `b2c-dx.features.scriptTypes` setting (default: `true`).

The plugin also resolves SFCC cartridge-style requires, matching runtime semantics:

- `require('~/cartridge/scripts/foo')` — resolves only within the cartridge that contains the current file (the SFCC `~` shortcut for "current cartridge"). If `foo` doesn't exist there, IntelliSense reports it unresolved — same as runtime.
- `require('*/cartridge/scripts/foo')` — walks the cartridge path with owner-first override priority (SFRA-style override).
- `require('app_storefront_base/cartridge/scripts/foo')` — resolves only within the named cartridge.

Cartridge resolution order matches your runtime cartridge path: the `cartridges` field from your resolved configuration (`dw.json`, `SFCC_CARTRIDGES`, `.env`, etc.) wins. When that's not set, cartridges fall back to discovery order with known base cartridges (`app_storefront_base`, `modules`) sorted last. The same ordering also drives the **B2C-DX → Cartridges** tree view.

### Standalone VS Code, WebStorm, or IntelliJ Ultimate

For IDEs without the extension, run the following from your project root to vendor the type bundle and a `jsconfig.json`:

```bash
b2c setup ide vscode-types
```

This creates two artifacts at the repo root:

- `./.b2c-script-types/types/` — vendored copy of the Script API definitions.
- `./jsconfig.json` — TypeScript Language Service configuration mapping `dw/*` to the vendored types.

You can commit both into your repository if you want everyone on the team to share the same setup. To re-vendor after upgrading the CLI, re-run with `--force`. The `jsconfig.json` lives at the repo root by design — the `paths` mappings inside it are repo-root-relative and will not resolve correctly from a subdirectory.

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

**Option A — vendored `jsconfig.json` (dw/* only).** Run `b2c setup ide vscode-types` at the repo root and your LSP picks it up on next start. Provides only `dw/*` resolution; cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`) are not handled because TypeScript `paths` mappings can't express multi-cartridge lookups.

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

### Notes

- The bundle is version-locked to a Script API release (currently 26.7). Re-run `b2c setup ide vscode-types --force` after upgrading the CLI to refresh the vendored copy. The plugin path returned by `b2c setup ide tsserver-plugin` always points at the bundle shipped with your installed CLI.
- The vendored `jsconfig.json` only configures `dw/*` IntelliSense. Cartridge-relative requires (`~/cartridge/...`, `*/cartridge/...`, `cartridgeName/cartridge/...`) cannot be expressed in standalone TypeScript `paths` mappings (TypeScript allows at most one `*` per pattern), so they will appear unresolved without the B2C DX VS Code extension or another host that loads `@salesforce/b2c-script-types/plugin` via LSP.

## Prophet VS Code Extension

[Prophet](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) can load `dw.json`-compatible configuration by executing a local `dw.js` script in your project directory.

### Benefits

The generated `dw.js` bridge lets Prophet automatically consume the same resolved configuration used by `b2c` commands — including `dw.json`, environment variables, `.env` files, active instance selection, and configuration plugins. No manual syncing required.

### Setup

```bash
# Generate ./dw.js in your project root
b2c setup ide prophet

# Overwrite an existing file
b2c setup ide prophet --force

# Write to a custom location
b2c setup ide prophet --output .vscode/dw.js
```

### Switching Active Instances

Prophet evaluates `dw.js` when VS Code starts. If you switch the active instance with `b2c setup instance set-active`, you need to reload the VS Code window for Prophet to pick up the new configuration:

1. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **Developer: Reload Window**

### Manual `dw.js` Example

If you want to author the file yourself, match the same pattern as the generated script:

```js
var childProcess = require('node:child_process');
var path = require('node:path');
var dwJson = {};

function toProphetConfig(config) {
  if (!config || typeof config !== 'object') return {};
  var codeVersion = config['code-version'] || config.codeVersion || config.version;
  return {
    hostname: config.hostname || config.server,
    username: config.username,
    password: config.password,
    'code-version': codeVersion,
    version: codeVersion,
    cartridgesPath: config.cartridgesPath,
    siteID: config.siteID || config.siteId,
    storefrontPassword: config.storefrontPassword,
  };
}

function loadDwConfig() {
  try {
    var projectDirectory = process.env.SFCC_PROJECT_DIRECTORY || process.env.SFCC_WORKING_DIRECTORY || __dirname || process.cwd();
    var stdout = childProcess.execFileSync(
      'b2c',
      ['setup', 'inspect', '--json', '--unmask', '--project-directory', projectDirectory],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: projectDirectory,
      },
    );

    var parsed = JSON.parse(stdout);
    var root = parsed && parsed.result && typeof parsed.result === 'object' ? parsed.result : parsed;
    var resolved = root && root.config && typeof root.config === 'object' ? root.config : root;
    dwJson = toProphetConfig(resolved);
  } catch (inspectError) {
    try {
      var dwJsonPath = process.env.SFCC_CONFIG || path.join(__dirname || process.cwd(), 'dw.json');
      var fallback = require(dwJsonPath);
      dwJson = toProphetConfig(fallback);
    } catch (fallbackError) {
      dwJson = {};
    }
  }

  return dwJson;
}

dwJson = loadDwConfig();
module.exports = dwJson;
```

### Fields Written by `setup ide prophet`

The generated script maps common CLI fields:

- `hostname`
- `username`
- `password`
- `code-version`

It also passes through Prophet-specific fields when available:

- `cartridgesPath`
- `siteID` (or `siteId`)
- `storefrontPassword`

### Notes

- The generated script uses `--unmask` at runtime, so secrets are exposed to Prophet as needed for connection.
- You can regenerate the file any time with `b2c setup ide prophet --force`.
- If the CLI cannot be executed in the extension runtime, the script falls back to loading `dw.json` directly.

## IntelliJ SFCC Plugin

The [IntelliJ SFCC plugin](https://plugins.jetbrains.com/plugin/13668-salesforce-b2c-commerce-sfcc-) manages its own connection settings in `.idea/misc.xml`. A community B2C CLI plugin lets you share that configuration with the CLI so both tools stay in sync.

### Setup

Install the [b2c-plugin-intellij-sfcc-config](https://github.com/sfcc-solutions-share/b2c-plugin-intellij-sfcc-config) plugin:

```bash
b2c plugins install sfcc-solutions-share/b2c-plugin-intellij-sfcc-config
```

Once installed, run CLI commands from your IntelliJ project directory and the plugin will automatically load connection settings from `.idea/misc.xml`.

See the [3rd Party Plugins](./third-party-plugins#intellij-sfcc-config-plugin) guide for full details on environment variables, credential decryption, and instance selection.
