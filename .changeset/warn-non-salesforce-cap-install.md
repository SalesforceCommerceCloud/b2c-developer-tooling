---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

`cap:install` now warns and prompts for confirmation before installing a Commerce App from a non-Salesforce provider. Use `--force` to skip the prompt (e.g. in CI or scripted installs); the prompt is also skipped automatically in `--json` mode.
