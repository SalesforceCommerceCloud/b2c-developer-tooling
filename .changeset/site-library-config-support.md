---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'b2c-vs-extension': minor
---

The `libraries` config field now accepts `{id, siteLibrary?}` objects in addition to bare strings (mixed forms allowed in the same array). This lets you mark site-private libraries in `dw.json` or `package.json` so `b2c content list` / `content export` can default `--site-library` based on which library you target, and the VS Code Content Libraries tree auto-loads every configured library on activation. To upgrade, optionally replace `"libraries": ["RefArchSharedLibrary"]` with `"libraries": ["RefArchSharedLibrary", {"id": "SiteGenesis", "siteLibrary": true}]`. The existing string-only form continues to work unchanged. Also adds `libraries`, `assetQuery`, and `realm` to the documented `package.json` allowed fields list (already supported in code).
