---
'@salesforce/b2c-dx-mcp': minor
'@salesforce/b2c-tooling-sdk': minor
---

Add a `config_inspect` MCP tool that reports the resolved configuration (instance, auth, SCAPI/MRT settings) with the source of each value and the effective project directory — secrets are redacted by default. Filesystem tools now resolve the project directory with explicit precedence (per-call argument, then `--project-directory`/`SFCC_PROJECT_DIRECTORY`, then the process working directory) and echo the resolved directory back in their output, so agents can override it per call and see which directory was used across MCP clients that spawn the server from inconsistent working directories.
