---
name: b2c-debug
description: Debug B2C Commerce server-side scripts using the b2c CLI. Use this skill whenever the user needs to set breakpoints, step through code, inspect variables, evaluate expressions, or investigate runtime behavior on a B2C Commerce instance. Also use when the user wants to understand what a script is doing at runtime, capture state at a specific line, or drive the debugger from a headless script — even if they just say "debug this controller" or "what's the value of basket at line 42".
---

# B2C Debug Skill

Debug server-side scripts on Salesforce B2C Commerce instances — set breakpoints, step through code, and inspect variables in SFRA controllers, hooks, jobs, and custom APIs.

> **Prefer the MCP diagnostics tools when available.** If the B2C DX MCP server is installed (tools named `debug_start_session`, `debug_set_breakpoints`, `debug_wait_for_stop`, `debug_capture_at_breakpoint`, etc.), **use them instead of the RPC-based `b2c debug cli --rpc` workflow.** The MCP tools manage session state for you, return structured JSON, and support a non-blocking poll workflow (`debug_list_sessions` / `debug_wait_for_stop`) that is far more reliable for agents than driving JSONL over stdio. Only fall back to `b2c debug cli` (REPL or `--rpc`) when the MCP server is not installed, or when a human wants an interactive terminal session.

`b2c debug` provides a Debug Adapter Protocol (DAP) debug adapter for IDEs. For terminal or headless use without the MCP tools, `b2c debug cli` also offers an interactive REPL and a JSONL `--rpc` mode.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli debug cli`).

## Configuration & Authentication

The CLI auto-discovers the target instance and credentials from `SFCC_*` environment variables, `dw.json` in the current or parent directories, `~/.mobify`, `package.json`, and configuration plugins. **Flags like `--server`, `--username`, and `--password` are usually unnecessary** — only pass them to override what's auto-detected.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (use `--json` for scripting, `--unmask` to reveal secrets). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

## Prerequisites

- Basic Auth credentials (username/password) for a BM user with `WebDAV_Manage_Customization`
- Script Debugger enabled: BM > Administration > Development Configuration > Enable Script Debugger

## Interactive Debugging

### Start a Debug Session

```bash
# Start interactive debugger
b2c debug cli

# Specify cartridge directory for source mapping
b2c debug cli --cartridge-path ./cartridges

# Use a custom client ID (for concurrent sessions)
b2c debug cli --client-id my-session
```

### Set Breakpoints

In the REPL:

```
break Cart.js:42
break Checkout.js:100 if basket.totalGrossPrice > 100
breakpoints
delete 1
```

### Inspect State When Halted

```
stack
vars
members basket.productLineItems
eval basket.productLineItems.length
eval request.httpParameterMap.get("pid").stringValue
```

### Control Execution

```
continue
step
stepin
stepout
```

### Thread Management

```
threads
thread 5
frame 2
```

## RPC Mode (Headless / Agent Use)

For headless scripts, agents, and programmatic integration, use `--rpc` mode. Commands and responses are JSONL (one JSON object per line) on stdin/stdout.

```bash
b2c debug cli --rpc
```

### Send Commands

```json
{"id": 1, "command": "set_breakpoints", "args": {"breakpoints": [{"file": "Cart.js", "line": 42}]}}
{"id": 2, "command": "get_stack"}
{"id": 3, "command": "get_variables", "args": {"scope": "local"}}
{"id": 4, "command": "evaluate", "args": {"expression": "basket.totalGrossPrice"}}
{"id": 5, "command": "continue"}
```

### Receive Responses and Events

```json
{"event": "ready", "data": {}}
{"id": 1, "result": {"breakpoints": [{"id": 1, "file": "Cart.js", "line": 42, "script_path": "/app_storefront/cartridge/controllers/Cart.js"}]}}
{"event": "thread_stopped", "data": {"thread_id": 5, "location": {"file": "Cart.js", "line": 42, "function_name": "show"}}}
```

### Available RPC Commands

| Command | Key Args | Description |
|---------|----------|-------------|
| `set_breakpoints` | `breakpoints: [{file, line, condition?}]` | Replace all breakpoints |
| `list_breakpoints` | | List current breakpoints |
| `continue` | `thread_id?` | Resume halted thread |
| `step_over` | `thread_id?` | Step to next line |
| `step_into` | `thread_id?` | Step into function |
| `step_out` | `thread_id?` | Step out of function |
| `get_stack` | `thread_id?` | Get call stack |
| `get_variables` | `thread_id?, frame_index?, scope?, object_path?` | Get variables |
| `evaluate` | `expression, thread_id?, frame_index?` | Evaluate expression |
| `list_threads` | | List threads |
| `select_thread` | `thread_id` | Switch thread |
| `select_frame` | `index` | Switch frame |

## DAP Mode (IDE Integration)

For VS Code and other DAP-compatible IDEs:

```bash
b2c debug
```

This starts a DAP debug adapter over stdio, used by IDE launch configurations.

## Server Affinity (Hitting Breakpoints)

A breakpoint only fires when the triggering code runs on the **same application server** the debugger is attached to. Some **Production Instance Group (PIG)** environments run **multiple application servers** behind a load balancer, so a request that should hit your breakpoint may land on a different app server and the breakpoint never fires.

> **Sandboxes (ODS) are single-app-server and are not affected.** This only matters on certain multi-app-server PIG environments. If breakpoints are not hitting on a sandbox, the cause is something else (wrong path mapping, code version, or the code simply not running).

To pin a triggering request to the correct app server, send it with the debugger's session cookie (`dwsid`):

- **MCP:** `debug_start_session` and `debug_list_sessions` return a `session_cookie` (`{name, value}`). Send the request that triggers your code (storefront page load, SCAPI/OCAPI call) with `Cookie: dwsid=<value>`.
- **Any trigger:** whatever issues the request — a browser, `curl`, an integration test — must carry the same `dwsid` value.

If the cookie cannot be set on the triggering request, retry until the load balancer routes to the attached app server.

## Related Skills

- `b2c-cli:b2c-logs` - Retrieve server logs for investigating errors found during debugging
- `b2c-cli:b2c-code` - Deploy code changes before debugging
- `b2c-cli:b2c-config` - Verify instance configuration and credentials
