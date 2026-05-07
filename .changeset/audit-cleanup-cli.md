---
'@salesforce/b2c-cli': patch
---

CLI cleanup and correctness fixes:

- `b2c cip query`, `cip describe`, `cip tables`, and `cip report *` now stream output through oclif's `ux.stdout` instead of writing directly to `process.stdout`. This restores the `--json` flag and makes output capturable by tests and CI.
- Long-running commands (`code:watch`, `logs:tail`, `mrt:tail-logs`) now deregister their SIGINT/SIGTERM handlers when finished, so re-invocations no longer stack handlers on the same process.
- Hook and signal-handler errors that were previously swallowed (`job:run` afterOperation hooks, `logs:tail` stop, `setup:ide:prophet` console fallbacks) now log at debug instead of disappearing.
- AM list commands (`am clients|roles|users list`) share a single `amPageSizeFlag` definition.
- Removed deprecated `LocalSourceResult` re-export.
