---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Hardened Script API IntelliSense against malicious repositories: the tsserver plugin keeps every resolved `require()` path (including a cartridge `package.json` `main`) inside the bundled types and the cartridge roots, and caps the size of the `dw.json`/`package.json` files it reads. The VS Code extension now runs only in trusted workspaces; trust the workspace to use it.
