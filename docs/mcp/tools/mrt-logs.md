---
description: MCP tools for tailing application logs from Managed Runtime (MRT) environments.
---

# MRT Log Tools

MCP tools for tailing real-time application logs from a Managed Runtime (MRT) environment over a WebSocket. Use them to watch SSR/server output while you reproduce a request, verify a deployment, or investigate an error on PWA Kit and Storefront Next storefronts. Available in the **DIAGNOSTICS**, **PWAV3**, and **STOREFRONTNEXT** toolsets.

MRT logs are **always a live stream** — there is no historical fetch and no log files to list (unlike the [SFCC instance log tools](./logs)). The workflow is therefore watch-only: start a watch, drain it with poll, then stop.

## Authentication

All MRT log tools require MRT API authentication (the same credentials as `mrt_bundle_push`).

**Required:**
- **MRT API key** — from `--api-key`, the `MRT_API_KEY` environment variable, or `~/.mobify`.
- **Project** — from `--project` / `-p`, `MRT_PROJECT`, or `mrtProject` in `dw.json`.
- **Environment** — from `--environment` / `-e`, `MRT_ENVIRONMENT`, or `mrtEnvironment` in `dw.json`.

**Optional:**
- **Cloud origin** — from `--cloud-origin`, `MRT_CLOUD_ORIGIN`, or `mrtOrigin` in `dw.json` (defaults to `https://cloud.mobify.com`).

`mrt_logs_watch_poll`, `mrt_logs_watch_stop`, and `mrt_logs_watch_list` operate on server-side state only and do not require fresh credentials per call.

See [Configuration](../configuration) for credential setup.

## Recovery from orphaned watches

Log watches are stateful and live in the MCP server process. Only one watch is allowed per project/environment/origin. If an agent loses track of an active watch:

1. **List active watches** — call `mrt_logs_watch_list` (no args). It returns all watches with their `watch_id`, `project`, `environment`, and buffered counts.
2. **Stop orphaned watches** — call `mrt_logs_watch_stop` with the `watch_id` to close the underlying WebSocket.
3. **Idle cleanup** — watches inactive for 30 minutes are automatically destroyed.
4. **Restart the MCP server** — last resort; destroys all watch state.

---

## Watch lifecycle

### mrt_logs_watch_start

Start a background tail of the configured MRT environment's logs. Returns a `watch_id` immediately and buffers entries in memory until `mrt_logs_watch_poll` drains them.

> **Workflow:** call `mrt_logs_watch_start` **before** triggering the request or SSR action you want to capture. Because MRT logs are a live stream, anything emitted before the watch connects is not captured.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `level` | string[] | No | | Drop entries not matching these levels (ERROR, WARN, INFO, DEBUG, ...) before buffering. Case-insensitive. |
| `search` | string | No | | Drop entries not matching this case-insensitive substring (against message and raw) before buffering. |

Project and environment are taken from configuration (flags / env vars / `dw.json`), not tool parameters.

**Returns:** `{watch_id, project, environment, started_at}`.

> The CLI `b2c mrt tail-logs --search` treats the pattern as a regex; this MCP tool uses a simpler, safer case-insensitive **substring** match for `search`.

### mrt_logs_watch_poll

Drain buffered entries. If the buffer is empty, blocks up to `timeout_ms` waiting for new entries. Returns immediately if entries are already buffered or the stream has stopped.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `watch_id` | string | Yes | | Watch id from `mrt_logs_watch_start` |
| `timeout_ms` | number | No | `5000` | Max time to block when buffer is empty. `0` returns immediately. |
| `max_entries` | number | No | `200` | Maximum entries returned per call |

**Returns:** `{watch_id, entries, errors, truncated, buffered_remaining, dropped_entries, stopped}`. When `truncated` is `true`, call again to drain the rest.

- `entries`: `[{timestamp, requestId, shortRequestId, level, message, raw}]` — parsed MRT log entries buffered since the last poll. `requestId`/`level`/`timestamp` are present when the line can be parsed; `message` and `raw` are always present.
- `errors`: `[{message, at}]` where `at` is an ISO 8601 timestamp of when the WebSocket error occurred.
- `dropped_entries`: count of entries evicted (buffer cap) since the last poll; resets to `0` after each poll.
- `stopped`: `true` once the WebSocket has closed — whether via `mrt_logs_watch_stop`, an idle/server timeout, or a connection failure. When `stopped` is `true`, check `errors` for the reason and start a new watch to resume.

### mrt_logs_watch_stop

Stop a watch and close its WebSocket. Idempotent — stopping an already-stopped watch returns success.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `watch_id` | string | Yes | Watch id from `mrt_logs_watch_start` |

**Returns:** `{watch_id, stopped_at, total_entries_seen}`.

### mrt_logs_watch_list

List active watches. Use to recover orphaned watches or inspect buffered counts.

No parameters.

**Returns:** `{watches: [{watch_id, project, environment, origin, buffered_entries, total_entries_seen, dropped_entries, stopped, created_at, last_activity_at}]}`.

---

## See also

- [SFCC instance log tools](./logs) — `logs_watch_*` for B2C Commerce instance logs via WebDAV
- [mrt_bundle_push](./mrt-bundle-push) — build and deploy MRT bundles
- [MRT CLI commands](/cli/mrt) — `b2c mrt tail-logs` and the rest of the `b2c mrt` command tree
