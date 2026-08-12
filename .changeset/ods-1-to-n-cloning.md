---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': minor
---

Add support for creating multiple sandbox clones from a single source in one request (1 to many cloning).

- `b2c sandbox clone create` now accepts `--target-count <1-5>` to create a batch of clones sharing the same source, TTL, profile, and notification emails. `--wait` polls every clone in the batch until each reaches a terminal state.
- `b2c sandbox clone list` supports `--batch-id` to filter clones belonging to a specific batch.
- `b2c sandbox clone get` and the VS Code extension's clone details view now show the batch ID and sibling clone IDs when a clone was created as part of a batch.
- The VS Code extension's "Clone Sandbox" command prompts for the number of clones to create and reports aggregate progress across the batch.
