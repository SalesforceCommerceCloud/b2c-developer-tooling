---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-agent-plugins': patch
'b2c-vs-extension': minor
---

Add sandbox upgrade support: the CLI gains `b2c sandbox upgrade` (alias `b2c ods upgrade`) and the VS Code extension gains a corresponding "Upgrade Sandbox" context-menu action, both targeting `POST /sandboxes/{sandboxId}/operations` with `operation: upgrade` to move the sandbox to the latest supported platform version. The CLI command supports `--wait`, `--poll-interval`, and `--timeout` to block until the sandbox returns to `started`.
