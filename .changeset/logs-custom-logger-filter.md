---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
'@salesforce/b2c-dx-mcp': patch
---

Log `--filter` (and the MCP `prefixes` option) now also matches the start of the file name, so `--filter custom-MyIntegration-CustomApi` selects a custom logger whose name contains a dash. When `b2c logs get` finds no entries, it lists the `custom-*` logs that the filter skipped, and `--help` explains that `--filter` replaces the default `error,customerror`.
