---
description: Commands for interactive script debugging on B2C Commerce instances.
---

# Debug Commands

Commands for connecting to the B2C Commerce Script Debugger API (SDAPI) to set breakpoints, inspect variables, and step through server-side code.

## Authentication

All debug commands require **Basic Auth** credentials (username and password) for a Business Manager user with the `WebDAV_Manage_Customization` permission. See [Configuration](/guide/configuration) for details on setting credentials via flags, environment variables, or dw.json.

The script debugger must also be enabled on the instance: Business Manager > Administration > Development Configuration > Script Debugger > Enable.

---

## b2c debug

Start a DAP (Debug Adapter Protocol) debug adapter over stdio. This is used by IDE integrations (VS Code, JetBrains) that speak DAP natively.

### Usage

```bash
b2c debug
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--cartridge-path` | Path to directory containing cartridges | `.` |
| `--client-id` | Client ID for the debugger API | `b2c-cli` |

See [Global Flags](/cli/#global-flags) for authentication and instance flags.

### Examples

```bash
# Start DAP adapter (used by VS Code launch configuration)
b2c debug

# Specify cartridge directory
b2c debug --cartridge-path ./cartridges
```

---

## b2c debug cli

Start an interactive CLI debug session with a REPL interface. Provides a terminal-based debugging experience without requiring a DAP client.

### Usage

```bash
b2c debug cli
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--cartridge-path` | Path to directory containing cartridges | `.` |
| `--client-id` | Client ID for the debugger API | `b2c-cli` |
| `--rpc` | Run in RPC mode (JSONL over stdin/stdout) | `false` |

See [Global Flags](/cli/#global-flags) for authentication and instance flags.

### REPL Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `break <file>:<line> [if <cond>]` | `b` | Set breakpoint |
| `breakpoints` | `bl` | List active breakpoints |
| `delete <id>` | `d` | Delete breakpoint |
| `continue` | `c` | Resume current thread |
| `step` | `s` | Step over |
| `stepin` | `si` | Step into |
| `stepout` | `so` | Step out |
| `stack` | `bt` | Show call stack |
| `frame <n>` | `f` | Select stack frame |
| `vars` | `v` | Show variables in current frame |
| `members <path>` | `m` | Expand object members |
| `eval <expr>` | `e` | Evaluate expression |
| `threads` | `t` | List known threads |
| `thread <id>` | | Switch to thread |
| `help` | `h` | Show commands |
| `quit` | `q` | Disconnect and exit |

### Examples

```bash
# Start interactive debugger
b2c debug cli

# Specify cartridge directory
b2c debug cli --cartridge-path ./cartridges

# Use a custom client ID (for concurrent sessions)
b2c debug cli --client-id my-session

# Start in RPC mode for headless scripts
b2c debug cli --rpc
```

### Interactive Session Example

```
debug> break Cart.js:42
Breakpoint #1 set at ./cartridges/app_storefront/cartridge/controllers/Cart.js:42

debug> break Checkout.js:100 if basket.totalGrossPrice > 100
Breakpoint #2 set at ./cartridges/app_storefront/cartridge/controllers/Checkout.js:100

● Thread 5 halted at ./cartridges/app_storefront/cartridge/controllers/Cart.js:42 in show()

debug> vars
  request: dw.system.Request = [object Request] [local]
  basket: dw.order.Basket = [object Basket] [local]

debug> eval basket.productLineItems.length
3

debug> stack
  → #0  show  ./cartridges/app_storefront/cartridge/controllers/Cart.js:42
    #1  execute  /app_storefront/cartridge/controllers/Cart.js:1

debug> continue
Thread 5 resumed.
```

---

## RPC Mode

When started with `--rpc`, the debug CLI runs as a JSONL-over-stdio RPC server. This enables headless scripts, agents, and other tools to drive the debugger programmatically.

### Protocol

- **Input** (stdin): One JSON object per line (JSONL)
- **Output** (stdout): One JSON object per line — either a response or an async event

### Request Format

```json
{"id": 1, "command": "set_breakpoints", "args": {"breakpoints": [{"file": "Cart.js", "line": 42}]}}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number or string | Optional. Echoed back in the response for correlation. |
| `command` | string | Required. The command to execute. |
| `args` | object | Optional. Command-specific arguments. |

### Response Format

```json
{"id": 1, "result": {"breakpoints": [{"id": 1, "file": "Cart.js", "line": 42, "script_path": "/app_storefront/cartridge/controllers/Cart.js"}]}}
```

On error:

```json
{"id": 1, "error": "No thread selected. Wait for a thread_stopped event."}
```

### Event Format

Events are emitted asynchronously (not in response to a command):

```json
{"event": "ready", "data": {}}
{"event": "thread_stopped", "data": {"thread_id": 5, "location": {"file": "Cart.js", "line": 42, "function_name": "show", "script_path": "/app_storefront/cartridge/controllers/Cart.js"}}}
```

### Available Commands

| Command | Args | Description |
|---------|------|-------------|
| `set_breakpoints` | `breakpoints: [{file, line, condition?}]` | Replace all breakpoints |
| `list_breakpoints` | | List current breakpoints |
| `continue` | `thread_id?` | Resume a halted thread |
| `step_over` | `thread_id?` | Step to next line |
| `step_into` | `thread_id?` | Step into function call |
| `step_out` | `thread_id?` | Step out of function |
| `get_stack` | `thread_id?` | Get call stack frames |
| `get_variables` | `thread_id?, frame_index?, scope?, object_path?` | Get variables |
| `evaluate` | `expression, thread_id?, frame_index?` | Evaluate expression |
| `list_threads` | | List known threads |
| `select_thread` | `thread_id` | Switch current thread |
| `select_frame` | `index` | Switch current frame |

When `thread_id` is omitted, the last thread that halted is used.

### Events

| Event | Description |
|-------|-------------|
| `ready` | Emitted once after connection is established |
| `thread_stopped` | A thread hit a breakpoint or step completed |

### Example Session (Python)

```python
import subprocess, json

proc = subprocess.Popen(
    ["b2c", "debug", "cli", "--rpc"],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE,
    text=True, bufsize=1
)

def send(cmd, args=None, id=None):
    msg = {"command": cmd}
    if args: msg["args"] = args
    if id is not None: msg["id"] = id
    proc.stdin.write(json.dumps(msg) + "\n")
    proc.stdin.flush()

def recv():
    return json.loads(proc.stdout.readline())

# Wait for ready
assert recv()["event"] == "ready"

# Set a breakpoint
send("set_breakpoints", {"breakpoints": [{"file": "Cart.js", "line": 42}]}, id=1)
response = recv()  # {"id": 1, "result": {...}}

# Wait for breakpoint hit (trigger a request on the instance)
event = recv()  # {"event": "thread_stopped", "data": {...}}

# Inspect state
send("get_stack", id=2)
stack = recv()

send("get_variables", id=3)
variables = recv()

# Continue execution
send("continue", id=4)
recv()
```

---

## See Also

- [Configuration](/guide/configuration) - Setting up instance credentials
- [Logs Commands](/cli/logs) - Retrieving server logs for debugging
- [Code Commands](/cli/code) - Deploying code before debugging
