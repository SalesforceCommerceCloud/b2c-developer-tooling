---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add `b2c setup set`, `get`, and `unset` to change one configuration value, for example `b2c setup set scapi-schemas=./scapi-schemas`. The value is written to the `dw.json` entry or project `.env` file that already supplies it, or else to the selected instance. Values are type-checked, and the command refuses to write to read-only sources. `get` masks secrets unless you pass `--unmask`.
