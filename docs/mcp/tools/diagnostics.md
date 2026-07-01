---
description: MCP tools for script debugging on B2C Commerce instances.
---

# Diagnostics Tools

MCP tools for connecting to the B2C Commerce Script Debugger API (SDAPI), setting breakpoints, inspecting variables, and stepping through server-side code. These tools are available in the **CARTRIDGES** and **SCAPI** toolsets.

## Authentication

Requires **Basic Auth** credentials only. OAuth is not supported by the SDAPI.

**Required:**

- **Basic Auth** - `hostname`, `username`, and `password` — either the account password or a `WebDAV File Access and UX Studio` access key — for a user with the `WebDAV_Manage_Customization` permission.

**Configuration priority:** Flags → Environment variables → `dw.json` config file

See [Configuration](../configuration) for complete credential setup details including flags and environment variables. See [Authentication Setup](../../guide/authentication#webdav-access) for access key configuration instructions.

## Recovery from broken or orphaned sessions

Debug sessions are stateful and live in the MCP server process. If the agent loses track of an active session (context flush, crash, restart), or breakpoints stop firing as expected:

1. **List active sessions** — call `debug_list_sessions` (no args). It returns all sessions known to the server with their `session_id`, `hostname`, halted threads, and currently armed breakpoints.
2. **End orphaned sessions** — call `debug_end_session` with the `session_id` to free the debugger slot on the instance.
3. **SDAPI single-client guarantee** — the script debugger only supports one client per `client_id` per host. Calling `debug_start_session` with the same `client_id` against the same host implicitly takes over (replaces) any prior client. This is the safety net when a session is lost without a clean shutdown.
4. **Idle cleanup** — sessions inactive for 30 minutes are automatically cleaned up by the server.
5. **Restart the MCP server** — as a last resort, restarting the MCP server destroys all session state. The orphaned debugger slot on the instance will be freed by SDAPI's own 60-second halt-timeout or by the next `debug_start_session` with the same client ID.

---

## Session Lifecycle

### debug_start_session

Start a new script debugger session. Connects to the SDAPI, discovers cartridge mappings, and begins polling for halted threads.

> **Warning:** Debug sessions can halt remote request threads on the instance. Use `debug_end_session` to cleanly disconnect when done.

| Parameter             | Type   | Required | Default           | Description                                                                                  |
| --------------------- | ------ | -------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `cartridge_directory` | string | No       | Project directory | Path to directory containing cartridges                                                      |
| `client_id`           | string | No       | `b2c-cli`         | Client ID for the debugger API. Use a different ID for concurrent sessions on the same host. |

**Returns:** `session_id`, `hostname`, discovered `cartridges`, `session_cookie` (see [Server affinity](#server-affinity-hitting-breakpoints)), and `warnings`.

### debug_end_session

End a script debugger session. Disconnects from the SDAPI, stops polling, and cleans up resources.

| Parameter           | Type    | Required | Default | Description                                 |
| ------------------- | ------- | -------- | ------- | ------------------------------------------- |
| `session_id`        | string  | Yes      |         | Session ID from `debug_start_session`       |
| `clear_breakpoints` | boolean | No       | `false` | Delete all breakpoints before disconnecting |

### debug_list_sessions

List all active debug sessions. Returns session IDs, connected hostnames, any currently halted threads, armed breakpoints, and each session's `session_cookie` (see [Server affinity](#server-affinity-hitting-breakpoints)).

No parameters.

---

## Server affinity (hitting breakpoints)

> **Most sessions don't need this.** Set your breakpoint and trigger the request as usual. Only reach for the session cookie when a breakpoint is _never_ hit even though you're sure the request exercises that code — and only in the specific **production instance group** configurations that run multiple app servers. This never applies to sandboxes.

Some production instance group configurations run multiple application servers behind a load balancer. The debugger attaches to **one** app server, and a breakpoint only fires when your code executes on that same server. Sandboxes run a single app server, so this never comes up there.

If a breakpoint won't hit for this reason, pin the triggering request to the correct app server using the `session_cookie` returned by `debug_start_session` and `debug_list_sessions`:

```json
{"name": "dwsid", "value": "abc123..."}
```

Send your triggering request — a storefront page load, a SCAPI/OCAPI call, etc. — with this cookie so it lands on the app server holding the debug session:

```
Cookie: dwsid=abc123...
```

For headless server-to-server requests that trigger hooks, custom APIs, or SCAPI/OCAPI endpoints — where setting a cookie is awkward — pass the same value as the `sfdc_dwsid` request header instead:

```
sfdc_dwsid: abc123...
```

If `session_cookie` is `null`, the debugger did not establish a session cookie; a warning is included and breakpoints may not be reliably hit on multi-app-server instances.

---

## Breakpoints

### debug_set_breakpoints

Set breakpoints in a debug session. **Replaces** all previously set breakpoints.

Accepts local file paths (mapped to server paths via cartridge discovery), cartridge-prefixed paths (e.g. `app_storefront/cartridge/controllers/Cart.js`), or server paths starting with `/`.

| Parameter     | Type   | Required | Description                                 |
| ------------- | ------ | -------- | ------------------------------------------- |
| `session_id`  | string | Yes      | Session ID from `debug_start_session`       |
| `breakpoints` | array  | Yes      | Array of `{file, line, condition?}` objects |

Each breakpoint object:

| Field       | Type   | Required | Description                                                     |
| ----------- | ------ | -------- | --------------------------------------------------------------- |
| `file`      | string | Yes      | Local file path, cartridge-prefixed path, or server script path |
| `line`      | number | Yes      | Line number                                                     |
| `condition` | string | No       | Conditional expression — breakpoint only triggers when true     |

---

## Execution Control

### debug_wait_for_stop

Wait for a thread to halt at a breakpoint or step. Returns immediately if a thread is already halted. Otherwise **blocks** until a halt occurs or the timeout expires — the user or an external process must trigger a request on the instance while this tool is waiting.

| Parameter    | Type   | Required | Default | Description                          |
| ------------ | ------ | -------- | ------- | ------------------------------------ |
| `session_id` | string | Yes      |         | Session ID                           |
| `timeout_ms` | number | No       | 30000   | Timeout in milliseconds (max 120000) |

**Returns:** `{halted, thread_id, location}` or `{halted: false, timed_out: true}`.

### debug_continue

Resume execution of a halted thread.

| Parameter    | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| `session_id` | string | Yes      | Session ID                     |
| `thread_id`  | number | Yes      | Thread ID of the halted thread |

### debug_step_over

Step to the next line in the current function. Follow with `debug_wait_for_stop`.

| Parameter    | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| `session_id` | string | Yes      | Session ID  |
| `thread_id`  | number | Yes      | Thread ID   |

### debug_step_into

Step into the function call on the current line. Follow with `debug_wait_for_stop`.

| Parameter    | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| `session_id` | string | Yes      | Session ID  |
| `thread_id`  | number | Yes      | Thread ID   |

### debug_step_out

Step out of the current function, returning to the caller. Follow with `debug_wait_for_stop`.

| Parameter    | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| `session_id` | string | Yes      | Session ID  |
| `thread_id`  | number | Yes      | Thread ID   |

---

## Inspection

### debug_get_stack

Get the call stack for a halted thread. Returns stack frames with mapped local file paths and server script paths.

| Parameter    | Type   | Required | Description |
| ------------ | ------ | -------- | ----------- |
| `session_id` | string | Yes      | Session ID  |
| `thread_id`  | number | Yes      | Thread ID   |

### debug_get_variables

Get variables for a stack frame in a halted thread.

| Parameter     | Type   | Required | Default    | Description                                                                |
| ------------- | ------ | -------- | ---------- | -------------------------------------------------------------------------- |
| `session_id`  | string | Yes      |            | Session ID                                                                 |
| `thread_id`   | number | Yes      |            | Thread ID                                                                  |
| `frame_index` | number | No       | `0`        | Stack frame index (0 = top frame)                                          |
| `scope`       | string | No       | All scopes | Filter by `local`, `closure`, or `global`                                  |
| `object_path` | string | No       |            | Dot-delimited path to drill into an object (e.g. `request.httpParameters`) |

### debug_evaluate

Evaluate an expression in the context of a halted thread and stack frame.

> **Warning:** Expressions can have side effects (modify variables, call functions). Use with care.

| Parameter     | Type   | Required | Default | Description                       |
| ------------- | ------ | -------- | ------- | --------------------------------- |
| `session_id`  | string | Yes      |         | Session ID                        |
| `thread_id`   | number | Yes      |         | Thread ID                         |
| `frame_index` | number | No       | `0`     | Stack frame index                 |
| `expression`  | string | Yes      |         | JavaScript expression to evaluate |

---

## Higher-Level Tools

### debug_capture_at_breakpoint

Set a breakpoint, wait for it to be hit, and capture a diagnostic snapshot — stack, variables, and optional expression results in a single call. Optionally resumes the thread after capture.

> **Important:** This tool **blocks** until the breakpoint is hit or the timeout expires. The user or an external process must trigger a request on the instance while this tool is waiting.

| Parameter       | Type     | Required | Default | Description                                     |
| --------------- | -------- | -------- | ------- | ----------------------------------------------- |
| `session_id`    | string   | Yes      |         | Session ID                                      |
| `file`          | string   | Yes      |         | File path for the breakpoint                    |
| `line`          | number   | Yes      |         | Line number                                     |
| `condition`     | string   | No       |         | Conditional expression                          |
| `expressions`   | string[] | No       |         | Expressions to evaluate when hit                |
| `timeout_ms`    | number   | No       | 30000   | Timeout waiting for the breakpoint (max 120000) |
| `auto_continue` | boolean  | No       | `false` | Resume the thread after capturing               |

---

## See Also

- [Debug CLI Commands](/cli/debug) — Interactive REPL and RPC mode for the CLI
- [Configuration](../configuration) — Setting up instance credentials
