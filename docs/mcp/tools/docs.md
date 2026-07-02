---
description: MCP tools for searching B2C Commerce documentation including Script API reference, Developer Center guides, tooling docs, job steps, and XSD schemas.
---

# Documentation Tools

MCP tools for searching and reading B2C Commerce documentation across multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual/how-to content), **tooling documentation** (CLI/MCP/SDK guides), **standard job steps**, and XSD schemas. These tools read locally-indexed data shipped with the SDK and fetch Developer Center guide content online. They do **not** require instance configuration or authentication. Available in **every toolset**.

**Use these tools for any B2C Commerce developer or administrator question that is not already grounded in a loaded skill or the current project context** — from Script API method lookups to SCAPI integration patterns, job step parameters, storefront framework guides, and authentication flows.

> **Note:** These tools are payload-conscious for agent use. `docs_search` returns a small default result set with only triage fields; `docs_list` returns a table-of-contents (and just a category directory when unfiltered); `docs_read` truncates long content to a bounded length. Each supports opting into more (`verbose`, `limit`/`offset`, `maxLength`).

---

## Documentation (Multi-Corpus)

### docs_search

The **primary entry point** for documentation. Content-aware search across all corpora using BM25-style ranking. Results are trimmed to the triage-critical fields by default (id, title, category, summary, score); pass `verbose=true` for `keywords` and `url`. The MCP server auto-detects the workspace's storefront framework at startup and surfaces it in this tool's description.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | | Search query (keywords, class name, or topic) |
| `limit` | number | No | `5` | Maximum number of results |
| `verbose` | boolean | No | `false` | Include `keywords` and `url` on each result (larger payload) |
| `category` | string | No | (all) | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step` |
| `storefront` | string | No | `current` | Storefront awareness: `current` (auto-detected), `all` (no preference), or specify `cartridges`, `pwa-kit-v3`, `storefront-next` |
| `storefrontMode` | string | No | `boost` | How storefront context affects results: `boost` (rank relevant docs higher) or `filter` (hide irrelevant docs) |

**Returns:** `{query, category?, storefront?, results: [{id, title, category, summary?, score, keywords?, url?}]}`. Higher `score` = better match (results are pre-sorted best-first). `keywords` and `url` appear only when `verbose=true`. Use `summary` to triage matches before calling `docs_read`.

**Storefront awareness:** By default, the tool uses the auto-detected storefront (shown in the tool description) to boost relevant documentation. SFRA/cartridges projects boost `sfra` docs, PWA Kit projects boost `pwa-kit-managed-runtime`, and Storefront Next projects boost `sfnext`. Always-relevant categories (`commerce-api`, `script-api`, `job-step`, `b2c-commerce`, `tooling`) are shown regardless of storefront. Use `storefrontMode: "filter"` to hide irrelevant categories entirely.

**Examples:**
- Search with auto-detected storefront: `docs_search(query="components")`
- Search all docs (no storefront preference): `docs_search(query="passwordless login", storefront="all")`
- Filter by category: `docs_search(query="passwordless login", category="commerce-api")`
- Find Script API classes: `docs_search(query="ProductMgr", category="script-api")`
- Search PWA Kit guides only (filter mode): `docs_search(query="deploy bundle", storefront="pwa-kit-v3", storefrontMode="filter")`

### docs_read

Read documentation for a specific entry. For Developer Center guides (categories: `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`), content is fetched online from developer.salesforce.com. If the fetch fails, returns the locally-indexed summary, section headings, and URL. Long documents are truncated to `maxLength` characters — page through the rest with `offset` when `truncated` is `true`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | | Entry ID (e.g., `"dw.catalog.ProductMgr"`, `"sfnext/sfnext-get-started"`, `"commerce-api/slas-passwordless-login-registration"`) or fuzzy query |
| `offset` | number | No | `0` | Character offset to start reading from (for paging long docs) |
| `maxLength` | number | No | `12000` | Maximum characters of content to return |

**Returns:** `{entry: {id, title, category, summary?, keywords?, url?, filePath?, preview?}, content: string, totalLength, offset, truncated?, nextOffset?}`. Returns an error result with a hint to use `docs_search` if no match is found. For guides, `content` is fetched online; offline fallback shows summary + headings.

**Examples:**
- Read Script API: `docs_read(query="dw.catalog.ProductMgr")`
- Read guide by ID: `docs_read(query="sfnext/sfnext-get-started")`
- Read the next page of a long guide: `docs_read(query="sfnext/sfnext-get-started", offset=12000)`
- Read job step: `docs_read(query="ImportCatalog")`

### docs_list

Enumerate documentation entries for browsing a known category. Prefer `docs_search` for questions — this tool is for listing a category you already know. Results are a **table of contents** (id + title + category only) and are paginated.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | (directory) | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step` |
| `storefront` | string | No | (directory) | Storefront awareness: `current` (auto-detected) or specify `cartridges`, `pwa-kit-v3`, `storefront-next`. Omit for the category directory |
| `limit` | number | No | `100` | Maximum entries per page |
| `offset` | number | No | `0` | Number of entries to skip (for pagination) |

**Returns (filtered):** `{category, total, offset, count, entries: [{id, title, category}], truncated?, nextOffset?}`.

**Returns (no filter):** a compact category directory — `{note, total, categories: [{category, count}]}` — instead of the full corpus. Pass a `category` (or `storefront`) to list its entries, or use `docs_search`.

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
