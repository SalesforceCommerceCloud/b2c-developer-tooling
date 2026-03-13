---
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-cli': patch
---

Add MRT environment variable support to EnvSource (`MRT_API_KEY`, `MRT_PROJECT`, `MRT_ENVIRONMENT`, `MRT_CLOUD_ORIGIN` and their `SFCC_MRT_*` variants). The `setup inspect` command now shows values from SFCC_* environment variables as a config source.
