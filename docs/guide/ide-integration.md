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

The plugin also resolves SFCC cartridge-style requires across your workspace's cartridge path:

- `require('~/cartridge/scripts/foo')` — searches every cartridge in priority order, with the cartridge owning the current file checked first (SFRA-style override).
- `require('*/cartridge/scripts/foo')` — equivalent to `~/`; resolves against the same cartridge path.
- `require('app_storefront_base/cartridge/scripts/foo')` — resolves only within the named cartridge.

Cartridge resolution order matches your runtime cartridge path: the `cartridges` field from your resolved configuration (`dw.json`, `SFCC_CARTRIDGES`, `.env`, etc.) wins. When that's not set, cartridges fall back to discovery order with known base cartridges (`app_storefront_base`, `modules`) sorted last. The same ordering also drives the **B2C-DX → Cartridges** tree view.

### Standalone VS Code, WebStorm, or IntelliJ Ultimate

For IDEs without the extension, run the following from your project root to vendor the type bundle and a `jsconfig.json`:

```bash
b2c setup ide vscode-types
```

This creates:

- `./.b2c-script-types/types/` — vendored copy of the Script API definitions.
- `./jsconfig.json` — TypeScript Language Service configuration mapping `dw/*` to the vendored types.

You can commit both into your repository if you want everyone on the team to share the same setup. To re-vendor after upgrading the CLI, re-run with `--force`.

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
      "dw/*": ["./.b2c-script-types/types/dw/*"],
      "~/cartridge/*": ["./cartridges/*/cartridge/*"],
      "*/cartridge/scripts/*": ["./cartridges/*/cartridge/scripts/*"]
    },
    "types": []
  },
  "include": [".b2c-script-types/types/global.d.ts", "**/cartridge/**/*.js"],
  "exclude": ["**/cartridge/static/**", "**/node_modules/**"]
}
```

### Neovim, Helix, Sublime, or other LSPs

Any editor that wraps `tsserver` (e.g., `coc-tsserver`, `typescript-language-server`) honors `jsconfig.json`. Use the same `b2c setup ide vscode-types` command above; the LSP will pick it up automatically.

### Notes

- The bundle is version-locked to a Script API release (currently 26.7). Re-run `b2c setup ide vscode-types --force` after upgrading the CLI to refresh.

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
