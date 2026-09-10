---
'@salesforce/b2c-dx-mcp': major
'@salesforce/b2c-tooling-sdk': minor
'@salesforce/b2c-api-schemas': minor
'@salesforce/b2c-agent-plugins': patch
'@salesforce/b2c-dx-docs': patch
'b2c-vs-extension': patch
---

Add embedded, searchable Commerce skills and SCAPI code mode with offline discovery of 594 Admin and Shopper operations. Execute standard Admin API workflows with automatic authentication, SDK Safety Mode, and focused results. Reuse built-in workflows for product creation and category assignment, campaign inspection, and job triage; save reviewed workflows or export Account Manager and SLAS tokens for external clients when needed.

Enable all toolsets by default, provide explicit tool-effect annotations, and support MCP 2026-07-28 alongside earlier clients. Streamline debugging and logging with `debug_control`, `debug_inspect`, `logs_watch`, and `mrt_logs_watch`. Update explicit tool selections to the consolidated names, remove `pwakit_get_guidelines` and `scapi_custom_api_generate_scaffold`, and remove `--allow-non-ga-tools` from launch commands. Use `b2c scaffold generate custom-api` for local scaffolding.

Include focused configuration and authentication guidance, consistent CLI/MCP skill recommendations, and concise installation, capabilities, and security documentation. Code mode restricts local filesystem/process APIs to keep programs focused on API workflows; use terminal and file tools for local development.
