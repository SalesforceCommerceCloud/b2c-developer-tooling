---
'b2c-vs-extension': minor
---

Enforce Safety Mode in the VS Code extension. Destructive operations initiated from the extension (sandbox delete/stop/restart, WebDAV writes, jobs, etc.) now honor `SFCC_SAFETY_LEVEL`, `SFCC_SAFETY_CONFIRM`, `SFCC_SAFETY_CONFIG`, and the per-instance `safety` block in `dw.json`, consistent with the CLI. Every extension command is also evaluated against command rules (e.g. `{ "command": "b2c-dx.sandbox.delete", "action": "block" }`), and confirmation-mode policies surface a native VS Code modal before the command runs.
