---
'@salesforce/b2c-dx-mcp': minor
---

Add MRT log-tail MCP tools (`mrt_logs_watch_start`, `mrt_logs_watch_poll`, `mrt_logs_watch_stop`, `mrt_logs_watch_list`) for streaming application logs from a Managed Runtime environment over a WebSocket. These mirror the SFCC instance `logs_watch_*` lifecycle — start a watch before triggering an action, poll to drain buffered entries, then stop — and are available in the DIAGNOSTICS, PWAV3, and STOREFRONTNEXT toolsets. Requires MRT project + environment + API key configuration.
