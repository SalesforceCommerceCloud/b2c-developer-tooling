---
'@salesforce/b2c-cli': patch
---

Fix the npm publish failing during `prepack`. `oclif manifest` defaults to `--jit`, which downloads each JIT plugin and reads its `oclif.manifest.json`; the `@salesforce/storefront-next-dev` JIT plugin does not ship that file, so manifest generation aborted and the CLI failed to publish. The prepack now runs `oclif manifest --no-jit`.
