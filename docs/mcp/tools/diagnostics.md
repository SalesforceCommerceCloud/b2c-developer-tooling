---
description: MCP tools for script debugging on B2C Commerce instances.
---

# Diagnostics Tools

MCP tools for connecting to the B2C Commerce Script Debugger API (SDAPI), setting breakpoints, inspecting variables, and stepping through server-side code. These tools are available in the **CARTRIDGES**, **SCAPI**, and **STOREFRONTNEXT** toolsets.

## Authentication

All debug tools require **Basic Auth** credentials (username and password) for a Business Manager user with the `WebDAV_Manage_Customization` permission.

The script debugger must be enabled on the instance: Business Manager > Administration > Development Configuration > Script Debugger > Enable.

---

## Session Lifecycle

### debug_start_session

Start a new script debugger session. Connects to the SDAPI, discovers cartridge mappings, and begins polling for halted threads.

> **Warning:** Debug sessions can halt remote request threads on the instance. Use `debug_end_session` to cleanly disconnect when done.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `cartridge_directory` | string | No | Project directory | Path to directory containing cartridges |
| `client_id` | string | No | `b2c-cli` | Client ID for the debugger API. Use a different ID for concurrent sessions on the same host. |

**Returns:** `session_id`, `hostname`, discovered `cartridges`, and `warnings`.

### debug_end_session

End a script debugger session. Disconnects from the SDAPI, stops polling, and cleans up resources.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | string | Yes | | Session ID from `debug_start_session` |
| `clear_breakpoints` | boolean | No | `false` | Delete all breakpoints before disconnecting |

### debug_list_sessions

List all active debug sessions. Returns session IDs, connected hostnames, and any currently halted threads.

No parameters.

---

## Breakpoints

### debug_set_breakpoints

Set breakpoints in a debug session. **Replaces** all previously set breakpoints.

Accepts local file paths (mapped to server paths via cartridge discovery), cartridge-prefixed paths (e.g. `app_storefront/cartridge/controllers/Cart.js`), or server paths starting with `/`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID from `debug_start_session` |
| `breakpoints` | array | Yes | Array of `{file, line, condition?}` objects |

Each breakpoint object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | Yes | Local file path, cartridge-prefixed path, or server script path |
| `line` | number | Yes | Line number |
| `condition` | string | No | Conditional expression — breakpoint only triggers when true |

---

## Execution Control

### debug_wait_for_stop

Wait for a thread to halt at a breakpoint or step. Returns immediately if a thread is already halted. Otherwise **blocks** until a halt occurs or the timeout expires — the user or an external process must trigger a request on the instance while this tool is waiting.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | string | Yes | | Session ID |
| `timeout_ms` | number | No | 30000 | Timeout in milliseconds (max 120000) |

**Returns:** `{halted, thread_id, location}` or `{halted: false, timed_out: true}`.

### debug_continue

Resume execution of a halted thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `thread_id` | number | Yes | Thread ID of the halted thread |

### debug_step_over

Step to the next line in the current function. Follow with `debug_wait_for_stop`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `thread_id` | number | Yes | Thread ID |

### debug_step_into

Step into the function call on the current line. Follow with `debug_wait_for_stop`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `thread_id` | number | Yes | Thread ID |

### debug_step_out

Step out of the current function, returning to the caller. Follow with `debug_wait_for_stop`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `thread_id` | number | Yes | Thread ID |

---

## Inspection

### debug_get_stack

Get the call stack for a halted thread. Returns stack frames with mapped local file paths and server script paths.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `thread_id` | number | Yes | Thread ID |

### debug_get_variables

Get variables for a stack frame in a halted thread.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | string | Yes | | Session ID |
| `thread_id` | number | Yes | | Thread ID |
| `frame_index` | number | No | `0` | Stack frame index (0 = top frame) |
| `scope` | string | No | All scopes | Filter by `local`, `closure`, or `global` |
| `object_path` | string | No | | Dot-delimited path to drill into an object (e.g. `request.httpParameters`) |

### debug_evaluate

Evaluate an expression in the context of a halted thread and stack frame.

> **Warning:** Expressions can have side effects (modify variables, call functions). Use with care.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | string | Yes | | Session ID |
| `thread_id` | number | Yes | | Thread ID |
| `frame_index` | number | No | `0` | Stack frame index |
| `expression` | string | Yes | | JavaScript expression to evaluate |

---

## Higher-Level Tools

### debug_capture_at_breakpoint

Set a breakpoint, wait for it to be hit, and capture a diagnostic snapshot — stack, variables, and optional expression results in a single call. Optionally resumes the thread after capture.

> **Important:** This tool **blocks** until the breakpoint is hit or the timeout expires. The user or an external process must trigger a request on the instance while this tool is waiting.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `session_id` | string | Yes | | Session ID |
| `file` | string | Yes | | File path for the breakpoint |
| `line` | number | Yes | | Line number |
| `condition` | string | No | | Conditional expression |
| `expressions` | string[] | No | | Expressions to evaluate when hit |
| `timeout_ms` | number | No | 30000 | Timeout waiting for the breakpoint (max 120000) |
| `auto_continue` | boolean | No | `false` | Resume the thread after capturing |

---

## See Also

- [Debug CLI Commands](/cli/debug) — Interactive REPL and RPC mode for the CLI
- [Configuration](../configuration) — Setting up instance credentials
