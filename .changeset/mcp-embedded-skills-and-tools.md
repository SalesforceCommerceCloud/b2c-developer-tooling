---
'@salesforce/b2c-dx-mcp': major
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-agent-plugins': patch
'@salesforce/b2c-dx-docs': patch
'b2c-vs-extension': patch
---

Add embedded Commerce skills through MCP resources and searchable `skills_read`, with focused configuration, authentication, and workflow guidance and consistent CLI/MCP recommendations. Enable all toolsets by default, streamline debugging and logging, identify tool effects for client approval controls, and support MCP 2026-07-28 alongside earlier clients. Include concise installation, capabilities, configuration, and security documentation.

Update explicit tool selections to use `debug_control`, `debug_inspect`, `logs_watch`, and `mrt_logs_watch`; remove `pwakit_get_guidelines` and `scapi_custom_api_generate_scaffold`. Remove `--allow-non-ga-tools` from launch commands. Use `--toolsets` or `--tools` to customize the catalog and `b2c scaffold generate custom-api` for local scaffolding.
