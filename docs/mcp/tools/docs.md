---
description: MCP tools for searching B2C Commerce documentation including Script API reference, Developer Center guides, tooling docs, job steps, and XSD schemas.
---

# Documentation Tools

MCP tools for searching and reading B2C Commerce documentation across multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual/how-to content), **tooling documentation** (CLI/MCP/SDK guides), **standard job steps**, and XSD schemas. These tools read locally-indexed data shipped with the SDK and fetch Developer Center guide content online. They do **not** require instance configuration or authentication. Available in **every toolset**.

**Use these tools for any B2C Commerce developer or administrator question that is not already grounded in a loaded skill or the current project context** — from Script API method lookups to SCAPI integration patterns, job step parameters, storefront framework guides, and authentication flows.

> **Note:** These tools are payload-conscious for agent use. `docs_search` returns a small default result set with only triage fields; `docs_list` returns a table-of-contents (and just a category directory when unfiltered); `docs_read` truncates long content to a bounded length. Each supports opting into more (`verbose`, `limit`/`offset`, `maxLength`).

> **Restricting available topics:** Launch the server with `--docs-topics <categories>` (or the `SFCC_DOCS_TOPICS` env var) to bound the entire documentation corpus to a comma-separated allowlist (e.g. `--docs-topics sfnext,commerce-api,tooling`). This is a hard configuration boundary — the tools' `category` parameter is narrowed to the allowlist, per-call `category`/`workspace` narrow _within_ it, and `docs_read` will not resolve an id outside it. Unknown category names are ignored with a warning. Use it to expose only the docs relevant to a given project.

---

## Documentation (Multi-Corpus)

### docs_search

The **primary entry point** for documentation. Content-aware search across all corpora using BM25-style ranking. Results are trimmed to the triage-critical fields by default (id, title, category, summary, score); pass `verbose=true` for `keywords` and `url`. The MCP server auto-detects the workspace's storefront framework at startup and surfaces it in this tool's description.

| Parameter   | Type    | Required | Default | Description                                                                                                                                                             |
| ----------- | ------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`     | string  | Yes      |         | Search query (keywords, class name, or topic)                                                                                                                           |
| `limit`     | number  | No       | `5`     | Maximum number of results                                                                                                                                               |
| `verbose`   | boolean | No       | `false` | Include `keywords` and `url` on each result (larger payload)                                                                                                            |
| `category`  | string  | No       | (all)   | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step`                                    |
| `workspace` | string  | No       | `auto`  | Workspace awareness: `auto` (auto-detected), `all` (no preference), or specify one or more types comma-separated: `cartridges`, `sfra`, `pwa-kit-v3`, `storefront-next` |

**Returns:** `{query, category?, workspace?, results: [{id, title, category, summary?, score, keywords?, url?}]}`. Higher `score` = better match (results are pre-sorted best-first). `keywords` and `url` appear only when `verbose=true`. Use `summary` to triage matches before calling `docs_read`.

**Workspace awareness:** By default, the tool uses the auto-detected workspace (shown in the tool description) to boost relevant documentation. A detected or specified workspace always boosts relevant docs (ranks them higher) but never hides categories. To hard-scope results to a category, use the `category` parameter.

**Category boost mapping:**

- Always relevant (any workspace): `b2c-commerce`, `tooling`
- `cartridges` → `script-api`, `job-step`
- `sfra` → `sfra`
- `pwa-kit-v3` → `pwa-kit-managed-runtime`, `commerce-api`
- `storefront-next` → `sfnext`, `commerce-api`

**SFRA vs cartridges distinction:** A SFRA project is detected as both `cartridges` and `sfra` (SFRA is a refinement — it has the `app_storefront_base` cartridge). A cartridge project that is not SFRA (custom API cartridges, or a PWA Kit / Storefront Next repo that also ships cartridges) is `cartridges` only — so it will not boost `sfra` docs.

**Examples:**

