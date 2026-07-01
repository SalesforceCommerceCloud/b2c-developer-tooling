---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Improve "configuration required" errors and error telemetry:

- When a command needs instance/auth configuration but no source is found at all (no flags, environment variables, or dw.json), the error now points to the configuration guide (https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html) so first-time users know where to start. When a config source is present, the existing message (which lists the specific flag/env var to set) is unchanged.
- Command-error telemetry now tags each error with a category (`validation`, `guardrail`, or `runtime`) so expected user/config errors and safety-guard blocks can be separated from genuine runtime failures when measuring reliability.
- All telemetry events now include an `isCI` flag indicating whether they originated from a CI/automation environment, so automation traffic can be distinguished from interactive developer usage.
