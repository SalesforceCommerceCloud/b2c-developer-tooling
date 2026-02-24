---
description: Configure IDE tooling like Prophet VS Code extension and IntelliJ SFCC plugin to consume resolved B2C CLI configuration.
---

# IDE Integration

This guide explains how to connect IDE extensions to your B2C CLI configuration.

## Prophet VS Code Extension

[Prophet](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) can load `dw.json`-compatible configuration by executing a local `dw.js` script in your working directory.

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
    var workingDirectory = process.env.SFCC_PROJECT_DIRECTORY || process.env.SFCC_WORKING_DIRECTORY || __dirname || process.cwd();
    var stdout = childProcess.execFileSync(
      'b2c',
      ['setup', 'inspect', '--json', '--unmask', '--project-directory', workingDirectory],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: workingDirectory,
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
