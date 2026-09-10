---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `storefront` as an alias for `project` across the `mrt` command surface, matching the terminology of the SCAPI MRT API. `b2c mrt storefront <cmd>` now works identically to `b2c mrt project <cmd>` (including the `member` and `notification` subtopics), and `--storefront` is accepted anywhere `--project` is. The new `MRT_STOREFRONT` / `SFCC_MRT_STOREFRONT` environment variables act as fallbacks for `MRT_PROJECT` / `SFCC_MRT_PROJECT`.

This is purely additive — `project`, `--project` (`-p`), and the existing `MRT_PROJECT` variables continue to work unchanged, with no deprecation. `--storefront` is long-form only (the `-s` short flag is unchanged on `mrt bundle save` and `mrt project create`). No consumer action is required; adopt the `storefront` vocabulary at your convenience.

`mrt project get`, `update`, and `delete` now accept the project slug **either** as a positional argument **or** via `--project` / `--storefront` (also honoring `MRT_PROJECT` and `dw.json`), so they line up with the flag-based `mrt env` commands. An explicit positional still wins when both are given.
