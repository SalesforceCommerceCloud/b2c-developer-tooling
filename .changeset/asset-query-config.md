---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'b2c-vs-extension': minor
---

Support `assetQuery` as a first-class config field. Set it in `dw.json` (per-instance), in `package.json` under `b2c`, or via `SFCC_ASSET_QUERY` to control which JSON dot-paths are extracted as assets during content library parsing. The VS Code Content Libraries tree and `b2c content export` both honor it automatically; the `--asset-query` flag still wins when provided, and the fallback remains `["image.path"]`.
