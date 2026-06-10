---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/mrt-utilities': patch
---

Hardens long-running operations and atomic config writes:

- dw.json mutations (`addInstance`, `removeInstance`, `setActiveInstance`) now go through a per-path async serializer and write via temp-file + rename, so concurrent CLI invocations within the same process can no longer interleave reads and writes.
- The session file written by stateful auth removes an exists-then-mkdir TOCTOU and cleans up orphan tmp files on rename failure.
- Cartridge deploy/download progress intervals are wrapped in a `withProgress` helper that always tears down on exception.
- `b2c jobs run` no longer silently treats a body-read failure as "not the JobAlreadyRunning case" during 400 detection.
- MRT proxy `onError` no longer crashes when upstream begins streaming before erroring (`headersSent` guard).
- Sandbox CLI commands now route output through `this.log` so `--json` mode and test output silencing work as documented; a lint rule prevents regression.
- Shared ANSI palette consolidated in `@salesforce/b2c-tooling-sdk/cli` (now also exporting standalone `RED`/`GREEN`/`YELLOW`/`CYAN`/`MAGENTA`/`GRAY`); the script-debugger REPL and the `cap pull`/`cap tasks` commands consume it instead of redefining literal-ESC palettes.
- HTTP error paths in `code:deploy`, `code:download`, and OAuth client_credentials no longer lose the underlying status when `response.text()` itself rejects mid-body.
- MRT bundle `loadServerConfig` now surfaces real errors from `config.server.js` instead of silently falling back to defaults; scaffold registry surfaces a warning for non-ENOENT manifest read errors instead of dropping them silently.
- Six newly-added ecdn detail commands (`firewall:get/create/update`, `rate-limit:get/create/update`) use the SDK's `printFieldsBlock` helper, matching the `bm`/`am` detail commands.
