---
name: b2c-debug
description: Debug B2C Commerce server-side scripts using the b2c CLI. Use this skill whenever the user needs to set breakpoints, step through code, inspect variables, evaluate expressions, or investigate runtime behavior on a B2C Commerce instance. Also use when the user wants to understand what a script is doing at runtime, capture state at a specific line, or drive the debugger from a headless script — even if they just say "debug this controller" or "what's the value of basket at line 42".
---

# B2C Debug Skill

Use the `b2c` CLI to debug server-side scripts on Salesforce B2C Commerce instances. The `debug cli` command provides an interactive REPL for terminal debugging, with an `--rpc` mode for headless/programmatic use.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli debug cli`).

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

This starts a DAP adapter over stdio, used by IDE launch configurations.

## Related Skills

- `b2c-cli:b2c-logs` - Retrieve server logs for investigating errors found during debugging
- `b2c-cli:b2c-code` - Deploy code changes before debugging
- `b2c-cli:b2c-config` - Verify instance configuration and credentials
