---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Add Script API IntelliSense for cartridge JavaScript. The B2C DX VS Code extension now ships TypeScript definitions for the full `dw/*` Script API and registers a TypeScript Server plugin that resolves them automatically inside detected cartridges — no `jsconfig.json` written into your repo. The plugin also resolves SFCC cartridge-style requires (`~/cartridge/...`, `*/cartridge/...`, and `<cartridgeName>/cartridge/...`) across the workspace cartridge path, ordered by the resolved `cartridges` value from `dw.json` / `SFCC_CARTRIDGES`. The cartridge tree view now mirrors that same order. For other IDEs (plain VS Code, WebStorm/IntelliJ, Neovim) run `b2c setup ide vscode-types` to vendor the same definitions and a `jsconfig.json` into your project. See the IDE Integration guide for details.
