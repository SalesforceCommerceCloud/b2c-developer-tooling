---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Deprecate `b2c mrt bundle upload-v2`: it now prints a warning and behaves exactly like `b2c mrt bundle deploy --v2` (same flags, `--mrt-backend` routing, config resolution and output; it also deploys when an environment is provided). `b2c mrt bundle deploy` gains `--dependencies` and `--cc-override` for v2 uploads, so nothing from `upload-v2` is lost — switch scripts to `b2c mrt bundle deploy --v2`.
