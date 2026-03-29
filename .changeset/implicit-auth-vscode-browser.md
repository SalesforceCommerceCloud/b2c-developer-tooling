---
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': patch
---

Add `openBrowser` and `redirectUri` options to OAuth strategy creation, allowing callers to customize how the browser is opened and which redirect URI is used during implicit auth. The VS Code extension now uses `vscode.env.openExternal` and `vscode.env.asExternalUri` so implicit OAuth works in Codespaces and other remote environments.
