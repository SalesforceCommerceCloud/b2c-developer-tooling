---
description: Search, read, and download B2C Commerce documentation including Script API reference, Developer Center guides, XSD schemas, and job steps.
---

# Docs Commands

Commands for searching and reading B2C Commerce documentation spanning multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual/how-to content across Commerce API, PWA Kit, SFRA, and more), **tooling documentation** (this project's own guides), the **standard (system) job step** catalog, and bundled XSD schemas. Download fresh Script API documentation from an instance.

**Use these commands for any B2C Commerce developer or administrator question that is not already grounded in your project context** — from Script API method lookups to SCAPI integration patterns, job step parameters, storefront framework guides, and authentication flows.

The bundled corpus searched by `docs search` / `docs read` includes:

- **Script API reference** — `dw.*` classes/modules for server-side scripting
- **Developer Center guides** — conceptual and how-to content from B2C Commerce Developer Center, organized into categories: `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`
- **Tooling guides** — documentation for this CLI, MCP server, SDK, and VS Code extension (category: `tooling`)
- **Standard job steps** — built-in job step type IDs (for example `ImportCatalog`, `ExportCatalog`, `ImportInventoryLists`) that you add to Business Manager job flows. Read the catalog overview with `b2c docs read job-steps`, or a specific step with `b2c docs read <TypeID>`. See the `b2c-cli:b2c-job` and `b2c:b2c-custom-job-steps` skills for how standard steps fit into job flows.
- **XSD schemas** — import/export data format definitions

Search results now include `category`, `summary`, `keywords`, and `url` fields to help triage matches before reading full content. Developer Center guide content is fetched online when you `docs read` a guide entry (with graceful offline fallback).

## Authentication

| Operation       | Auth Required                     |
| --------------- | --------------------------------- |
| `docs search`   | None (uses local bundled docs)    |
| `docs read`     | None (uses local bundled docs)    |
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

| Flag                       | Description                                                                                                      | Default |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| `--limit`, `-l`            | Maximum number of results to display                                                                             | `20`    |
| `--category`, `-c`         | Filter by category: `script-api`, `commerce-api`, `pwa-kit-managed-runtime`, `sfnext`, `sfra`, `b2c-commerce`, `tooling`, `job-step` | (none)  |
| `--storefront`, `-s`       | Storefront awareness: `auto` (or `current`) detects project type, `all` disables, or specify `cartridges`, `pwa-kit-v3`, `storefront-next` | `all`   |
| `--storefront-mode`        | How storefront context affects results: `boost` (rank relevant docs higher) or `filter` (hide irrelevant docs)  | `boost` |
| `--list`                   | List all available documentation entries                                                                         | `false` |
| `--columns`                | Columns to display (comma-separated). Available: id, title, category, summary, keywords, url, score              | (none)  |
| `--extended`, `-x`         | Show all columns including extended fields                                                                       | `false` |

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

# Search with storefront awareness (auto-detects project type)
b2c docs search "components" --storefront current

# Search SFRA docs only (filter mode)
b2c docs search "checkout flow" -s cartridges --storefront-mode filter

# Search PWA Kit docs (boost mode — nothing hidden, but PWA Kit docs rank higher)
b2c docs search "hooks" --storefront pwa-kit-v3
```

> Search is content-aware — it indexes titles, section headings, summaries, and keywords. Developer Center guides have LLM-generated summaries and keywords for improved discoverability.

### Storefront-Aware Search

The `--storefront` flag enables storefront-aware search that favors documentation relevant to your project type:

- **Auto-detection** (`auto` or `current`): Detects the project's storefront framework and boosts relevant documentation categories
- **Framework-specific**: Specify `cartridges` (SFRA), `pwa-kit-v3` (PWA Kit), or `storefront-next` (Storefront Next) to target a framework
- **Disable awareness**: Use `all` to search without any storefront preference

**Category mapping:**
- SFRA/cartridges projects → boosts `sfra` category
- PWA Kit projects → boosts `pwa-kit-managed-runtime` category  
- Storefront Next projects → boosts `sfnext` category
- Always-relevant categories (shown for any storefront): `commerce-api`, `script-api`, `job-step`, `b2c-commerce`, `tooling`

**Storefront modes:**
- `boost` (default): Relevant docs rank higher, but all categories remain visible
- `filter`: Only shows categories relevant to the detected or specified storefront

### Output

Default output is a table with `ID`, `Title`, `Category`, and `Match` score. Use `--extended` or `--columns` to show `Summary`, `Keywords`, and `URL` fields. With `--list`, output shows all entries with their metadata plus a total count.

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

| Flag          | Description                                 | Default |
| ------------- | ------------------------------------------- | ------- |
| `--raw`, `-r` | Output raw markdown (no terminal rendering) | `false` |

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

By default, markdown is rendered for terminal display. Raw markdown is emitted when using `--raw` (or when output is not a TTY). For Developer Center guides, the command fetches full content online; if the fetch fails, it displays the locally-indexed summary, section headings, and URL.

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
