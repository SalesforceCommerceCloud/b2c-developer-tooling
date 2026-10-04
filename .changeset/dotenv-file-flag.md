---
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'@salesforce/b2c-dx-mcp': minor
---

Added `--dotenv-file` / `SFCC_DOTENV_FILE` to use another env file (such as `.env.staging`) instead of `.env`. An empty `--dotenv-file ""` or `--config ""` now means no env file or no `dw.json`. With `--project-directory`, the `.env` is now read from that directory instead of the current one.
