---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Deprecate `b2c mrt bundle upload-v2`: it now prints a warning and shares `b2c mrt bundle deploy --v2`'s flags, `--mrt-backend` routing and config resolution, while staying upload-only (an environment is ignored) and keeping its `--json` result shape. `b2c mrt bundle deploy` gains `--dependencies` and `--cc-override` for v2 uploads, so nothing from `upload-v2` is lost — switch scripts to `b2c mrt bundle deploy --v2`.
