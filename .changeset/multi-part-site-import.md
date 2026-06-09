---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
---

`b2c job import` now supports `--split` for importing directories larger than the instance archive size limit. With `--split` (and optional `--max-size`, default `190mb`), the import is broken into several smaller archives: order-sensitive metadata/XML is imported first — kept together when it fits, otherwise split at data-unit boundaries in dependency order — followed by static assets packed by compressed size. A normal import that exceeds the limit now warns and recommends `--split`.

Example: `b2c job import ./big-site-data --split --max-size 150mb`

The SDK adds a corresponding `siteArchiveImportSplit()` operation.
