---
'@salesforce/b2c-tooling-sdk': patch
'b2c-vs-extension': patch
---

Fix sandbox creation in the VS Code extension not granting default OCAPI/WebDAV permissions. New sandboxes created from the extension now grant the configured client ID the same default permissions as the CLI's `sandbox create`, so code deployment and job execution work without manual permission setup. The shared defaults are now provided by the SDK via `buildSandboxSettings`.
