---
description: Search, read, and download B2C Commerce documentation including Script API reference, Developer Center guides, XSD schemas, and job steps.
---

# Docs Commands

Commands for searching and reading B2C Commerce documentation spanning multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual/how-to content across Commerce API, PWA Kit, SFRA, and more), **tooling documentation** (this project's own guides), the **standard (system) job step** catalog, and bundled XSD schemas. Download fresh Script API documentation from an instance.

**Use these commands for any B2C Commerce developer or administrator question that is not already grounded in your project context** — from Script API method lookups to SCAPI integration patterns, job step parameters, storefront framework guides, and authentication flows.

The bundled corpus searched by `docs search` / `docs read` includes:

- **Script API reference** — `dw.*` classes/modules for server-side scripting. Script API entries include durable permalinks to developer.salesforce.com pages (both .html for browsing and .md for content, though the content itself is bundled in the CLI).
- **Developer Center guides** — conceptual and how-to content from B2C Commerce Developer Center, organized into categories: `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`
- **Tooling guides** — documentation for this CLI, MCP server, SDK, and VS Code extension (category: `tooling`)
- **Standard job steps** — built-in job step type IDs (for example `ImportCatalog`, `ExportCatalog`, `ImportInventoryLists`) that you add to Business Manager job flows. Read the catalog overview with `b2c docs read job-steps`, or a specific step with `b2c docs read <TypeID>`. See the `b2c-cli:b2c-job` and `b2c:b2c-custom-job-steps` skills for how standard steps fit into job flows.
- **XSD schemas** — import/export data format definitions

Search results include `category`, `summary`, `keywords`, `url`, and `sourceUrl` fields to help triage matches before reading full content. Each documentation entry with a public page carries both `url` (the `.html` page for browser viewing) and `sourceUrl` (the raw `.md` source). When you `docs read` a Developer Center guide, its content is fetched online from the `sourceUrl` (with a graceful offline fallback to the indexed summary + headings).

## Authentication

| Operation       | Auth Required                     |
| --------------- | --------------------------------- |
| `docs search`   | None (uses local bundled docs)    |
| `docs read`     | None (bundled docs + online fetch for guides)    |
| `docs schema`   | None (uses local bundled schemas) |
| `docs download` | Instance + WebDAV credentials     |

For `b2c docs download`, configure instance and WebDAV access:

```bash
export SFCC_SERVER=my-sandbox.demandware.net
export SFCC_USERNAME=your-username
export SFCC_PASSWORD=your-password
```

In addition to these topic-specific options, all commands also support [global flags](./index#global-flags).

---

## b2c docs search

Search documentation across all corpora using content-aware BM25-style ranking. Results include metadata (category, summary, keywords, url) to help triage matches.

### Usage

```bash
b2c docs search [query]
```

### Arguments

| Argument | Description                                   | Required                              |
| -------- | --------------------------------------------- | ------------------------------------- |
| `query`  | Search query (keywords, class name, or topic) | No (required unless `--list` is used) |

### Flags

| Flag               | Description                                                                                                                                                                                 | Default |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `--limit`, `-l`    | Maximum number of results to display                                                                                                                                                        | `20`    |
| `--category`, `-c` | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step`                                                        | (none)  |
| `--workspace`      | Workspace awareness: `auto` (default, auto-detects project type), `all` (disable), or specify one or more types comma-separated: `cartridges`, `sfra`, `pwa-kit-v3`, `storefront-next`. Boosts relevant categories and de-boosts competing storefront frameworks      | `auto`  |
| `--topics`         | Allowlist that bounds the whole corpus to these categories (comma-separated; env `SFCC_DOCS_TOPICS`). `--category`/`--workspace` narrow within it; unknown names are ignored with a warning | (all)   |
| `--list`           | List all available documentation entries                                                                                                                                                    | `false` |
| `--columns`        | Columns to display (comma-separated). Available: id, title, category, summary, keywords, url, sourceUrl, score                                                                                         | `id, category, title, score`  |
| `--extended`, `-x` | Show all columns including extended fields                                                                                                                                                  | `false` |

### Examples

```bash
# Search across all documentation
b2c docs search "passwordless login"

# Filter by category for targeted results
b2c docs search "passwordless login" --category commerce-api

# Search Developer Center guides
b2c docs search "storefront components" --category sfra

# Search Script API reference
b2c docs search ProductMgr --category script-api

# Search PWA Kit / MRT documentation
b2c docs search "deploy bundle" --category pwa-kit-managed-runtime

# Find a standard job step by name
b2c docs search ImportCatalog

# Limit result count
b2c docs search authentication --limit 5

# List all available entries
b2c docs search --list

# List entries in a specific category
b2c docs search --list --category tooling

# List with workspace awareness — note that --list does NOT auto-detect; it narrows only when --workspace is specified
b2c docs search --list --workspace sfra

# Workspace awareness is ON by default — search auto-detects the project type
b2c docs search "components"

# Opt out of workspace awareness entirely
b2c docs search "components" --workspace all

# Force auto-detection explicitly
b2c docs search "hooks" --workspace auto

# Search with specific workspace types (boosts relevant docs)
b2c docs search "checkout flow" --workspace sfra

# Search for multiple workspace types (union of their boost categories)
b2c docs search "api integration" --workspace cartridges,pwa-kit-v3

# Bound the whole corpus to specific topics (an allowlist, not a per-query filter)
b2c docs search "login" --topics sfnext,commerce-api

# Or pin it via the environment (applies to every docs search/read in the shell)
export SFCC_DOCS_TOPICS=sfra,commerce-api,script-api,tooling
b2c docs search "checkout"
```

> Search is content-aware — it indexes titles, section headings, summaries, and keywords. Developer Center guides have LLM-generated summaries and keywords for improved discoverability.

### Restricting available topics (`--topics`)

`--topics` (or the `SFCC_DOCS_TOPICS` env var) is a **launch-time allowlist that bounds the entire available corpus** — distinct from the per-query `--category` filter and the soft `--workspace` boost. When set, only those categories are ever reachable; `--category` and `--workspace` narrow _within_ the allowlist (their intersection wins), and `docs read` will not resolve an id outside it. Unknown category names are ignored with a warning. Use it to pin the docs surface to exactly the topics relevant to your project (for example, an SFRA team can drop PWA Kit and Storefront Next guides entirely). The equivalent for the MCP server is the `--docs-topics` startup flag.

### Workspace-Aware Search

Workspace-aware search favors documentation relevant to your project type, and is **on by default** — `docs search` auto-detects the workspace framework unless you say otherwise:

- **Auto-detection (default, or `--workspace auto`)**: Detects the project type from the workspace structure and boosts relevant documentation categories
- **Framework-specific**: Specify one or more workspace types comma-separated: `cartridges`, `sfra`, `pwa-kit-v3`, or `storefront-next`. Multiple types union their boost categories (never sum scores)
- **Disable awareness**: Use `--workspace all` to search without any workspace preference

**Category boost mapping:**

- Always relevant (any workspace): `b2c-commerce`, `tooling`
- `cartridges` → `script-api`, `job-step`
- `sfra` → `sfra`
- `pwa-kit-v3` → `pwa-kit-managed-runtime`, `commerce-api`
- `storefront-next` → `sfnext`, `commerce-api`

**SFRA vs cartridges distinction:** A SFRA project is detected as both `cartridges` and `sfra` (SFRA is a refinement — it has the `app_storefront_base` cartridge). A cartridge project that is not SFRA (custom API cartridges, or a PWA Kit / Storefront Next repo that also ships cartridges) is `cartridges` only — so it will not boost `sfra` docs.

A detected or specified workspace always **boosts** relevant docs (ranks them higher) but never hides categories. To hard-scope results to a category, use `--category` or `--topics`.

Workspace awareness never filters or hides categories — it only reweights results by applying a x1.4 boost to relevant categories and a x0.3 de-boost to competing storefront frameworks (sfra, pwa-kit-managed-runtime, sfnext that are not the detected/specified workspace).

### Output

Default output is a table with `id`, `category`, `title`, and `score` columns. Use `--extended` or `--columns` to show `summary`, `keywords`, `url`, and `sourceUrl` fields. With `--list`, output shows all entries with their metadata plus a total count.

---

## b2c docs read

Read documentation for a specific entry. For Developer Center guides, content is fetched online from developer.salesforce.com (with graceful offline fallback showing summary + headings + URL if the network fetch fails).

### Usage

```bash
b2c docs read <query>
```

### Arguments

| Argument | Description                                           | Required |
| -------- | ----------------------------------------------------- | -------- |
| `query`  | Entry ID, class/module name, or search query to match | Yes      |

### Flags

| Flag          | Description                                                                                                                          | Default |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `--raw`, `-r` | Output raw markdown (no terminal rendering)                                                                                          | `false` |
| `--topics`    | Allowlist that bounds readable docs to these categories (comma-separated; env `SFCC_DOCS_TOPICS`). An id outside it will not resolve | (all)   |

### Examples

```bash
# Read a Script API class doc
b2c docs read ProductMgr

# Read by fully qualified name
b2c docs read dw.catalog.ProductMgr

# Read a Developer Center guide by namespaced ID
b2c docs read sfnext/sfnext-get-started
b2c docs read commerce-api/slas-passwordless-login-registration

# Read a standard job step's purpose + configuration parameters
b2c docs read ImportCatalog

# Read the standard job step catalog overview
b2c docs read job-steps

# Read a tooling guide
b2c docs read guide-authentication

# Output raw markdown for piping
b2c docs read ProductMgr --raw

# JSON output with selected entry + content
b2c docs read ProductMgr --json
```

### Output

By default, markdown is rendered for terminal display. Raw markdown is emitted when using `--raw` (or when output is not a TTY). For Developer Center guides, the command fetches full content online from the sourceUrl (.md); if the fetch fails, it displays the locally-indexed summary, section headings, and the url (.html) for manual browsing.

---

## b2c docs schema

Read bundled XSD schemas (import/export data format definitions).

### Usage

```bash
b2c docs schema [query]
```

### Arguments

| Argument | Description                                                   | Required                              |
| -------- | ------------------------------------------------------------- | ------------------------------------- |
| `query`  | Schema name or partial match (for example `catalog`, `order`) | No (required unless `--list` is used) |

### Flags

| Flag           | Description                                                    | Default |
| -------------- | -------------------------------------------------------------- | ------- |
| `--list`, `-l` | List all available schemas                                     | `false` |
| `--path`, `-p` | Print the filesystem path to the schema instead of its content | `false` |

### Examples

```bash
# Read a specific schema
b2c docs schema catalog

# Fuzzy match by schema name
b2c docs schema order

# List available schemas
b2c docs schema --list

# JSON output
b2c docs schema catalog --json

# Get the filesystem path to a schema
b2c docs schema catalog --path
```

### Output

Without `--json`, the command writes schema XML directly to stdout. With `--path`, it prints the resolved filesystem path (useful for passing to XML validation tools). With `--list`, it prints available schema IDs and a total count.

### Validating XML with xmllint

Use the `--path` flag to pass schema paths directly to `xmllint` for XML validation (requires installation of `xmllint`):

```bash
xmllint --schema "$(b2c docs schema catalog --path)" catalog.xml --noout
```

---

## b2c docs download

Download Script API documentation from a B2C Commerce instance to a local directory.

### Usage

```bash
b2c docs download <output>
```

### Arguments

| Argument | Description                               | Required |
| -------- | ----------------------------------------- | -------- |
| `output` | Local output directory for extracted docs | Yes      |

### Flags

| Flag             | Description                                       | Default |
| ---------------- | ------------------------------------------------- | ------- |
| `--keep-archive` | Keep the downloaded archive file after extraction | `false` |

In addition to [global flags](./index#global-flags), this command supports [instance flags](./index#instance-flags) and authentication flags for WebDAV access.

### Examples

```bash
# Download docs to a local directory
b2c docs download ./docs

# Keep the downloaded archive
b2c docs download ./docs --keep-archive

# Specify instance hostname directly
b2c docs download ./my-docs --server sandbox.demandware.net

# JSON output
b2c docs download ./docs --json
```

### Output

The command reports the number of extracted files and output path. If `--keep-archive` is set, it also prints the saved archive location.
