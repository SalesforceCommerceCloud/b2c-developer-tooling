---
'@salesforce/b2c-dx-mcp': major
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-cli': minor
'b2c-vs-extension': patch
'@salesforce/b2c-dx-docs': patch
'@salesforce/b2c-agent-plugins': patch
---

Add a shared global `dw.json` for the CLI, MCP server, and VS Code extension, managed with `b2c setup default-config set|get|unset`; primary and global instances are available together without merging their fields. MCP tools now accept per-call `projectDirectory` and `configPath`; debugger callers must rename `cartridge_directory` to `cartridgeDirectory` and remove `client_id`.
