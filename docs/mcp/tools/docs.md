---
description: MCP tools for searching B2C Commerce documentation including Script API reference, Developer Center guides, tooling docs, job steps, and XSD schemas.
---

# Documentation Tools

MCP tools for searching and reading B2C Commerce documentation across multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual/how-to content), **tooling documentation** (CLI/MCP/SDK guides), **standard job steps**, and XSD schemas. These tools read locally-indexed data shipped with the SDK and fetch Developer Center guide content online. They do **not** require instance configuration or authentication. Available in **every toolset**.

> **Note:** `docs_read` and `docs_schema_read` content can be large (full markdown files / full XSD bodies). Prefer `docs_search`/`docs_schema_search` to narrow down before reading. Search results include `category`, `summary`, `keywords`, and `url` fields to help triage matches without reading full content.

---

## Documentation (Multi-Corpus)

### docs_search

Content-aware search across all documentation corpora using BM25-style ranking. Results include triage metadata (category, summary, keywords, url).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | | Search query (keywords, class name, or topic) |
| `limit` | number | No | `20` | Maximum number of results |
| `category` | string | No | (all) | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step` |

**Returns:** `{query, category?, results: [{entry: {id, title, category, summary?, keywords?, url?, filePath?, preview?}, score}]}`. Higher `score` = better match (results are pre-sorted best-first). Use `summary`, `keywords`, and `url` fields to triage matches before calling `docs_read`.

**Examples:**
- Search across all docs: `docs_search(query="passwordless login")`
- Filter by category: `docs_search(query="passwordless login", category="commerce-api")`
- Find Script API classes: `docs_search(query="ProductMgr", category="script-api")`
- Search PWA Kit guides: `docs_search(query="deploy bundle", category="pwa-kit-managed-runtime")`

### docs_read

Read full documentation for a specific entry. For Developer Center guides (categories: `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`), content is fetched online from developer.salesforce.com. If the fetch fails, returns the locally-indexed summary, section headings, and URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Entry ID (e.g., `"dw.catalog.ProductMgr"`, `"sfnext/sfnext-get-started"`, `"commerce-api/slas-passwordless-login-registration"`) or fuzzy query |

**Returns:** `{entry: {id, title, category, summary?, keywords?, url?, filePath, preview?}, content: string}`. Returns an error result with a hint to use `docs_search` if no match is found. For guides, `content` is fetched online; offline fallback shows summary + headings.

**Examples:**
- Read Script API: `docs_read(query="dw.catalog.ProductMgr")`
- Read guide by ID: `docs_read(query="sfnext/sfnext-get-started")`
- Read job step: `docs_read(query="ImportCatalog")`

### docs_list

List every available documentation entry across all corpora.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | string | No | (all) | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step` |

**Returns:** `{count, category?, entries: [{id, title, category, summary?, keywords?, url?, filePath, preview?}]}`. Output is large; prefer `docs_search` for targeted lookups.

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
