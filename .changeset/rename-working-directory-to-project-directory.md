---
'@salesforce/b2c-cli': minor
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-dx-mcp': patch
---

Rename `--working-directory` flag to `--project-directory` (`-d`). The old flag name `--working-directory` is still accepted as an alias. Primary env var is now `SFCC_PROJECT_DIRECTORY`; `SFCC_WORKING_DIRECTORY` continues to work as a deprecated fallback.
