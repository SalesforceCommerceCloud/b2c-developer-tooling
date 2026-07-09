---
name: b2c-docs
description: Search and read B2C Commerce documentation using the b2c CLI. Covers Script API reference (dw.* classes/modules), Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), Salesforce Help (Business Manager administration and merchandising), tooling documentation (CLI/MCP/SDK), standard job steps, and XSD schemas. Use this skill for ANY B2C Commerce developer or administrator question that is not already grounded in a loaded skill or the current project context — even if they just say "how do I implement passwordless login" or "what methods does Basket have" or "how do I deploy a PWA Kit bundle" or "how do I import a site archive" or "what SCAPI endpoints are available for checkout".
---

# B2C Docs Skill

**Use this skill for ANY B2C Commerce developer or administrator question that is not already grounded in a loaded skill or the current project context.** The docs corpus covers Script API reference, Commerce API (SCAPI/OCAPI) integration patterns, storefront framework guides (SFRA, PWA Kit, Storefront Next), Business Manager administration and merchandising (Salesforce Help), job step parameters, authentication flows, and tooling configuration.

Use the `b2c` CLI to search and read B2C Commerce documentation spanning multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual and how-to content across Commerce API, PWA Kit, SFRA, and more), **Salesforce Help** (Business Manager administration and merchandising content from help.salesforce.com), **tooling documentation** (this project's own guides), the **standard (system) job step catalog**, and XSD schemas.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli docs search ProductMgr`).

> **MCP parity:** If the `b2c-dx-mcp` server is connected, its docs tools — `docs_search`, `docs_read`, `docs_list`, `docs_schema_search`, `docs_schema_read`, and `docs_schema_list` — cover the same corpus with the same search, workspace-awareness, and topic-scoping behavior described here.

## Key Features

- **Multi-corpus search** — Search across Script API, Developer Center guides, Salesforce Help (admin + merchandising), tooling docs, job steps, and schemas in a unified index
- **Workspace-aware search** — Auto-detects project type (cartridges, SFRA, PWA Kit, Storefront Next) and boosts relevant documentation while de-boosting competing storefront frameworks
- **Category filtering** — Use `--category` to narrow results to a specific corpus (e.g., `commerce-api`, `pwa-kit-managed-runtime`, `sfra`, `script-api`, `help-admin`, `help-merchant`)
- **Triage metadata** — Search results include `category`, `summary`, `keywords`, and `url` to help identify the right match without reading full content
- **Online content with local cache** — Script API, Developer Center guides, and Salesforce Help are fetched online when you read them and cached locally (memory + on-disk, 7-day TTL) so repeat reads avoid the network; graceful offline fallback shows the summary + headings + both URLs
- **Content-aware ranking** — BM25-style search indexes titles, section headings, summaries, and keywords for better recall on conceptual questions
- **Dual URLs** — Every publicly-available doc entry carries both `url` (human-facing .html page) and `sourceUrl` (raw .md source). Script API entries link developer.salesforce.com; Salesforce Help entries link the live help.salesforce.com article while content is served from a raw markdown mirror. Content is fetched via sourceUrl with offline fallback
- **Topic allowlist** — Bound the entire corpus to chosen categories via `--topics` flag or `SFCC_DOCS_TOPICS` env var, or the `docsCategories` config field (dw.json `docs-categories`, `SFCC_DOCS_CATEGORIES`, package.json). The MCP server has a `--docs-topics` startup flag
- **Payload-conscious defaults** — MCP tools limit result count (5) and return lean fields by default; CLI defaults to 20 results; verbose mode adds extended fields

## Examples

### Search Documentation

```bash
# Search across all documentation
b2c docs search "passwordless login"

# Filter by category for targeted results
b2c docs search "passwordless login" --category commerce-api

# Search Developer Center guides
b2c docs search "storefront components" --category sfra
b2c docs search "deploy bundle" --category pwa-kit-managed-runtime

# Search Script API reference
b2c docs search ProductMgr --category script-api
b2c docs search "catalog product"

# Find a standard job step by type ID
b2c docs search ImportCatalog

# Search Salesforce Help — administration (import/export, jobs, security, Account Manager)
b2c docs search "site import export" --category help-admin

# Search Salesforce Help — merchandising (catalogs, promotions, search, pricing)
b2c docs search "price book assignment" --category help-merchant

# Search tooling documentation
b2c docs search "authentication setup" --category tooling

# Limit results (CLI default is 20, MCP default is 5)
b2c docs search authentication --limit 5

# Show extended fields (url, sourceUrl, summary, keywords)
b2c docs search authentication --columns id,title,category,url,summary
# or use -x for extended output
b2c docs search authentication -x

# Workspace awareness is ON by default — search auto-detects the project type
b2c docs search "components"

# Opt out of workspace awareness
b2c docs search "components" --workspace all

# Force auto-detection explicitly
b2c docs search "hooks" --workspace auto

# Search with specific workspace types (boosts relevant docs)
b2c docs search "page designer" --workspace sfra

# Search with multiple workspace types (union of their boost categories)
b2c docs search "checkout" --workspace cartridges,pwa-kit-v3

# List all available documentation
b2c docs search --list

# List entries in a specific category
b2c docs search --list --category commerce-api

# List docs relevant to a specific workspace (list does not auto-detect)
b2c docs search --list --workspace cartridges

# Bound the entire corpus to specific topics (allowlist; env: SFCC_DOCS_TOPICS)
b2c docs search "login" --topics sfnext,commerce-api
```

> **`--topics` vs `--category`:** `--category` filters a single query; `--topics` (CLI flag or `SFCC_DOCS_TOPICS` env var) is an allowlist that bounds the _entire_ available corpus — `--category`/`--workspace` narrow within it, and `docs read` won't resolve an id outside it. Pin it to expose only the docs relevant to your project. **The MCP server has an equivalent `--docs-topics` startup flag and `SFCC_DOCS_TOPICS` env var.**

### Workspace-Aware Search

The docs search understands which workspace framework your project uses and automatically favors relevant documentation. This helps surface the right guides for SFRA, PWA Kit, or Storefront Next projects, and is **on by default**.

**How it works:**

- **Auto-detection (default)**: `docs search` detects the project type from the workspace structure automatically; pass `--workspace auto` to force it explicitly
- **Explicit targeting**: Specify one or more workspace types comma-separated: `cartridges`, `sfra`, `pwa-kit-v3`, or `storefront-next`. Multiple types union their boost categories
- **Disable awareness**: Use `--workspace all` to search without any workspace preference

**Category boost mapping:**

- Always relevant (any workspace): `b2c-commerce`, `tooling`
- `cartridges` → `script-api`, `job-step`
- `sfra` → `sfra`
- `pwa-kit-v3` → `pwa-kit-managed-runtime`, `commerce-api`
- `storefront-next` → `sfnext`, `commerce-api`

**De-boost competing frameworks:** When a workspace is detected or specified, the search engine de-boosts (x0.3) storefront framework guides that are NOT the current one. For example, if workspace is `sfra`, then `pwa-kit-managed-runtime` and `sfnext` categories are de-boosted; this reweights results without hiding them.

**SFRA vs cartridges distinction:** A SFRA project is detected as both `cartridges` and `sfra` (SFRA is a refinement — it has the `app_storefront_base` cartridge). A cartridge project that is not SFRA (custom API cartridges, or a PWA Kit / Storefront Next repo that also ships cartridges) is `cartridges` only — so it will not boost `sfra` docs.

A detected or specified workspace always **boosts** relevant docs (ranks them higher) but never hides categories. To hard-scope results to a category, use `--category` or `--topics`.

**`--list` behavior:** When using `--list` to browse the catalog, workspace auto-detection is **disabled** — the list shows the full corpus unless you explicitly pass `--workspace <type>` to narrow it.

**Examples:**

```bash
# Auto-detect and boost relevant docs (default behavior)
b2c docs search "components"

# Search with specific workspace type
b2c docs search "checkout" --workspace sfra

# Search with multiple workspace types
b2c docs search "deploy" --workspace pwa-kit-v3,storefront-next
```

### Read Documentation

```bash
# Read Script API documentation
b2c docs read ProductMgr
b2c docs read dw.catalog.ProductMgr

# Read Developer Center guides by namespaced ID
b2c docs read sfnext/sfnext-get-started
b2c docs read commerce-api/slas-passwordless-login-registration
b2c docs read pwa-kit-managed-runtime/getting-started

# Read tooling guides
b2c docs read guide-authentication
b2c docs read guide-configuration

# Output raw markdown (for piping)
b2c docs read ProductMgr --raw

# Output as JSON
b2c docs read ProductMgr --json
```

> **Content sources:** Developer Center guides and tooling docs are fetched **online** from the .md source (sourceUrl) with a graceful offline fallback (summary + headings + link). Script API and job-step content is **bundled** in the CLI.

To retrieve the human-facing .html page URL (for citing/opening in browser) or the raw .md source URL, use `--json` output or `--columns url,sourceUrl` in search results.

### Standard Job Step Catalog

The bundled corpus includes the catalog of **standard (system) job step type IDs** — the built-in steps (for example `ImportCatalog`, `ExportCatalog`, `ImportInventoryLists`) added to Business Manager job flows. Each step's page lists its purpose and configuration parameters (required, defaults, allowed values).

```bash
# Read the catalog overview (all standard step type IDs)
b2c docs read job-steps

# Read a specific step's purpose + configuration parameters
b2c docs read ImportCatalog

# Search for a step
b2c docs search "import price"
b2c docs search ExportInventoryLists --category job-step
```

For how standard steps fit into job flows — chaining with custom steps, IMPEX file hand-off, and when to use an in-flow step vs. the CLI equivalent — see the `b2c:b2c-custom-job-steps` and `b2c-cli:b2c-job` skills.

### Download Documentation

Download the latest Script API documentation from a B2C Commerce instance. The CLI auto-discovers the target server and credentials from `dw.json`, `SFCC_*` env vars, and configuration plugins — `--server` is only needed to override. Run `b2c setup inspect` to confirm what the CLI sees; see the `b2c-cli:b2c-config` skill for troubleshooting.

```bash
# Download to a directory (uses configured instance)
b2c docs download ./my-docs

# Override server explicitly
b2c docs download ./docs --server sandbox.demandware.net

# Keep the original archive
b2c docs download ./docs --keep-archive
```

### Read XSD Schemas

Read bundled XSD schema files for import/export data formats:

```bash
# Read a schema by name
b2c docs schema catalog

# Fuzzy match schema name
b2c docs schema order

# List all available schemas
b2c docs schema --list

# Print the filesystem path to the schema file
b2c docs schema catalog --path

# Validate an XML file against a schema using xmllint
xmllint --schema "$(b2c docs schema catalog --path)" my-catalog.xml --noout
```

## Documentation Categories

| Category                  | Description                                               | Example IDs                                         |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `script-api`              | Server-side Script API reference (`dw.*` classes/modules) | `dw.catalog.ProductMgr`, `dw.order.Basket`          |
| `commerce-api`            | Commerce API (SCAPI/OCAPI) conceptual and how-to guides   | `commerce-api/slas-passwordless-login-registration` |
| `pwa-kit-managed-runtime` | PWA Kit and Managed Runtime (MRT) guides                  | `pwa-kit-managed-runtime/getting-started`           |
| `sfra`                    | Storefront Reference Architecture (SFRA) guides           | `sfra/controllers-and-routes`                       |
| `sfnext`                  | Storefront Next (deprecated) guides                       | `sfnext/sfnext-get-started`                         |
| `b2c-commerce`            | General B2C Commerce platform guides                      | `b2c-commerce/business-manager-overview`            |
| `tooling`                 | B2C CLI, MCP, SDK, and VS Code extension guides           | `guide-authentication`, `guide-configuration`       |
| `job-step`                | Standard (system) job step catalog                        | `ImportCatalog`, `ExportCatalog`, `job-steps`       |
| `help-admin`              | Salesforce Help — administration/ops (import/export, jobs, replication, security, Account Manager, permissions, logs, inventory) | `help-admin/b2c_site_import_export`                 |
| `help-merchant`           | Salesforce Help — merchandising (catalogs, products, promotions, search, content, analytics, SEO)                                | `help-merchant/b2c_creating_price_books`            |

> **URLs:** All categories except `job-step` carry both `url` (human .html page) and `sourceUrl` (machine-readable .md). For `help-admin`/`help-merchant`, `url` is the live help.salesforce.com article and content is read from `sourceUrl`. `job-step` entries have neither (content is bundled inline).
>
> **Caching:** Content for the online corpora (`script-api`, the guide categories, `help-admin`/`help-merchant`, `tooling`) is fetched on `docs read` and cached locally. Use `b2c docs cache` to inspect it and `b2c docs cache --clear` to purge it (forces a re-fetch).

## Common Script API Classes

| Class                     | Description                    |
| ------------------------- | ------------------------------ |
| `dw.catalog.ProductMgr`   | Product management and queries |
| `dw.catalog.Product`      | Product data and attributes    |
| `dw.order.Basket`         | Shopping basket operations     |
| `dw.order.Order`          | Order processing               |
| `dw.customer.CustomerMgr` | Customer management            |
| `dw.system.Site`          | Site configuration             |
| `dw.web.URLUtils`         | URL generation utilities       |

## Common Schemas

| Schema      | Description                   |
| ----------- | ----------------------------- |
| `catalog`   | Product catalog import/export |
| `order`     | Order data import/export      |
| `customer`  | Customer data import/export   |
| `inventory` | Inventory data import/export  |
| `pricebook` | Price book import/export      |
| `promotion` | Promotion definitions         |
| `coupon`    | Coupon codes import/export    |
| `jobs`      | Job step definitions          |

## More Commands

See `b2c docs --help` for a full list of available commands and options.
