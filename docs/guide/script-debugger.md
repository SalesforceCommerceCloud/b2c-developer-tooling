---
description: Debug server-side B2C Commerce scripts (controllers, hooks, jobs, custom APIs) with the Script Debugger — via the VS Code extension, the CLI DAP debug adapter, or the MCP diagnostics tools.
---

# Script Debugger

The B2C Commerce **Script Debugger** lets you set breakpoints, step through code, and inspect variables in server-side scripts — SFRA controllers, hooks, jobs, custom SCAPI endpoints, or any `dw/*` cartridge code — running live on an instance. You can drive it from the VS Code extension, another IDE, the CLI, or an AI agent.

## Requirements

The debugger needs **Basic auth credentials** — a Business Manager username and either the account password or a `WebDAV File Access and UX Studio` access key (used as the password). OAuth/client credentials are **not** sufficient.

The debugger uses the same resolved credentials as the rest of the CLI (flags, `SFCC_*` environment variables, or `dw.json`). See the [Authentication Guide](/guide/authentication#webdav-access) for access key setup and [Configuration](/guide/configuration) for how credentials are resolved.

## Choosing an interface

| Use case                           | Interface                                 | Reference                                                   |
| ---------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Debug from VS Code (recommended)   | Salesforce B2C Commerce VS Code Extension | [VS Code Extension](/vscode-extension/#b2c-script-debugger) |
| Debug from another IDE (JetBrains) | `b2c debug` (DAP debug adapter)           | [Debug Commands](/cli/debug#b2c-debug)                      |
| Let an AI agent drive the debugger | MCP Script Debugger tools                 | [Script Debugger](/mcp/tools/diagnostics)                   |

The **VS Code extension is the recommended interface** for interactive debugging — it provides the full graphical debugger (breakpoints, log points, watch expressions, step controls), just like any other Node project. The CLI's DAP debug adapter (`b2c debug`) also offers a headless terminal mode for scripting; see [Debug Commands](/cli/debug) for details.

They all share the same workflow: connect a session, set breakpoints (by local file path, cartridge-prefixed path, or server path), trigger the code on the instance, then inspect the halted thread.

> **Rare PIG-only troubleshooting:** If a breakpoint is never hit after confirming the request exercises the expected code and the source mapping is correct, the request may be reaching a different app server on a multi-app-server Production Instance Group. In that case, use **Copy Debugger Session ID (dwsid)** in VS Code or the MCP session's `session_cookie`, then send the triggering request with `Cookie: dwsid=<value>` (or `sfdc_dwsid: <value>` for a headless request). Sandboxes are single-app-server and never need this.

## See Also

- [VS Code Extension](/vscode-extension/#b2c-script-debugger) — the recommended graphical debugger
- [Debug Commands](/cli/debug) — `b2c debug` DAP debug adapter and `b2c debug cli` reference
- [Script Debugger](/mcp/tools/diagnostics) — MCP tools for agent-driven debugging
- [Authentication Setup](/guide/authentication) — WebDAV access key configuration
- [IDE Integration](/guide/ide-integration) — connecting other IDEs to your CLI configuration
