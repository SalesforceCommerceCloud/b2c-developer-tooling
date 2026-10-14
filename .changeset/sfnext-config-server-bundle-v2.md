---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
---

`b2c mrt bundle deploy`/`save` and `createBundle`/`createBundleV2` no longer guess default `ssrOnly`/`ssrShared` patterns (which produced `Files not found in bundle archive: ssr.js, ssr.mjs` for streaming builds). Both lists must now come from the build's `.mrt/config.json` (now also read for v1 uploads), `config.server.*`, or `--ssr-only`/`--ssr-shared` (`--ssr-shared '[]'` for none); otherwise the command fails with an error naming the missing list. The `DEFAULT_SSR_ONLY`/`DEFAULT_SSR_SHARED` exports are removed.
