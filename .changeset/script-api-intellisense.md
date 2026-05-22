---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Add Script API IntelliSense for cartridge JavaScript. The B2C DX VS Code extension now ships TypeScript definitions for the full `dw/*` Script API and registers a TypeScript Server plugin that resolves them automatically inside detected cartridges — no `jsconfig.json` written into your repo. For other IDEs (plain VS Code, WebStorm/IntelliJ, Neovim) run `b2c setup ide vscode-types` to vendor the same definitions and a `jsconfig.json` into your project. See the IDE Integration guide for details.
