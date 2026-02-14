---
description: Configure IDE tooling like Prophet VS Code extension to consume resolved B2C CLI configuration via a generated dw.js bridge script.
---

# IDE Integration

This guide explains how to connect IDE extensions to your B2C CLI configuration.

## Prophet VS Code Extension

[Prophet](https://marketplace.visualstudio.com/items?itemName=SqrTT.prophet) can load `dw.json`-compatible configuration by executing a local `dw.js` script in your working directory.

### Why Use `dw.js` with B2C CLI

Using `dw.js` lets Prophet consume the same resolved configuration used by `b2c` commands, including values resolved from:

- `dw.json`
- environment variables and `.env`
- active instance selection
- configuration plugins registered with the CLI

The script resolves configuration at runtime by running:

```bash
b2c setup inspect --json --unmask
```

Then it maps the resolved config into Prophet-friendly `dw.json`-style keys.

If `setup inspect` cannot be executed in the extension runtime, the script falls back to loading `dw.json` from `SFCC_CONFIG` or the `dw.js` directory.

### Generate `dw.js` Automatically (Recommended)

```bash
# Generate ./dw.js
b2c setup ide prophet

# Overwrite an existing file
b2c setup ide prophet --force

# Write to a custom location
b2c setup ide prophet --output .vscode/dw.js
```

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
    var workingDirectory = process.env.SFCC_WORKING_DIRECTORY || __dirname || process.cwd();
    var stdout = childProcess.execFileSync(
      'b2c',
      ['setup', 'inspect', '--json', '--unmask', '--working-directory', workingDirectory],
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
- Dynamic cartridge path discovery can be layered on later. For now, `cartridgesPath` is passed through when available.
- When inspect/fallback resolution fails, the script logs diagnostic messages to both stdout and stderr and exports `{}`.
- The generated script resolves the project root from `SFCC_WORKING_DIRECTORY`, `SFCC_CONFIG`, or the script directory (`__dirname`) before falling back to `process.cwd()`.