- Search with auto-detected workspace: `docs_search(query="components")`
- Search all docs (no workspace preference): `docs_search(query="passwordless login", workspace="all")`
- Filter by category: `docs_search(query="passwordless login", category="commerce-api")`
- Find Script API classes: `docs_search(query="ProductMgr", category="script-api")`
- Search with specific workspace types: `docs_search(query="hooks", workspace="sfra,pwa-kit-v3")`

### docs_read

Read documentation for a specific entry. For Developer Center guides (categories: `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`), content is fetched online from developer.salesforce.com. If the fetch fails, returns the locally-indexed summary, section headings, and URL. Long documents are truncated to `maxLength` characters — page through the rest with `offset` when `truncated` is `true`.

| Parameter   | Type   | Required | Default | Description                                                                                                                                     |
| ----------- | ------ | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`     | string | Yes      |         | Entry ID (e.g., `"dw.catalog.ProductMgr"`, `"sfnext/sfnext-get-started"`, `"commerce-api/slas-passwordless-login-registration"`) or fuzzy query |
| `offset`    | number | No       | `0`     | Character offset to start reading from (for paging long docs)                                                                                   |
| `maxLength` | number | No       | `12000` | Maximum characters of content to return                                                                                                         |

**Returns:** `{entry: {id, title, category, summary?, keywords?, url?, filePath?, preview?}, content: string, totalLength, offset, truncated?, nextOffset?}`. Returns an error result with a hint to use `docs_search` if no match is found. For guides, `content` is fetched online; offline fallback shows summary + headings.

**Examples:**

- Read Script API: `docs_read(query="dw.catalog.ProductMgr")`
- Read guide by ID: `docs_read(query="sfnext/sfnext-get-started")`
- Read the next page of a long guide: `docs_read(query="sfnext/sfnext-get-started", offset=12000)`
- Read job step: `docs_read(query="ImportCatalog")`

### docs_list

Enumerate documentation entries for browsing a known category. Prefer `docs_search` for questions — this tool is for listing a category you already know. Results are a **table of contents** (id + title + category only) and are paginated.

| Parameter   | Type   | Required | Default     | Description                                                                                                                                                                      |
| ----------- | ------ | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `category`  | string | No       | (directory) | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step`                                             |
| `workspace` | string | No       | (directory) | Workspace awareness: `auto` (auto-detected) or specify one or more types comma-separated: `cartridges`, `sfra`, `pwa-kit-v3`, `storefront-next`. Omit for the category directory |
| `limit`     | number | No       | `100`       | Maximum entries per page                                                                                                                                                         |
| `offset`    | number | No       | `0`         | Number of entries to skip (for pagination)                                                                                                                                       |

**Returns (filtered):** `{category, total, offset, count, entries: [{id, title, category}], truncated?, nextOffset?}`.

**Returns (no filter):** a compact category directory — `{note, total, categories: [{category, count}]}` — instead of the full corpus. Pass a `category` (or `workspace`) to list its entries, or use `docs_search`.

---

## XSD Schemas

### docs_schema_search

Fuzzy-search XSD schema ids.

| Parameter | Type   | Required | Default | Description                                                 |
| --------- | ------ | -------- | ------- | ----------------------------------------------------------- |
| `query`   | string | Yes      |         | Schema name or partial match (e.g., `"catalog"`, `"order"`) |
| `limit`   | number | No       | `20`    | Maximum number of results                                   |

**Returns:** `{query, results: [{entry: {id, filePath}, score}]}`.

### docs_schema_read

Read the contents of an XSD schema (raw XML) plus the on-disk path.

| Parameter | Type   | Required | Description             |
| --------- | ------ | -------- | ----------------------- |
| `query`   | string | Yes      | Exact id or fuzzy query |

**Returns:** `{entry: {id, filePath}, content: string, path: string}`. Returns an error result with a hint to use `docs_schema_search` if no match.

### docs_schema_list

List every available XSD schema id.

No parameters.

**Returns:** `{count, entries: [{id, filePath}]}`.

---

## See also

- [Docs CLI commands](/cli/docs) — `b2c docs search` / `read` / `schema`
