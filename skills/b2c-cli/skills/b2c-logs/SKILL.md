---
name: b2c-logs
description: Retrieve and search logs from B2C Commerce instances using the b2c CLI. Use this skill whenever the user needs to view server logs, search for errors, filter log entries by level or time, or monitor logs in real-time. Also use when the user reports a 500 error, broken checkout, failing job, or any server-side issue that needs log investigation — even if they just say "something's broken on the sandbox" or "check the logs".
persona: operator
category: Observability & Diagnostics
tags: [logging, diagnostics, debugging, cli]
alsoFor: [developer]
---

# B2C Logs Skill

Use the `b2c` CLI to retrieve and monitor log files on Salesforce B2C Commerce instances. The `logs get` command is designed for agent-friendly, non-interactive log retrieval with structured JSON output.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli logs get`).

## Configuration & Authentication

The CLI auto-discovers the target instance and credentials from `SFCC_*` environment variables, `dw.json` in the current or parent directories, `~/.mobify`, `package.json`, and configuration plugins. **Flags like `--server`, `--client-id`, `--client-secret`, `--username`, and `--password` are usually unnecessary** — only pass them to override what's auto-detected.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (use `--json` for scripting, `--unmask` to reveal secrets). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

## Agent-Friendly Log Retrieval

The `logs get` command is optimized for coding agents:
- Exits immediately after retrieving logs (non-interactive)
- Supports `--json` for structured output
- Filters by time, level, and text search
- Auto-normalizes file paths for IDE click-to-open

## Examples

### Get Recent Logs

```bash
# Get last 20 entries from error and customerror logs (default)
b2c logs get

# Get last 50 entries
b2c logs get --count 50

# JSON output for programmatic parsing
b2c logs get --json
```

### Filter by Time

```bash
# Entries from the last 5 minutes
b2c logs get --since 5m

# Entries from the last 1 hour
b2c logs get --since 1h

# Entries from the last 2 days
b2c logs get --since 2d

# Entries after a specific time (ISO 8601)
b2c logs get --since "2026-01-25T10:00:00"
```

### Filter by Log Level

```bash
# Only ERROR level entries
b2c logs get --level ERROR

# ERROR and FATAL entries
b2c logs get --level ERROR --level FATAL
```

### Search Text

```bash
# Search for "OrderMgr" in messages
b2c logs get --search OrderMgr

# Search for payment errors
b2c logs get --search "PaymentProcessor"
```

### Combined Filters

```bash
# Recent errors containing "PaymentProcessor"
b2c logs get --since 1h --level ERROR --search "PaymentProcessor" --json

# Last hour of errors and fatals from specific log types
b2c logs get --filter error --filter warn --since 1h --level ERROR --level FATAL
```

### List Available Log Files

```bash
# List all log files
b2c logs list

# List specific log types
b2c logs list --filter error --filter customerror

# List logs in a subdirectory (path-like filter)
b2c logs list --filter internal/server

# JSON output
b2c logs list --json
```

### Real-Time Tailing (Human Use)

For interactive log monitoring (not for agents):

```bash
# Tail error and customerror logs
b2c logs tail

# Tail specific log types
b2c logs tail --filter debug --filter error

# Tail only ERROR and FATAL level entries
b2c logs tail --level ERROR --level FATAL

# Tail with text search
b2c logs tail --search "PaymentProcessor"

# Combined filtering
b2c logs tail --filter customerror --level ERROR --search "OrderMgr"

