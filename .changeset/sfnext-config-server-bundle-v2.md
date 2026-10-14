---
'@salesforce/b2c-tooling-sdk': patch
---

Fix `b2c mrt bundle deploy --v2` / `upload-v2` failing with `Files not found in bundle archive: ssr.js, ssr.mjs` when no SSR patterns are configured. The default `ssrOnly` is now detected from the build (`ssr.{js,mjs}` or `streamingHandler.{js,mjs}`, plus `loader.js`/`package.json` when present and `server/**/*` when a `server` directory exists) and a warning is logged when `config.server.*` exports no `ssrOnly`/`ssrShared`.
