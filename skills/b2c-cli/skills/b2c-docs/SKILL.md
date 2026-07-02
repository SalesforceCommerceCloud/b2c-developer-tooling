---
name: b2c-docs
description: Search and read B2C Commerce documentation using the b2c CLI. Covers Script API reference (dw.* classes/modules), Developer Center guides (Commerce API, PWA Kit, SFRA, Storefront Next, B2C Commerce), tooling documentation (CLI/MCP/SDK), standard job steps, and XSD schemas. Use this skill for ANY B2C Commerce developer or administrator question that is not already grounded in a loaded skill or the current project context — even if they just say "how do I implement passwordless login" or "what methods does Basket have" or "how do I deploy a PWA Kit bundle" or "what SCAPI endpoints are available for checkout".
---

# B2C Docs Skill

**Use this skill for ANY B2C Commerce developer or administrator question that is not already grounded in a loaded skill or the current project context.** The docs corpus covers Script API reference, Commerce API (SCAPI/OCAPI) integration patterns, storefront framework guides (SFRA, PWA Kit, Storefront Next), job step parameters, authentication flows, and tooling configuration.

Use the `b2c` CLI to search and read B2C Commerce documentation spanning multiple corpora: Script API reference (`dw.*` classes/modules), **Developer Center guides** (conceptual and how-to content across Commerce API, PWA Kit, SFRA, and more), **tooling documentation** (this project's own guides), the **standard (system) job step catalog**, and XSD schemas.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli docs search ProductMgr`).

## Key Features

- **Multi-corpus search** — Search across Script API, Developer Center guides, tooling docs, job steps, and schemas in a unified index
- **Storefront-aware search** — Auto-detects project type (SFRA, PWA Kit, Storefront Next) and boosts relevant documentation
- **Category filtering** — Use `--category` to narrow results to a specific corpus (e.g., `commerce-api`, `pwa-kit-managed-runtime`, `sfra`, `script-api`)
- **Triage metadata** — Search results include `category`, `summary`, `keywords`, and `url` to help identify the right match without reading full content
- **Online guide content** — Developer Center guides are fetched online when you read them (with graceful offline fallback)
- **Content-aware ranking** — BM25-style search indexes titles, section headings, summaries, and keywords for better recall on conceptual questions

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

# Search tooling documentation
b2c docs search "authentication setup" --category tooling

# Limit results
b2c docs search authentication --limit 5

# Search with storefront awareness (auto-detects project type)
b2c docs search "components" --storefront current
b2c docs search "checkout flow" -s auto

# Search SFRA docs only (filter mode hides non-SFRA categories)
b2c docs search "page designer" --storefront cartridges --storefront-mode filter

# Search PWA Kit docs with boost (nothing hidden, but PWA Kit docs rank higher)
b2c docs search "hooks" --storefront pwa-kit-v3

# List all available documentation
b2c docs search --list

# List entries in a specific category
b2c docs search --list --category commerce-api

# List docs relevant to current project's storefront
b2c docs search --list --storefront current

# Bound the entire corpus to specific topics (allowlist; env: SFCC_DOCS_TOPICS)
b2c docs search "login" --topics sfnext,commerce-api
```

> **`--topics` vs `--category`:** `--category` filters a single query; `--topics` (or `SFCC_DOCS_TOPICS`) is an allowlist that bounds the *entire* available corpus — `--category`/`--storefront` narrow within it, and `docs read` won't resolve an id outside it. Pin it to expose only the docs relevant to your project. The MCP server has an equivalent `--docs-topics` startup flag.

### Storefront-Aware Search

The docs search now understands which storefront framework your project uses and automatically favors relevant documentation. This helps surface the right guides for SFRA, PWA Kit, or Storefront Next projects.

**How it works:**
- **Auto-detection**: Use `--storefront current` (or `-s auto`) to detect the project type based on workspace structure
- **Explicit targeting**: Specify `--storefront cartridges` (SFRA), `--storefront pwa-kit-v3` (PWA Kit), or `--storefront storefront-next`
- **Disable awareness**: Use `--storefront all` to search without any storefront preference

**Category mapping:**
- SFRA/cartridges projects → boosts `sfra` category docs
- PWA Kit projects → boosts `pwa-kit-managed-runtime` category docs
- Storefront Next projects → boosts `sfnext` category docs
- Always-relevant categories (shown for any storefront): `commerce-api`, `script-api`, `job-step`, `b2c-commerce`, `tooling`

**Storefront modes (`--storefront-mode`):**
- `boost` (default): Relevant docs rank higher in search results, but all categories remain visible
- `filter`: Only shows categories relevant to the detected or specified storefront (hides framework-specific docs for other frameworks)

**Examples:**
```bash
# Auto-detect and boost relevant docs (default behavior)
b2c docs search "components" --storefront current

# Filter to show only SFRA-relevant docs
b2c docs search "checkout" -s cartridges --storefront-mode filter

# PWA Kit project: boost MRT docs but keep everything visible
b2c docs search "deploy" --storefront pwa-kit-v3
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

| Category | Description | Example IDs |
|----------|-------------|-------------|
| `script-api` | Server-side Script API reference (`dw.*` classes/modules) | `dw.catalog.ProductMgr`, `dw.order.Basket` |
| `commerce-api` | Commerce API (SCAPI/OCAPI) conceptual and how-to guides | `commerce-api/slas-passwordless-login-registration` |
| `pwa-kit-managed-runtime` | PWA Kit and Managed Runtime (MRT) guides | `pwa-kit-managed-runtime/getting-started` |
| `sfra` | Storefront Reference Architecture (SFRA) guides | `sfra/controllers-and-routes` |
| `sfnext` | Storefront Next (deprecated) guides | `sfnext/sfnext-get-started` |
| `b2c-commerce` | General B2C Commerce platform guides | `b2c-commerce/business-manager-overview` |
| `tooling` | B2C CLI, MCP, SDK, and VS Code extension guides | `guide-authentication`, `guide-configuration` |
| `job-step` | Standard (system) job step catalog | `ImportCatalog`, `ExportCatalog`, `job-steps` |

## Common Script API Classes

| Class | Description |
|-------|-------------|
| `dw.catalog.ProductMgr` | Product management and queries |
| `dw.catalog.Product` | Product data and attributes |
| `dw.order.Basket` | Shopping basket operations |
| `dw.order.Order` | Order processing |
| `dw.customer.CustomerMgr` | Customer management |
| `dw.system.Site` | Site configuration |
| `dw.web.URLUtils` | URL generation utilities |

## Common Schemas

| Schema | Description |
|--------|-------------|
| `catalog` | Product catalog import/export |
| `order` | Order data import/export |
| `customer` | Customer data import/export |
| `inventory` | Inventory data import/export |
| `pricebook` | Price book import/export |
| `promotion` | Promotion definitions |
| `coupon` | Coupon codes import/export |
| `jobs` | Job step definitions |

## More Commands

See `b2c docs --help` for a full list of available commands and options.
