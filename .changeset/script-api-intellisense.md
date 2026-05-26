---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Add Script API IntelliSense for cartridge JavaScript. The B2C DX VS Code extension now ships `dw/*` TypeScript definitions and a TS Server plugin that resolves cartridge-style requires (`~/`, `*/`, `<cartridgeName>/`) matching runtime semantics, ordered by `dw.json`'s `cartridges` field. The SFRA `modules` cartridge is also recognized — bare requires like `require('server')` resolve against the `modules/` tree. For LSP-based editors run `b2c setup ide tsserver-plugin` and wire the printed path into your editor's `init_options.plugins[]` — the plugin auto-discovers cartridges from `.project` files. For plain `tsconfig.json` setups, `b2c setup ide vscode-types` still vendors a `dw/*`-only `jsconfig.json`. See the IDE Integration guide for details.
