---
description: Debug server-side B2C Commerce scripts (controllers, hooks, jobs, custom APIs) with the Script Debugger — via the VS Code extension, the CLI DAP debug adapter, or the MCP diagnostics tools.
---

# Script Debugger

The B2C Commerce **Script Debugger** lets you set breakpoints, step through code, and inspect variables in server-side scripts — SFRA controllers, hooks, jobs, custom SCAPI endpoints, or any `dw/*` cartridge code — running live on an instance. You can drive it from the VS Code extension, another IDE, the CLI, or an AI agent.

## Requirements

The debugger needs **Basic auth credentials** — a Business Manager username and either the account password or a `WebDAV File Access and UX Studio` access key (used as the password). OAuth/client credentials are **not** sufficient.

The debugger uses the same resolved credentials as the rest of the CLI (flags, `SFCC_*` environment variables, or `dw.json`). See the [Authentication Guide](/guide/authentication#webdav-access) for access key setup and [CLI Configuration](/guide/configuration) for how credentials are resolved.

## Choosing an interface

| Use case                           | Interface                       | Reference                                                   |
| ---------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| Debug from VS Code (recommended)   | B2C DX VS Code Extension        | [VS Code Extension](/vscode-extension/#b2c-script-debugger) |
| Debug from another IDE (JetBrains) | `b2c debug` (DAP debug adapter) | [Debug Commands](/cli/debug#b2c-debug)                      |
| Let an AI agent drive the debugger | MCP Script Debugger tools       | [Script Debugger](/mcp/tools/diagnostics)                   |

The **VS Code extension is the recommended interface** for interactive debugging — it provides the full graphical debugger (breakpoints, log points, watch expressions, step controls), just like any other Node project. The CLI's DAP debug adapter (`b2c debug`) also offers a headless terminal mode for scripting; see [Debug Commands](/cli/debug) for details.

They all share the same workflow: connect a session, set breakpoints (by local file path, cartridge-prefixed path, or server path), trigger the code on the instance, then inspect the halted thread.

## Server affinity (hitting breakpoints)

A breakpoint only fires when the code runs on the **same application server** the debugger is attached to. On a single-app-server environment this is automatic. But some **Production Instance Group (PIG)** environments run **multiple application servers** behind a load balancer — there, a request that triggers your code may land on a different app server than the debugger, and the breakpoint never fires.

> **Sandboxes (ODS) are single-app-server and are not affected.** This only matters on certain multi-app-server PIG environments.

To pin a triggering request to the correct app server, send it with the debugger's session cookie (`dwsid`). How you obtain the value depends on the interface:

- **MCP:** `debug_start_session` and `debug_list_sessions` return a `session_cookie` (`{name, value}`). See [Script Debugger → Server affinity](/mcp/tools/diagnostics#server-affinity-hitting-breakpoints).
- **VS Code:** the cookie is logged to the **B2C DX** output channel when the session connects, and the **Copy Debugger Session ID (dwsid)** command copies it to your clipboard.
- **CLI:** the cookie is logged when the session connects (`Debug session cookie: dwsid=…`).

Send the request that triggers your code — a browser session, `curl`, an integration test — with that cookie:

```
Cookie: dwsid=<value>
```

For headless requests where you can't (or don't want to) set a cookie — server-to-server calls that trigger hooks, custom APIs, or SCAPI/OCAPI endpoints — pass the same value as the `sfdc_dwsid` request header instead:

```
sfdc_dwsid: <value>
```

If you cannot set the cookie or header on the triggering request, you may need to retry until the load balancer happens to route to the attached app server.

## See Also

- [VS Code Extension](/vscode-extension/#b2c-script-debugger) — the recommended graphical debugger
- [Debug Commands](/cli/debug) — `b2c debug` DAP debug adapter and `b2c debug cli` reference
- [Script Debugger](/mcp/tools/diagnostics) — MCP tools for agent-driven debugging
- [Authentication Setup](/guide/authentication) — WebDAV access key configuration
- [IDE Integration](/guide/ide-integration) — connecting other IDEs to your CLI configuration
