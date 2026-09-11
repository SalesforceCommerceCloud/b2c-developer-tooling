---
'@salesforce/b2c-cli': major
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

Add `storefront` as an alias for `project` across the `mrt` command surface, matching the terminology of the SCAPI MRT API. `b2c mrt storefront <cmd>` now works identically to `b2c mrt project <cmd>` (including the `member` and `notification` subtopics), and `--storefront` / `-s` are accepted anywhere `--project` / `-p` is. The new `MRT_STOREFRONT` / `SFCC_MRT_STOREFRONT` environment variables act as fallbacks for `MRT_PROJECT` / `SFCC_MRT_PROJECT`. The `project` / `--project` (`-p`) forms and the existing `MRT_PROJECT` variables continue to work unchanged.

`-s` now uniformly means `--project` / `--storefront` on **every** `mrt` command. To make that consistent, two commands changed their own short flags (**breaking**):

- `mrt project create` no longer has a `--slug` flag. Set the new project's slug with `--project` / `--storefront` (`-p` / `-s`) instead — e.g. `b2c mrt project create "My Storefront" -o my-org -s my-storefront`. When omitted, MRT auto-generates the slug from the name (unchanged). **Update any scripts using `--slug`.**
- `mrt bundle save` moved `--save-dir` from `-s` to `-d`, freeing `-s` for the storefront alias. **Update any scripts using `-s` for the save directory** (the long form `--save-dir` is unchanged).

`mrt project get`, `update`, and `delete` accept the project slug **either** as a positional argument **or** via `--project` / `--storefront` (`-p` / `-s`; also honoring `MRT_PROJECT` and `dw.json`). Symmetrically, `mrt env create` and `mrt env delete` now accept the environment slug **either** as a positional argument **or** via `--environment` / `-e` (also honoring `MRT_ENVIRONMENT` and `dw.json`). An explicit positional still wins when both are given.
