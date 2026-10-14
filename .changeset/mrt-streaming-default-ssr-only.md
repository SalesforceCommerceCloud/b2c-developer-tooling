---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Fix streaming bundle uploads failing with `Files not found in bundle archive: ssr.mjs, ssr.js`: when no `--ssr-only`/server config is provided, the default SSR list now lists only the `streamingHandler.{js,mjs}` entry point that exists when the build has a streaming handler and no `ssr.*` entry point. Pass `--ssr-only` to override.
