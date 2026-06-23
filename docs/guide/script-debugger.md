---
description: Debug server-side B2C Commerce scripts (controllers, hooks, jobs, custom APIs) with the Script Debugger — via the VS Code extension, the CLI DAP debug adapter, or the MCP diagnostics tools.
---

# Script Debugger

The B2C Commerce **Script Debugger** lets you set breakpoints, step through code, and inspect variables in server-side scripts — SFRA controllers, hooks, jobs, custom SCAPI endpoints, or any `dw/*` cartridge code — running live on an instance. The tooling connects to the instance's Script Debugger API (SDAPI) and surfaces it several ways:

- **VS Code (recommended)** — the [B2C DX VS Code Extension](/vscode-extension/#b2c-script-debugger) provides the full graphical debugger: breakpoints, log points, watch expressions, and step controls, just like any other Node project. This is the primary interface for interactive debugging.
- **Other IDEs (JetBrains, etc.)** via the [Debug Adapter Protocol (DAP)](https://microsoft.github.io/debug-adapter-protocol/) adapter — `b2c debug`.
- **AI-agent debugging** via the [MCP diagnostics tools](/mcp/tools/diagnostics) — `debug_start_session`, `debug_set_breakpoints`, etc.

The CLI's DAP debug adapter (`b2c debug`) also offers a headless terminal mode for scripting; see [Debug Commands](/cli/debug) for details.

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

| Use case                           | Interface                                  | Reference                                                   |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Debug from VS Code (recommended)   | B2C DX VS Code Extension                   | [VS Code Extension](/vscode-extension/#b2c-script-debugger) |
| Debug from another IDE (JetBrains) | `b2c debug` (DAP debug adapter over stdio) | [Debug Commands](/cli/debug#b2c-debug)                      |
| Let an AI agent drive the debugger | MCP diagnostics tools                      | [Diagnostics Tools](/mcp/tools/diagnostics)                 |

They all share the same underlying workflow: connect a session, set breakpoints (by local file path, cartridge-prefixed path, or server path), trigger the code on the instance, then inspect the halted thread.

## Server affinity (hitting breakpoints)

A breakpoint only fires when the code runs on the **same application server** the debugger is attached to. On a single-app-server environment this is automatic. But some **Production Instance Group (PIG)** environments run **multiple application servers** behind a load balancer — there, a request that triggers your code may land on a different app server than the debugger, and the breakpoint never fires.

> **Sandboxes (ODS) are single-app-server and are not affected.** This only matters on certain multi-app-server PIG environments.

To pin a triggering request to the correct app server, route it with the debugger's session cookie (`dwsid`). The CLI and SDK manage this cookie automatically for the debugger's own requests — so the way you obtain the value depends on the interface:

- **MCP:** `debug_start_session` and `debug_list_sessions` return a `session_cookie` (`{name, value}`). This is the most direct source. See [Diagnostics Tools → Server affinity](/mcp/tools/diagnostics#server-affinity-hitting-breakpoints).
- **VS Code:** the cookie is logged to the **B2C DX** output channel when the session connects, and the **Copy Debugger Session ID (dwsid)** command copies it to your clipboard.
- **CLI:** the cookie is logged at info level when the session connects (`Debug session cookie: dwsid=…`).

Once you have the value, send the request that triggers your code — a browser session, `curl`, an integration test — with that cookie:

```
Cookie: dwsid=<value>
```

For headless requests where you can't (or don't want to) set a cookie — server-to-server calls that trigger hooks, custom APIs, or SCAPI/OCAPI endpoints — pass the same value as the `sfdc_dwsid` request header instead:

```
sfdc_dwsid: <value>
```

If you cannot set the cookie or header on the triggering request, you may need to retry until the load balancer happens to route to the attached app server.

> A future enhancement will let the VS Code extension launch a browser pre-seeded with the debug session's cookie, removing this manual step.

## See Also

- [VS Code Extension](/vscode-extension/#b2c-script-debugger) — the recommended graphical debugger
- [Debug Commands](/cli/debug) — `b2c debug` DAP debug adapter reference
- [Diagnostics Tools](/mcp/tools/diagnostics) — MCP tools for agent-driven debugging
- [Authentication Setup](/guide/authentication) — WebDAV access key configuration
- [IDE Integration](/guide/ide-integration) — connecting other IDEs to your CLI configuration
