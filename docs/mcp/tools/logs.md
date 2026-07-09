---
description: MCP tools for fetching and tailing B2C Commerce instance logs and Managed Runtime (MRT) application logs.
---

# Log Tools

MCP tools for inspecting runtime logs. Two independent sets are covered here:

- **[Instance logs](#instance-logs)** (`logs_*`) — B2C Commerce instance logs read over WebDAV. Supports one-shot fetch and buffered tailing.
- **[MRT logs](#mrt-logs)** (`mrt_logs_*`) — Managed Runtime application logs streamed over a WebSocket. Watch-only (live stream, no historical fetch).

Instance log tools are available in the **CARTRIDGES**, **DIAGNOSTICS**, and **SCAPI** toolsets. MRT log tools are available in the **DIAGNOSTICS**, **PWAV3**, and **STOREFRONTNEXT** toolsets.

---

## Instance logs

Inspect logs on a B2C Commerce instance via WebDAV — investigate errors after triggering a request, monitor a job run, or audit recent failures.

### Authentication

Tools that read from the instance (`logs_list_files`, `logs_get_recent`, `logs_watch_start`) require WebDAV-capable credentials.

**Required:**

- **Basic Auth** preferred: `hostname`, `username`, and `password` (WebDAV access key) for a Business Manager user with WebDAV log read permission.
- OAuth (client-credentials / implicit) is also supported as a fallback for WebDAV.

**Configuration priority:** Flags → Environment variables → `dw.json` config file

`logs_watch_poll`, `logs_watch_stop`, and `logs_watch_list` operate on server-side state only and do not require fresh credentials per call.

See [Configuration](../configuration) for credential setup.

### logs_list_files

List log files on the instance via WebDAV.

| Parameter    | Type                         | Required | Default | Description                                             |
| ------------ | ---------------------------- | -------- | ------- | ------------------------------------------------------- |
| `prefixes`   | string[]                     | No       | all     | Filter by log prefix (e.g., `["error", "customerror"]`) |
| `sort_by`    | `"date" \| "name" \| "size"` | No       | `date`  | Sort field                                              |
| `sort_order` | `"asc" \| "desc"`            | No       | `desc`  | Sort order                                              |

**Returns:** `{count, files: [{name, prefix, size, lastModified, path}]}`.

### logs_get_recent

Fetch recent log entries in a single request/response. Filters (`since`, `level`, `search`) are applied client-side after fetching.

| Parameter  | Type     | Required | Default                    | Description                                              |
| ---------- | -------- | -------- | -------------------------- | -------------------------------------------------------- |
| `prefixes` | string[] | No       | `["error", "customerror"]` | Log prefixes to read                                     |
| `count`    | number   | No       | `50`                       | Maximum entries to return                                |
| `since`    | string   | No       |                            | Relative time (`"5m"`, `"1h"`, `"2d"`) or ISO 8601       |
| `level`    | string[] | No       |                            | Filter by level (ERROR, WARN, INFO, DEBUG, FATAL, TRACE) |
| `search`   | string   | No       |                            | Case-insensitive substring filter                        |

**Returns:** `{count, entries: [{file, level, timestamp, message, raw}]}`.

### logs_watch_start

Start a background log watch. Returns a `watch_id` immediately. Buffers entries in memory until `logs_watch_poll` drains them.

> **Workflow:** call `logs_watch_start` **before** triggering the action that should produce logs. Otherwise startup may emit only existing entries (controlled by `last_entries`) and miss what you wanted to capture.

| Parameter          | Type     | Required | Default                    | Description                                                                                                           |
| ------------------ | -------- | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `prefixes`         | string[] | No       | `["error", "customerror"]` | Log prefixes to watch                                                                                                 |
| `last_entries`     | number   | No       | `0`                        | Pre-existing entries per file to emit on startup. `0` (default) captures only new entries; set >0 for recent context. |
| `poll_interval_ms` | number   | No       | `3000`                     | How often the underlying tail polls WebDAV                                                                            |
| `level`            | string[] | No       |                            | Drop entries not matching level before buffering                                                                      |
| `search`           | string   | No       |                            | Drop entries not matching substring before buffering                                                                  |

**Returns:** `{watch_id, hostname, prefixes, started_at}`.

### logs_watch_poll

Drain buffered entries. If the buffer is empty, blocks up to `timeout_ms` waiting for new entries.

| Parameter     | Type   | Required | Default | Description                                                      |
| ------------- | ------ | -------- | ------- | ---------------------------------------------------------------- |
| `watch_id`    | string | Yes      |         | Watch id from `logs_watch_start`                                 |
| `timeout_ms`  | number | No       | `5000`  | Max time to block when buffer is empty. `0` returns immediately. |
| `max_entries` | number | No       | `200`   | Maximum entries returned per call                                |

**Returns:** `{watch_id, entries, files_discovered, files_rotated, errors, truncated, buffered_remaining, dropped_entries, stopped}`. When `truncated` is `true`, call again to drain the rest.

- `entries`: `[{file, level, timestamp, message, raw}]` — buffered since the last poll.
- `files_discovered` / `files_rotated`: `[{name, prefix, size, lastModified, path}]` — each file is reported once, on the poll after it is discovered/rotated.
- `errors`: `[{message, at}]` where `at` is an ISO 8601 timestamp of when the tail error occurred.
- `dropped_entries`: count of entries evicted (buffer cap) since the last poll; resets to `0` after each poll.

### logs_watch_stop

Stop a watch and release its underlying tail.

| Parameter  | Type   | Required | Description                      |
| ---------- | ------ | -------- | -------------------------------- |
| `watch_id` | string | Yes      | Watch id from `logs_watch_start` |

**Returns:** `{watch_id, stopped_at, total_entries_seen}`.

### logs_watch_list

List active watches. Use to recover orphaned watches or inspect buffered counts.

No parameters.

**Returns:** `{watches: [{watch_id, hostname, prefixes, buffered_entries, total_entries_seen, dropped_entries, files_discovered, stopped, created_at, last_activity_at}]}`.

> **Recovering orphaned watches:** watches live in the MCP server process and only one is allowed per hostname. Call `logs_watch_list` to find a lost watch, then `logs_watch_stop` with its `watch_id`. Idle watches are destroyed after 30 minutes; restarting the MCP server clears all watch state.

---

## MRT logs

Tail real-time application logs from a Managed Runtime (MRT) environment over a WebSocket — watch SSR/server output while reproducing a request, verifying a deployment, or investigating an error on PWA Kit and Storefront Next storefronts.

MRT logs are **always a live stream**: there is no historical fetch and no log files to list. The workflow is watch-only — start a watch, drain it with poll, then stop.

### Authentication

All MRT log tools require MRT API authentication (the same credentials as [`mrt_bundle_push`](./mrt-bundle-push)).

**Required:**

- **MRT API key** — from `--api-key`, the `MRT_API_KEY` environment variable, or `~/.mobify`.
- **Project** — from `--project` / `-p`, `MRT_PROJECT`, or `mrtProject` in `dw.json`.
- **Environment** — from `--environment` / `-e`, `MRT_ENVIRONMENT`, or `mrtEnvironment` in `dw.json`.

**Optional:**

- **Cloud origin** — from `--cloud-origin`, `MRT_CLOUD_ORIGIN`, or `mrtOrigin` in `dw.json` (defaults to `https://cloud.mobify.com`).

`mrt_logs_watch_poll`, `mrt_logs_watch_stop`, and `mrt_logs_watch_list` operate on server-side state only and do not require fresh credentials per call.

See [Configuration](../configuration) for credential setup.

### mrt_logs_watch_start

Start a background tail of the configured MRT environment's logs. Returns a `watch_id` immediately and buffers entries in memory until `mrt_logs_watch_poll` drains them. Project and environment are taken from configuration, not tool parameters.

> **Workflow:** call `mrt_logs_watch_start` **before** triggering the request or SSR action you want to capture. Because MRT logs are a live stream, anything emitted before the watch connects is not captured.

| Parameter | Type     | Required | Default | Description                                                                                                |
| --------- | -------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `level`   | string[] | No       |         | Drop entries not matching these levels (ERROR, WARN, INFO, DEBUG, ...) before buffering. Case-insensitive. |
| `search`  | string   | No       |         | Drop entries not matching this case-insensitive substring (against message and raw) before buffering.      |

**Returns:** `{watch_id, project, environment, started_at}`.

> The CLI `b2c mrt tail-logs --search` treats the pattern as a regex; this MCP tool uses a simpler, safer case-insensitive **substring** match for `search`.

### mrt_logs_watch_poll

Drain buffered entries. If the buffer is empty, blocks up to `timeout_ms` waiting for new entries. Returns immediately if entries are already buffered or the stream has stopped.

| Parameter     | Type   | Required | Default | Description                                                      |
| ------------- | ------ | -------- | ------- | ---------------------------------------------------------------- |
| `watch_id`    | string | Yes      |         | Watch id from `mrt_logs_watch_start`                             |
| `timeout_ms`  | number | No       | `5000`  | Max time to block when buffer is empty. `0` returns immediately. |
| `max_entries` | number | No       | `200`   | Maximum entries returned per call                                |

**Returns:** `{watch_id, entries, errors, truncated, buffered_remaining, dropped_entries, stopped}`. When `truncated` is `true`, call again to drain the rest.

- `entries`: `[{timestamp, requestId, shortRequestId, level, message, raw}]` — parsed MRT log entries buffered since the last poll. `requestId`/`level`/`timestamp` are present when the line can be parsed; `message` and `raw` are always present.
- `errors`: `[{message, at}]` where `at` is an ISO 8601 timestamp of when the WebSocket error occurred.
- `dropped_entries`: count of entries evicted (buffer cap) since the last poll; resets to `0` after each poll.
- `stopped`: `true` once the WebSocket has closed — whether via `mrt_logs_watch_stop`, an idle/server timeout, or a connection failure. When `stopped` is `true`, check `errors` for the reason and start a new watch to resume.

### mrt_logs_watch_stop

Stop a watch and close its WebSocket. Idempotent — stopping an already-stopped watch returns success.

| Parameter  | Type   | Required | Description                          |
| ---------- | ------ | -------- | ------------------------------------ |
| `watch_id` | string | Yes      | Watch id from `mrt_logs_watch_start` |

**Returns:** `{watch_id, stopped_at, total_entries_seen}`.

### mrt_logs_watch_list

List active watches. Use to recover orphaned watches or inspect buffered counts.

No parameters.

**Returns:** `{watches: [{watch_id, project, environment, origin, buffered_entries, total_entries_seen, dropped_entries, stopped, created_at, last_activity_at}]}`.

> **Recovering orphaned watches:** watches live in the MCP server process and only one is allowed per project/environment/origin. Call `mrt_logs_watch_list` to find a lost watch, then `mrt_logs_watch_stop` with its `watch_id`. Idle watches are destroyed after 30 minutes; restarting the MCP server clears all watch state.

---

## See also

- [Logs CLI commands](/cli/logs) — `b2c logs tail` / `get` / `list`
- [MRT CLI commands](/cli/mrt) — `b2c mrt tail-logs` and the rest of the `b2c mrt` command tree
- [mrt_bundle_push](./mrt-bundle-push) — build and deploy MRT bundles
- [Script Debugger](./diagnostics) — step through server-side code with breakpoints
