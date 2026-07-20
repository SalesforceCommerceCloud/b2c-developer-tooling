---
'@salesforce/b2c-cli': patch
'b2c-vs-extension': patch
---

Security hardening for Script API IntelliSense against malicious repositories. The tsserver plugin now canonicalizes and contains every resolved `require()` path (including a cartridge `package.json` `main`) so a crafted import specifier or symlink in a cloned repo can no longer resolve to a file outside the bundled types directory or the cartridge roots, bounds the size of `dw.json`/`package.json` it parses, and the VS Code extension now declares that Script API IntelliSense requires a trusted workspace (`capabilities.untrustedWorkspaces`) and refuses to forward cartridge paths or run usage inference until the workspace is trusted.
