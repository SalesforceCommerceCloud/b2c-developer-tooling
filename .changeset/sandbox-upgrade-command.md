---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `b2c sandbox upgrade` (alias `b2c ods upgrade`) to trigger an on-demand sandbox upgrade to the latest supported platform version via `POST /sandboxes/{sandboxId}/operations` with `operation: upgrade`. Supports `--wait`, `--poll-interval`, and `--timeout` to block until the sandbox returns to `started`.
