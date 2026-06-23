---
description: Debug server-side B2C Commerce scripts (controllers, hooks, jobs, custom APIs) with the Script Debugger — via the VS Code extension, the CLI DAP adapter and REPL, or the MCP diagnostics tools.
---

# Script Debugger

The B2C Commerce **Script Debugger** lets you set breakpoints, step through code, and inspect variables in server-side scripts — SFRA controllers, hooks, jobs, custom SCAPI endpoints, or any `dw/*` cartridge code — running live on an instance. The tooling connects to the instance's Script Debugger API (SDAPI) and surfaces it several ways:

- **VS Code (recommended)** — the [B2C DX VS Code Extension](/vscode-extension/#b2c-script-debugger) provides the full graphical debugger: breakpoints, log points, watch expressions, and step controls, just like any other Node project. This is the primary interface for interactive debugging.
- **Other IDEs (JetBrains, etc.)** via the [Debug Adapter Protocol (DAP)](https://microsoft.github.io/debug-adapter-protocol/) adapter — `b2c debug`.
- **Headless/terminal debugging** via an interactive REPL or JSONL-over-stdio RPC — `b2c debug cli`.
- **AI-agent debugging** via the [MCP diagnostics tools](/mcp/tools/diagnostics) — `debug_start_session`, `debug_set_breakpoints`, etc.

## Requirements

The debugger needs two things:

1. **The Script Debugger enabled on the instance.** In Business Manager: **Administration → Development Configuration → Script Debugger → Enable**.
2. **Basic auth credentials** — a Business Manager username and a WebDAV / UX Studio access key (used as the password). OAuth/client credentials are **not** sufficient for the SDAPI.

> The access key is the same kind of WebDAV access key used by UX Studio and other code-upload tooling. Generate one in Business Manager under your account's access keys. See the [Authentication Guide](/guide/authentication#webdav-access) for details.

Only one debug client per `client_id` may be attached to a host at a time. Starting a new session with the same `client_id` takes over (replaces) any prior one — a useful safety net for orphaned sessions.

## Configuration

The debugger reads the same resolved configuration as the rest of the CLI. Provide the hostname and Basic auth credentials via any of (highest priority first):

- Flags — `--username` / `--password` (and the active instance for the hostname)
- Environment variables — `SFCC_SERVER`, `SFCC_USERNAME`, `SFCC_PASSWORD`
- `dw.json` — `hostname`, `username`, `password` fields

See [CLI Configuration](/guide/configuration) for the full resolution order and multi-instance setup.

## Choosing an interface

| Use case                            | Interface                            | Reference                                                   |
| ----------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| Debug from VS Code (recommended)    | B2C DX VS Code Extension             | [VS Code Extension](/vscode-extension/#b2c-script-debugger) |
| Debug from another IDE (JetBrains)  | `b2c debug` (DAP adapter over stdio) | [Debug Commands](/cli/debug#b2c-debug)                      |
| Debug from the terminal or a script | `b2c debug cli` (REPL or JSONL RPC)  | [Debug Commands](/cli/debug#b2c-debug-cli)                  |
| Let an AI agent drive the debugger  | MCP diagnostics tools                | [Diagnostics Tools](/mcp/tools/diagnostics)                 |

They all share the same underlying workflow: connect a session, set breakpoints (by local file path, cartridge-prefixed path, or server path), trigger the code on the instance, then inspect the halted thread.

## Server affinity (hitting breakpoints)

A breakpoint only fires when the code runs on the **same application server** the debugger is attached to. On a single-app-server environment this is automatic. But some **Production Instance Group (PIG)** environments run **multiple application servers** behind a load balancer — there, a request that triggers your code may land on a different app server than the debugger, and the breakpoint never fires.

> **Sandboxes (ODS) are single-app-server and are not affected.** This only matters on multi-app-server PIG environments (typically staging/production).

To pin a triggering request to the correct app server, route it with the debugger's session cookie (`dwsid`). The CLI and SDK manage this cookie automatically for the debugger's own requests; to apply it to **your** triggering request:

- **MCP:** `debug_start_session` and `debug_list_sessions` return a `session_cookie` (`{name, value}`). Send your storefront page load or SCAPI/OCAPI call with `Cookie: dwsid=<value>` so it reaches the right app server. See [Diagnostics Tools → Server affinity](/mcp/tools/diagnostics#server-affinity-hitting-breakpoints).
- **General:** any request you make to trigger the breakpoint — a browser session, `curl`, an integration test — must carry the same `dwsid` cookie value.

If you cannot control the cookie on the triggering request, you may need to retry until the load balancer happens to route to the attached app server.

## See Also

- [VS Code Extension](/vscode-extension/#b2c-script-debugger) — the recommended graphical debugger
- [Debug Commands](/cli/debug) — `b2c debug` DAP adapter and `b2c debug cli` REPL/RPC reference
- [Diagnostics Tools](/mcp/tools/diagnostics) — MCP tools for agent-driven debugging
- [Authentication Setup](/guide/authentication) — WebDAV access key configuration
- [IDE Integration](/guide/ide-integration) — connecting other IDEs to your CLI configuration