# Stop with Ctrl+C
```

## Downloading Full Log Files

To download the complete log file, use the `file` field from the JSON output with `b2c-cli:b2c-webdav`:

```bash
b2c webdav get error-odspod-0-appserver-20260126.log --root=logs -o -
```

## JSON Output Structure

When using `--json`, `logs get` returns:

```json
{
  "count": 1,
  "entries": [
    {
      "file": "error-odspod-0-appserver-20260126.log",
      "timestamp": "2026-01-26 04:38:03.022 GMT",
      "level": "ERROR",
      "message": "PipelineCallServlet|156679877|Sites-Site|...",
      "raw": "[2026-01-26 04:38:03.022 GMT] ERROR PipelineCallServlet|..."
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `file` | Source log file name (use with `b2c-cli:b2c-webdav` to download full file) |
| `level` | Log level: ERROR, WARN, INFO, DEBUG, FATAL, TRACE |
| `timestamp` | Entry timestamp |
| `message` | Log message (paths normalized for IDE click-to-open) |
| `raw` | Raw unprocessed log line |

## Log Types

Common log file prefixes:

| Prefix | Description |
|--------|-------------|
| `error` | System errors |
| `customerror` | Custom script errors (`Logger.error()`) |
| `warn` | Warnings |
| `debug` | Debug output (when enabled) |
| `info` | Informational messages |
| `jobs` | Job execution logs |
| `api` | API problems and violations |
| `deprecation` | Deprecated API usage |
| `quota` | Quota warnings |

The prefixes above are the **built-in** log files. In addition, any script that logs through a *custom logger category* writes to its own dedicated file with a `custom-` prefix — **distinct from `customerror`**. Integration and job code (payment gateways, ERP/OMS/CRM syncs, feed and import jobs) almost always logs this way, so the entry you need for a triage is frequently in a `custom-*` file, not in `error`/`customerror`.

Custom log file names follow this pattern:

```
custom-<prefix>-<hostname>-appserver-<date>.log
```

The `<prefix>` segment is the **first argument** passed to `Logger.getLogger(prefix, category)` in the emitting code, so it maps a log file straight back to the code that wrote it:

| Code | Log file | Filter to read it |
|------|----------|-------------------|
| `Logger.getLogger('PaymentProcessor', 'payment')` | `custom-PaymentProcessor-*.log` | `--filter custom-PaymentProcessor` |
| `Logger.getLogger('PimTaxImport', 'tax')` | `custom-PimTaxImport-*.log` | `--filter custom-PimTaxImport` |
| `Logger.getLogger('orderexport', 'export')` | `custom-orderexport-*.log` | `--filter custom-orderexport` |

(The second argument is the log *category*, used for configuration; it does not appear in the file name.) For the authoring side — how to create these loggers — see the `b2c:b2c-logging` skill.

> **Note:** `--filter` does a **prefix (starts-with) match** on a file's log category, not an exact match — so `--filter custom-` sweeps every `custom-*` file, and `--filter custom-Payment` also matches `custom-PaymentProcessor`. The category is extracted by taking everything up to the *second* dash, so a custom logger name is treated as word characters only (no dashes): a file named `custom-payment-gateway-*.log` is seen as category `custom-payment`. To read one specific custom log, filter on its full extracted prefix (e.g. `--filter custom-PimTaxImport`); to sweep them all, use `--filter custom-`.

## Discovering Custom Log Files

Because custom log files are not covered by the default `error`/`customerror` retrieval, discover them explicitly when investigating an integration or job:

```bash
# 1. Enumerate all log files, or narrow to just custom ones
b2c logs list
b2c logs list --filter custom

# 2. Scan the output for an unfamiliar custom-* prefix whose size or
#    last-modified time grew when the incident started, then read it
b2c logs get --filter custom-PimTaxImport --since 1h

# 3. Read all custom logs at once when you don't yet know the prefix
b2c logs get --filter custom-
```

`b2c logs list` reports each file with its size and last-modified timestamp, which is the fastest way to spot the custom logger that lit up during an incident. Once you have the prefix, `--filter custom-<prefix>` (or a bare `--filter custom-` to sweep them all) reads the entries.

If `logs list` output is incomplete or you want to confirm the raw `*.log` filenames on the instance, fall back to WebDAV:

```bash
# Enumerate log filenames directly over WebDAV
b2c webdav ls --root logs
```

## Logs in Subdirectories

The `Logs/` directory contains subdirectories such as `internal/` (e.g. `server`, `ccp`, `health`, `csrf-violations`, `internalquota`). These are **not** listed by default. To reach them, pass a path-like `--filter` (one containing a `/`): the tooling then recurses into that subdirectory and matches files by their path relative to `Logs/`.

```bash
# All "server" logs under internal/
b2c logs list --filter internal/server

# Everything under internal/ (trailing slash)
b2c logs tail --filter internal/

# Mix a subdirectory filter with normal prefix filters
b2c logs get --filter error --filter internal/server
```

This works the same across `logs list`, `logs get`, and `logs tail` (and the equivalent MCP tools).

## More Commands

See `b2c logs --help` for all available commands and options.

## Related Skills

- `b2c-cli:b2c-webdav` - Direct WebDAV file access for downloading full log files
- `b2c-cli:b2c-config` - Verify configuration and credentials
- `b2c:b2c-logging` - Authoring side: how server-side code creates custom logger categories that produce `custom-*` log files
