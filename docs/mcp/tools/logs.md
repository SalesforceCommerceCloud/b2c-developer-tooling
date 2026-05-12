---
description: MCP tools for fetching and tailing logs on B2C Commerce instances.
---

# Log Tools

MCP tools for inspecting runtime logs on a B2C Commerce instance via WebDAV. Use them to investigate errors after triggering a request, monitor a job run, or audit recent failures. Available in the **CARTRIDGES**, **DIAGNOSTICS**, and **SCAPI** toolsets.

## Authentication

All log tools that read from the instance (`logs_list_files`, `logs_get_recent`, `logs_watch_start`) require WebDAV-capable credentials.

**Required:**
- **Basic Auth** preferred: `hostname`, `username`, and `password` (WebDAV access key) for a Business Manager user with WebDAV log read permission.
- OAuth (client-credentials / implicit) is also supported as a fallback for WebDAV.

**Configuration priority:** Flags → Environment variables → `dw.json` config file

`logs_watch_poll`, `logs_watch_stop`, and `logs_watch_list` operate on server-side state only and do not require fresh credentials per call.

See [Configuration](../configuration) for credential setup.

## When to use which tool

- Quick lookup of recent errors → **`logs_get_recent`**.
- Discover what log prefixes are active on the instance → **`logs_list_files`**.
- Monitor logs across a multi-step action you trigger (storefront request, job, debug session) → start a watch with **`logs_watch_start`**, then drain it with **`logs_watch_poll`**, and finish with **`logs_watch_stop`**. The watch buffers entries between calls so nothing is lost between agent turns.

## Recovery from orphaned watches

Log watches are stateful and live in the MCP server process. Only one watch is allowed per hostname. If an agent loses track of an active watch:

1. **List active watches** — call `logs_watch_list` (no args). It returns all watches with their `watch_id`, `hostname`, `prefixes`, and buffered counts.
2. **Stop orphaned watches** — call `logs_watch_stop` with the `watch_id` to release the underlying tail.
3. **Idle cleanup** — watches inactive for 30 minutes are automatically destroyed.
4. **Restart the MCP server** — last resort; destroys all watch state.

---

## One-shot tools

### logs_list_files

List log files on the instance via WebDAV.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prefixes` | string[] | No | all | Filter by log prefix (e.g., `["error", "customerror"]`) |
| `sort_by` | `"date" \| "name" \| "size"` | No | `date` | Sort field |
| `sort_order` | `"asc" \| "desc"` | No | `desc` | Sort order |

**Returns:** `{count, files: [{name, prefix, size, lastModified, path}]}`.

### logs_get_recent

Fetch recent log entries in a single request/response. Filters (`since`, `level`, `search`) are applied client-side after fetching.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prefixes` | string[] | No | `["error", "customerror"]` | Log prefixes to read |
| `count` | number | No | `50` | Maximum entries to return |
| `since` | string | No | | Relative time (`"5m"`, `"1h"`, `"2d"`) or ISO 8601 |
| `level` | string[] | No | | Filter by level (ERROR, WARN, INFO, DEBUG, FATAL, TRACE) |
| `search` | string | No | | Case-insensitive substring filter |

**Returns:** `{count, entries: [{file, level, timestamp, message, raw}]}`.

---

## Watch lifecycle

### logs_watch_start

Start a background log watch. Returns a `watch_id` immediately. Buffers entries in memory until `logs_watch_poll` drains them.

> **Workflow:** call `logs_watch_start` **before** triggering the action that should produce logs. Otherwise startup may emit only existing entries (controlled by `last_entries`) and miss what you wanted to capture.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prefixes` | string[] | No | `["error", "customerror"]` | Log prefixes to watch |
| `last_entries` | number | No | `1` | Recent entries per file to emit on startup. `0` skips. |
| `poll_interval_ms` | number | No | `3000` | How often the underlying tail polls WebDAV |
| `level` | string[] | No | | Drop entries not matching level before buffering |
| `search` | string | No | | Drop entries not matching substring before buffering |

**Returns:** `{watch_id, hostname, prefixes, started_at}`.

### logs_watch_poll

Drain buffered entries. If the buffer is empty, blocks up to `timeout_ms` waiting for new entries.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `watch_id` | string | Yes | | Watch id from `logs_watch_start` |
| `timeout_ms` | number | No | `5000` | Max time to block when buffer is empty. `0` returns immediately. |
| `max_entries` | number | No | `200` | Maximum entries returned per call |

**Returns:** `{watch_id, entries, files_discovered, files_rotated, errors, truncated, buffered_remaining, dropped_entries, stopped}`. When `truncated` is `true`, call again to drain the rest.

### logs_watch_stop

Stop a watch and release its underlying tail.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watch_id` | string | Yes | Watch id from `logs_watch_start` |

**Returns:** `{watch_id, stopped_at, total_entries_seen}`.

### logs_watch_list

List active watches. Use to recover orphaned watches or inspect buffered counts.

No parameters.

**Returns:** `{watches: [{watch_id, hostname, prefixes, buffered_entries, total_entries_seen, dropped_entries, files_discovered, stopped, created_at, last_activity_at}]}`.

---

## See also

- [`b2c logs tail`](../../cli/logs/tail) — interactive CLI tail
- [`b2c logs get`](../../cli/logs/get) — one-shot CLI fetch
- [`b2c logs list`](../../cli/logs/list) — list log files from the CLI
