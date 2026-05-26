---
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Add Script API IntelliSense for cartridge JavaScript: `dw/*`, cartridge-style requires, and SFCC globals (`session`, `request`, `response`, `customer`, etc.) are typed automatically. The VS Code extension wires this up out of the box; for other editors, run `b2c setup ide tsserver-plugin` (LSP plugin) or `b2c setup ide vscode-types` (jsconfig). See the IDE Integration guide for details.
