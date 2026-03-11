---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add `--wait` flag to `sandbox clone create` command to poll until the clone completes, matching the behavior of `sandbox create --wait`. Also fixes the status check hint to display the correct command name instead of a raw template string.
