---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
'@salesforce/b2c-dx-mcp': patch
---

Rename `--working-directory` flag to `--project-directory`. The old flag name `--working-directory` is still accepted as an alias. Primary env var is now `SFCC_PROJECT_DIRECTORY`; `SFCC_WORKING_DIRECTORY` continues to work as a deprecated fallback.
