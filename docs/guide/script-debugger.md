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
| Debug with your AI assistant       | B2C MCP                                   | [Debug with your assistant](#debug-with-your-assistant)     |

The **VS Code extension is the recommended interface** for interactive debugging — it provides the full graphical debugger (breakpoints, log points, watch expressions, step controls), just like any other Node project. The CLI's DAP debug adapter (`b2c debug`) also offers a headless terminal mode for scripting; see [Debug Commands](/cli/debug) for details.

They all share the same workflow: connect a session, set breakpoints (by local file path, cartridge-prefixed path, or server path), trigger the code on the instance, then inspect the halted thread.

> **Rare PIG-only troubleshooting:** If a breakpoint is never hit after confirming the request exercises the expected code and the source mapping is correct, the request may be reaching a different app server on a multi-app-server Production Instance Group. In that case, use **Copy Debugger Session ID (dwsid)** in VS Code or the MCP session's `session_cookie`, then send the triggering request with `Cookie: dwsid=<value>` (or `sfdc_dwsid: <value>` for a headless request). Sandboxes are single-app-server and never need this.

## Debug with your assistant

With the [B2C MCP](/mcp/#setup), your assistant can investigate live cartridge
execution: set a breakpoint, inspect variables and call stacks, and step through
the code to test an explanation. Use it for an unexpected controller response,
a failing hook, or a custom job step whose inputs differ from what you expected.

Share the relevant source and a way to reproduce the issue in your sandbox.
Your assistant can connect the observed values to the code and
[Script API documentation](/mcp/toolsets#documentation), then explain the finding
before you decide whether to change anything.

<ExamplePrompt>

> This custom job step skips products I expect it to update. Inspect its inputs and filtering logic with the debugger while I run it in my sandbox. Explain which condition excludes a product, then resume and disconnect. Don't change the code.

</ExamplePrompt>

Breakpoints pause requests or jobs. Use a sandbox; evaluating expressions can
change application state. The MCP uses the [same debugger credentials](#requirements).
See [MCP debugger access](/mcp/security#debugger) for permissions and precautions.

## See Also

- [VS Code Extension](/vscode-extension/#b2c-script-debugger) — the recommended graphical debugger
- [Debug Commands](/cli/debug) — `b2c debug` DAP debug adapter and `b2c debug cli` reference
- [MCP debugging tools](/mcp/toolsets#diagnostics) — capabilities and required access
- [Authentication Setup](/guide/authentication) — WebDAV access key configuration
- [IDE Integration](/guide/ide-integration) — connecting other IDEs to your CLI configuration
