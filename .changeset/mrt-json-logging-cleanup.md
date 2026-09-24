---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

MRT commands now reliably suppress human-readable progress and status logging when `--json` is set, so diagnostic text never mixes with the machine-readable output. This also fixes `mrt env var push --json`, which previously printed progress lines to stdout alongside the JSON result.
