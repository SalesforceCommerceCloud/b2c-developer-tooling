---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-docs': patch
---

Add `--wait` flag to `mrt bundle deploy` to poll until deployment completes, and align all SDK wait functions (`waitForJob`, `waitForEnv`) to a consistent pattern with structured `onPoll` callbacks, seconds-based options, and injectable `sleep` for testing.
