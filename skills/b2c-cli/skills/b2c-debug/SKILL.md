---
name: b2c-debug
description: Debug B2C Commerce server-side scripts using the b2c CLI. Use this skill whenever the user needs to set breakpoints, step through code, inspect variables, evaluate expressions, or investigate runtime behavior on a B2C Commerce instance. Also use when the user wants to understand what a script is doing at runtime, capture state at a specific line, or drive the debugger from a headless script — even if they just say "debug this controller" or "what's the value of basket at line 42".
---

# B2C Debug Skill

Debug server-side scripts on Salesforce B2C Commerce instances — set breakpoints, step through code, and inspect variables in SFRA controllers, hooks, jobs, and custom APIs.

> Prefer MCP debugging when available: `debug_control` resumes/steps; `debug_inspect` reads stacks and variables; `debug_evaluate` evaluates expressions. See `skill://mcp/debugger/SKILL.md` for the MCP workflow. Use the CLI for a requested terminal session or when MCP is unavailable.

`b2c debug` provides a Debug Adapter Protocol (DAP) debug adapter for IDEs. For terminal or headless use without the MCP tools, `b2c debug cli` also offers an interactive REPL and a JSONL `--rpc` mode.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli debug cli`).

## Configuration & Authentication

The CLI resolves the target instance and debugger credentials from environment variables (including project `.env`), the selected project-local or shared `dw.json`, and configuration plugins. It does not search parent directories. `package.json` supplies only non-sensitive defaults; `~/.mobify` supplies MRT credentials, not debugger credentials. **Flags like `--server`, `--username`, and `--password` are usually unnecessary** — only pass them to override what's auto-detected.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (use `--json` for scripting; keep secrets masked unless the user explicitly requests their values). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

For MCP debugging, pass `projectDirectory` to `debug_start_session` whenever the MCP server may have been launched outside the project. The tool uses that root to load the project's `.env` and default `dw.json`; pass `configPath` to select a different primary `dw.json`-format file and `instanceName` to select a named instance from the primary or shared default file. Cartridge discovery and local/server source mapping default to `projectDirectory`; pass `cartridgeDirectory` only when the cartridges live under a different root. The start call captures this information in `resolution`, which `debug_list_sessions` returns without requiring the caller to repeat it. The MCP server controls its SDAPI client identity internally, so callers do not pass a debugger client ID.

## Prerequisites

- Basic Auth credentials for a BM user with `WebDAV_Manage_Customization`: a username and either the account password or a `WebDAV File Access and UX Studio` access key

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

| Command            | Key Args                                         | Description              |
| ------------------ | ------------------------------------------------ | ------------------------ |
| `set_breakpoints`  | `breakpoints: [{file, line, condition?}]`        | Replace all breakpoints  |
| `list_breakpoints` |                                                  | List current breakpoints |
| `continue`         | `thread_id?`                                     | Resume halted thread     |
| `step_over`        | `thread_id?`                                     | Step to next line        |
| `step_into`        | `thread_id?`                                     | Step into function       |
| `step_out`         | `thread_id?`                                     | Step out of function     |
| `get_stack`        | `thread_id?`                                     | Get call stack           |
| `get_variables`    | `thread_id?, frame_index?, scope?, object_path?` | Get variables            |
| `evaluate`         | `expression, thread_id?, frame_index?`           | Evaluate expression      |
| `list_threads`     |                                                  | List threads             |
| `select_thread`    | `thread_id`                                      | Switch thread            |
| `select_frame`     | `index`                                          | Switch frame             |

## DAP Mode (IDE Integration)

For VS Code and other DAP-compatible IDEs:

```bash
b2c debug
```

This starts a DAP debug adapter over stdio, used by IDE launch configurations.

## Related Skills

- `b2c-cli:b2c-logs` - Retrieve server logs for investigating errors found during debugging
- `b2c-cli:b2c-code` - Deploy code changes before debugging
- `b2c-cli:b2c-config` - Verify instance configuration and credentials
