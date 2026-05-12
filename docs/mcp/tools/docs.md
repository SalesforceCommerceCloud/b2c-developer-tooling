---
description: MCP tools for searching B2C Commerce Script API and XSD schema documentation.
---

# Documentation Tools

MCP tools for searching and reading the bundled B2C Commerce Script API documentation and XSD schemas. These tools read data shipped with the SDK — they do **not** require any instance configuration or authentication. Available in **every toolset**.

## When to use which tool

- Look up a class or module — search first to confirm the id, then read.
  - `docs_search` (fuzzy) → `docs_read` (full markdown).
- Look up an XSD schema for an import file (e.g., `system-objecttype-extensions.xml`) — same pattern.
  - `docs_schema_search` → `docs_schema_read`.
- Browse all available entries — `docs_list` / `docs_schema_list`.

> **Note:** `docs_read` and `docs_schema_read` content can be large (full markdown files / full XSD bodies). Prefer `docs_search`/`docs_schema_search` to narrow down before reading.

---

## Script API

### docs_search

Fuzzy-search Script API documentation by class, module, or partial name.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | | Search query (e.g., `"ProductMgr"`, `"dw.catalog"`, `"Status"`) |
| `limit` | number | No | `20` | Maximum number of results |

**Returns:** `{query, results: [{entry: {id, title, filePath, preview?}, score}]}`. Lower `score` = better match.

### docs_read

Read full markdown documentation for a Script API class or module.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Exact id (e.g., `"dw.catalog.ProductMgr"`) or fuzzy query |

**Returns:** `{entry: {id, title, filePath, preview?}, content: string}`. Returns an error result with a hint to use `docs_search` if no match is found.

### docs_list

List every available Script API documentation entry.

No parameters.

**Returns:** `{count, entries: [{id, title, filePath, preview?}]}`. Output is large; prefer `docs_search` for targeted lookups.

---

## XSD Schemas

### docs_schema_search

Fuzzy-search XSD schema ids.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | | Schema name or partial match (e.g., `"catalog"`, `"order"`) |
| `limit` | number | No | `20` | Maximum number of results |

**Returns:** `{query, results: [{entry: {id, filePath}, score}]}`.

### docs_schema_read

Read the contents of an XSD schema (raw XML) plus the on-disk path.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Exact id or fuzzy query |

**Returns:** `{entry: {id, filePath}, content: string, path: string}`. Returns an error result with a hint to use `docs_schema_search` if no match.

### docs_schema_list

List every available XSD schema id.

No parameters.

**Returns:** `{count, entries: [{id, filePath}]}`.

---

## See also

- [Docs CLI commands](/cli/docs) — `b2c docs search` / `read` / `schema`
