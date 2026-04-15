---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Add `--wait` / `--no-wait` flag to `b2c job import` command. Import waits for completion by default (preserving existing behavior); use `--no-wait` to return immediately after the job starts. Also adds `--poll-interval` flag for controlling poll frequency.
