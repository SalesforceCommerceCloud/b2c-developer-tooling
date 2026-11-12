---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add `--[no-]delete-mrt-env`, `--[no-]delete-am-slas-clients`, and `--[no-]delete-ecdn-routing` to `b2c mrt project delete` (SCAPI backend only). All three default to `true`, so the storefront and every downstream resource are deleted — matching prior behavior. Pass the `--no-...` form of a flag to preserve that downstream resource after the storefront record is removed. On the legacy backend the new flags are ignored with a warning (legacy MRT only supports full teardown).
