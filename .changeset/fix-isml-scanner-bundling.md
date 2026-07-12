---
'b2c-vs-extension': patch
---

Fix the VS Code extension failing to activate when ISML support is enabled. The `src/isml/scanner.ts` module loaded `vscode-html-languageservice` via runtime `require()` calls that esbuild left unbundled. Because the VSIX is packaged with `vsce --no-dependencies`, the deep submodule paths could not be resolved at runtime and activation crashed silently — no "B2C DX" output channel, no instance selector, no commands. Switched to direct ESM imports so esbuild inlines the scanner code into the bundle.
