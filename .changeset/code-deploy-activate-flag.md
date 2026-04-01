---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Add `--activate` flag to `code deploy` for activating a code version after deploy without the toggle behavior of `--reload`. Both `--activate` and `--reload` now error on failure instead of silently continuing.
