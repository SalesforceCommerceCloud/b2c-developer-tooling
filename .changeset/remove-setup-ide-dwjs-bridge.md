---
'@salesforce/b2c-cli': minor
---

Remove the `b2c setup ide` third-party `dw.js` bridge subcommand and its documentation. The `setup ide` topic retains `vscode-types` (vendor Script API TypeScript definitions) and `tsserver-plugin` (print the TS Server plugin path for LSP editors). Users of the B2C DX VS Code extension need no setup; other editors can use `setup ide vscode-types` or `setup ide tsserver-plugin`.
