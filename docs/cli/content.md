---
description: Commands for exporting, listing, validating, and pushing Page Designer content, managing library content assets and folders, and managing content slot configurations in B2C Commerce.
---

# Content Commands

Commands for working with Page Designer content libraries, content assets and folders, metadefinitions, and content slots.

[![B2C CLI exporting MarketStreet's About Us template from an instance: one page, two components, two content blocks, and one downloaded image.](/terminal/content-export.png)](/terminal/content-export.png)

Export a page from your instance with its nested components, reusable content blocks, and images.

## Authentication

The `content export` and `content list` commands require OAuth authentication:

| Operation                                                                                      | Auth Required                                                         |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `content export`                                                                               | OAuth for the export job and WebDAV access for the archive and assets |
| `content list`                                                                                 | OAuth for the export job and WebDAV access for the archive            |
| `content validate`                                                                             | None (local file validation)                                          |
| `content types list`, `content types get`                                                      | SCAPI: `sfcc.experiences` or `sfcc.experiences.rw`                    |
| `content push`                                                                                 | SCAPI: `sfcc.experiences.rw`                                          |
| `content asset get`, `content folder list`                                                     | SCAPI: `sfcc.experiences` or `sfcc.experiences.rw`                    |
| `content folder get`, and changes to assets and folders                                        | SCAPI: `sfcc.experiences.rw`                                          |
| `content slot list`, `content slot get`, `content slot config list`, `content slot config get` | SCAPI: `sfcc.experiences` or `sfcc.experiences.rw`                    |
| `content slot config put`, `update`, `delete`                                                  | SCAPI: `sfcc.experiences.rw`                                          |

Online exports and listings use SCAPI when configured, requiring `sfcc.jobs.rw` and the tenant scope. `--api-backend ocapi` selects OCAPI explicitly; the default `auto` mode supports OCAPI fallback. See [Job Authentication](./jobs.md#authentication) for setup.

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
```

`content types`, `content push`, `content asset`, `content folder`, and `content slot` use the SCAPI Admin Experiences API (`experience/experiences/v1`). They need an API client using client credentials or JWT, with the `sfcc.experiences.rw` scope (or read-only `sfcc.experiences` for the read commands), the tenant scope, and a configured short code and tenant ID. Browser sign-in is not supported for these commands. Without these scopes, the other content commands keep working as before.

The `content export` and `content list` commands also support a `--library-file` flag for offline use with a local XML file, which skips authentication entirely.

For complete setup instructions, see the [Authentication Guide](/guide/authentication).

---

## b2c content export

Export Page Designer pages with their component trees and static assets from a content library.

The command fetches the library XML from the instance (via a site archive export job), parses the page/component tree structure, filters by the specified page IDs, downloads referenced static assets via WebDAV, and writes the result to a local directory as a re-importable site archive.

### Usage

```bash
b2c content export [PAGES...] --library <library-id>
```

### Arguments

| Argument | Description                                                                              | Required |
| -------- | ---------------------------------------------------------------------------------------- | -------- |
| `PAGES`  | One or more content IDs to export (pages, content assets, components, or content blocks) | Yes      |

### Flags

In addition to [global flags](./index#global-flags):

| Flag                                   | Description                                                                                                       | Default               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------- |
| `--library`                            | Library ID or site ID. Also configurable via `content-library` in dw.json.                                        |                       |
| `--output`, `-o`                       | Output directory                                                                                                  | `content-<timestamp>` |
| `--site-library` / `--no-site-library` | Treat the library as a site-private library. Defaults from a matching `libraries` config entry, otherwise `false` | from config           |
| `--asset-query`, `-q`                  | JSON dot-paths for static asset extraction (can be repeated)                                                      | `image.path`          |
| `--regex`, `-r`                        | Treat page IDs as regular expressions                                                                             | `false`               |
| `--folder`                             | Filter by folder classification (can be repeated)                                                                 |                       |
| `--offline`                            | Skip asset downloads                                                                                              | `false`               |
| `--library-file`                       | Use a local library XML file instead of fetching from instance                                                    |                       |
| `--keep-orphans`                       | Include orphan components (not linked to any page) in export                                                      | `false`               |
| `--show-tree`                          | Display tree structure of exported content                                                                        | `true`                |
| `--timeout`                            | Export job timeout in seconds                                                                                     |                       |
| `--dry-run`                            | Preview export without downloading assets or writing files                                                        | `false`               |

### Examples

```bash
# Export a single page from a shared library
b2c content export homepage --library SharedLibrary --server my-sandbox.demandware.net

# Export multiple pages
b2c content export homepage about-us contact --library SharedLibrary

# Export pages matching a regex pattern
b2c content export "hero-.*" "promo-.*" --library SharedLibrary --regex

# Export a specific component by ID
b2c content export hero-banner --library SharedLibrary

# Export from a site-private library
b2c content export homepage --library RefArch --site-library -o ./export

# Preview what would be exported without downloading
b2c content export homepage --library SharedLibrary --dry-run

# Export with JSON output
b2c content export homepage --library SharedLibrary --json

# Export from a local XML file (no instance connection needed)
b2c content export homepage --library SharedLibrary --library-file ./library.xml --offline

# Filter by folder classification
b2c content export homepage --library SharedLibrary --folder seasonal --folder holiday

# Custom asset extraction paths
b2c content export homepage --library SharedLibrary -q "image.path" -q "video.url"

# Using environment variables and dw.json config
export SFCC_SERVER=my-sandbox.demandware.net
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
b2c content export homepage

# With a libraries config entry (see below) marking the site library as
# site-private, --site-library is inferred automatically:
b2c content export homepage --library SiteGenesis
```

### Configuring multiple libraries

Listing libraries under `b2c.libraries` in `package.json` (or `libraries` in `dw.json`) lets the CLI pick a default library and infer `--site-library` per entry. Bare strings are shared libraries; `{id, siteLibrary: true}` marks a site-private library. Both forms can be mixed:

```json
{
  "b2c": {
    "libraries": ["RefArchSharedLibrary", {"id": "SiteGenesis", "siteLibrary": true}]
  }
}
```

With this config:

```bash
# Uses RefArchSharedLibrary (first entry) as the default library
b2c content export hero-banner

# --site-library is inferred from the matching entry
b2c content export homepage --library SiteGenesis

# Explicit flag still overrides the config
b2c content export homepage --library SiteGenesis --no-site-library
```

### Output

The command displays:

1. A tree visualization of the exported content (pages, components, content blocks, and assets)
2. Asset download progress with success/failure indicators
3. A summary line listing counts by type, e.g.: `Exported: 2 pages, 1 content asset, 5 components, 1 content block, 3 static assets to ./export`

With `--json`, returns a structured result including the library tree, output path, downloaded/failed asset lists, and counts.

### Notes

- The `--library` flag can be set in `dw.json` as `content-library` or in `package.json` under `b2c.contentLibrary` to avoid passing it every time. You can also list libraries under `b2c.libraries` (mixed strings or `{id, siteLibrary?}` objects); when the resolved library matches an entry marked `siteLibrary: true`, `--site-library` defaults to true automatically. The CLI flag still wins when passed explicitly
- Use `b2c content list` to discover available page IDs before exporting
- You can export pages, content assets, individual components, or content blocks by their content ID. When a component or content-block ID is specified, it is promoted to the root of the export with its full child tree
- **Content blocks** are Page Designer "content blocks" — reusable `fragment.*`-typed content shared across pages. They are listed distinctly in the tree as `(CONTENT BLOCK)` and counted separately in the summary. A content block can be exported by its ID just like a component; a Layout content block retains its region children
- The `--asset-query` flag specifies JSON dot-notation paths within component data to extract static asset references. The default `image.path` covers the common Page Designer image component pattern
- Use `*` in asset query paths to traverse arrays (e.g., `slides.*.image.path`)

---

## b2c content list

List pages and content items in a content library. Useful for discovering page IDs before running an export.

[![B2C CLI displaying a sample library's pages, nested components, and image assets as a tree.](/terminal/content-tree.png)](/terminal/content-tree.png)

Inspect the same page and component structure from an instance or a local library XML file.

### Usage

```bash
b2c content list --library <library-id>
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag                                   | Description                                                                                                       | Default     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| `--library`                            | Library ID or site ID. Also configurable via `content-library` in dw.json.                                        |             |
| `--site-library` / `--no-site-library` | Treat the library as a site-private library. Defaults from a matching `libraries` config entry, otherwise `false` | from config |
| `--library-file`                       | Use a local library XML file instead of fetching from instance                                                    |             |
| `--type`                               | Filter by node type: `page`, `content`, `component`, or `fragment` (content blocks)                               |             |
| `--components`                         | Include components in table output                                                                                | `false`     |
| `--tree`                               | Show tree structure instead of table                                                                              | `false`     |
| `--timeout`                            | Job timeout in seconds                                                                                            |             |
| `--columns`, `-c`                      | Columns to display (comma-separated). Available: id, type, typeId, children                                       | All columns |
| `--extended`, `-x`                     | Show all columns including extended fields                                                                        | `false`     |

### Examples

```bash
# List all content in a library
b2c content list --library SharedLibrary --server my-sandbox.demandware.net

# List only pages
b2c content list --library SharedLibrary --type page

# List only content blocks (the deduplicated catalog, including unlinked blocks)
b2c content list --library SharedLibrary --type fragment

# List including components
b2c content list --library SharedLibrary --components

# Show tree structure
b2c content list --library SharedLibrary --tree

# List from a site-private library
b2c content list --library RefArch --site-library

# With a libraries config entry marking the site library as site-private,
# --site-library is inferred automatically (see "b2c content export"
# above for an example b2c.libraries config):
b2c content list --library SiteGenesis

# List from a local XML file
b2c content list --library SharedLibrary --library-file ./library.xml

# JSON output
b2c content list --library SharedLibrary --json
```

### Output

Default table output:

```
ID               TYPE        TYPE ID            CHILDREN
homepage         PAGE        page.storePage     5
about-us         PAGE        page.storePage     3
footer           CONTENT                        2
```

With `--components`, components are included in the table output alongside pages and content items.

With `--tree`, displays a hierarchical tree visualization:

```
homepage (typeId: page.storePage)
├── component.heroBanner (hero-banner)
│   └── /images/hero.jpg (STATIC ASSET)
└── component.productGrid (product-grid)
about-us (typeId: page.storePage)
└── component.textBlock (text-block)
    └── /images/about.png (STATIC ASSET)
footer-content (CONTENT ASSET)
```

Pages show `id (typeId: type)`, components show `typeId (id)`, content blocks show `displayName (CONTENT BLOCK: typeId)`, content assets show `id (CONTENT ASSET)`, and static assets show `path (STATIC ASSET)`. The tree uses color when output to a terminal: page names are bold, component type IDs are cyan, content-block names are magenta, asset paths are green, and tree connectors are dim.

> **Content blocks** (`fragment.*`-typed content) are reusable, shared singletons. `--type fragment` lists the deduplicated catalog of all content blocks in the library (including blocks not currently linked to any page), since they are not root-level content items.

With `--json`, returns `{ data: [...] }` with each item containing `id`, `type`, `typeId`, and `children` count.

---

## b2c content validate

Validate Page Designer metadefinition JSON files against schemas. This is a local-only command — no instance connection or authentication is required.

The command auto-detects the schema type using file path conventions (`experience/pages/` → pagetype, `experience/components/` → componenttype) and falls back to inspecting the JSON properties. You can also specify the type explicitly with `--type`.

### Usage

```bash
b2c content validate <files...>
b2c content validate --page <files...> [--types-dir <dir>...]
```

### Arguments

| Argument | Description                                           | Required |
| -------- | ----------------------------------------------------- | -------- |
| `files`  | One or more file paths, directories, or glob patterns | Yes      |

When a directory is passed, all `*.json` files within it are validated recursively.

### Flags

In addition to [global flags](./index#global-flags):

| Flag           | Description                                                                                                          | Default           |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `--type`, `-t` | Schema type to validate against (skips auto-detection)                                                               | Auto-detected     |
| `--page`       | Validate page bodies (page JSON or exported library XML) against page and component types instead of metadefinitions | `false`           |
| `--types-dir`  | Directory searched for cartridge `experience/` type definitions in `--page` mode (repeatable)                        | Current directory |

Available schema types: `pagetype`, `componenttype`, `aspecttype`, `cmsrecord`, `customeditortype`, `contentassetpageconfig`, `contentassetcomponentconfig`, `contentassetstructuredcontentdata`, `image`.

### Examples

```bash
# Validate a single page type definition
b2c content validate cartridge/experience/pages/storePage.json

# Validate all metadefinitions in a directory recursively
b2c content validate cartridge/experience/

# Validate with a glob pattern
b2c content validate 'cartridge/experience/**/*.json'

# Explicitly specify the schema type
b2c content validate --type componenttype mycomponent.json

# Validate multiple files
b2c content validate pages/home.json pages/about.json components/hero.json

# JSON output for CI/scripting
b2c content validate cartridge/experience/ --json

# Validate a page body against the types in your cartridges (offline)
b2c content validate --page pages/campaign.json --types-dir ./cartridges
```

With `--page`, each page is checked for unknown page types, regions, and component types; region exclusions and inclusions; required attributes; attribute value types (enum, boolean, integer, image); and duplicate component IDs. Attribute keys that the type doesn't define, and regions with more components than `max_components`, are reported as warnings. To validate against the types deployed to an instance, use `b2c content push --dry-run`.

### Output

The command prints a color-coded result for each file:

```
PASS: experience/pages/storePage.json (pagetype)
PASS: experience/components/hero.json (componenttype)
FAIL: experience/components/broken.json (componenttype)
  ERROR at .attribute_definition_groups[0]: is required

2/3 file(s) valid, 1 error(s)
```

The command exits with a non-zero status when any file fails validation.

With `--json`, returns a structured result:

```json
{
  "results": [
    {
      "valid": true,
      "schemaType": "pagetype",
      "errors": [],
      "filePath": "/path/to/storePage.json"
    }
  ],
  "totalFiles": 1,
  "validFiles": 1,
  "totalErrors": 0
}
```

### Notes

- Auto-detection uses file path conventions first: files under `experience/pages/` are validated as `pagetype`, files under `experience/components/` as `componenttype`. For other schema types, use `--type`.
- Schemas are bundled with the SDK and follow the [Page Designer metadefinition specification](https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/b2c-page-designer.html).
- Use `b2c content validate` in CI pipelines to catch metadefinition errors before deployment.

---

## b2c content types list

List the Page Designer page and component types deployed for a site, as reported live by the instance. The types come from the site's cartridge path.

### Usage

```bash
b2c content types list [--site-id <site>] [--kind page|component]
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag                      | Description                                                                               | Default                     |
| ------------------------- | ----------------------------------------------------------------------------------------- | --------------------------- |
| `--site-id`               | Site whose cartridge path defines the types                                               | `siteId` from configuration |
| `--kind`                  | Only list `page` or `component` types                                                     | Both                        |
| `--columns`, `--extended` | Select table columns (`id`, `kind`, `name`, `group`, `regions`, `attributes`, `archType`) |                             |

### Examples

```bash
b2c content types list --site-id RefArch
b2c content types list --kind component --json
```

Type IDs are shown without the `page.` and `component.` prefixes used in library XML (for example `Content.hero`, stored in library XML as `component.Content.hero`).

## b2c content types get

Show one page or component type with its regions (including `maxComponents` and excluded component types) and attributes (type, required, enum values, defaults).

### Usage

```bash
b2c content types get <typeId> [--site-id <site>]
```

### Examples

```bash
b2c content types get Content.hero
b2c content types get homePage --site-id RefArch --json
```

---

## b2c content push

Create or update Page Designer pages, with their regions and components, through the Experiences API without a site archive import. A new page is created **offline**: set it online in Business Manager. An update keeps the page's online state, so changes to an online page are live on the storefront right away.

Before pushing, each page is validated against the page and component types deployed for the site (the same checks as `content validate --page`). The platform accepts a page that is missing required attributes and silently drops unknown attribute keys, so this check catches problems the API would let through. Pages with validation errors are not pushed unless you pass `--force`.

### Usage

```bash
b2c content push <files...> [--site-id <site>] [--page <id>...] [--dry-run]
```

### Arguments

| Argument | Description                                                                        | Required |
| -------- | ---------------------------------------------------------------------------------- | -------- |
| `files`  | Page JSON files (one page body or an array of pages) or exported library XML files | Yes      |

A page JSON file uses the Experiences API page body:

```json
{
  "id": "summer-campaign",
  "name": "Summer Campaign",
  "typeId": "homePage",
  "regions": [
    {
      "id": "main",
      "components": [
        {"id": "summer-hero", "typeId": "Content.hero", "data": {"title": "Summer is here", "height": "md"}}
      ]
    }
  ]
}
```

Layout components nest their own `regions` in the same shape. Library XML from `b2c content export` is converted automatically, so you can export a page, edit it, and push it back. Pages that link shared content blocks (fragments) can't be pushed.

### Flags

In addition to [global flags](./index#global-flags):

| Flag              | Description                                                                                                              | Default                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `--site-id`       | Site the pages belong to                                                                                                 | `siteId` from configuration |
| `--page`          | Only push these page IDs from the input files (repeatable)                                                               | All pages                   |
| `--dry-run`       | Validate against the instance types without pushing                                                                      | `false`                     |
| `--[no-]validate` | Validate before pushing                                                                                                  | `true`                      |
| `--local-types`   | Directory with cartridge `experience/` definitions that override instance types, for types not yet deployed (repeatable) |                             |
| `--force`         | Push pages even when validation reports errors                                                                           | `false`                     |

### Examples

```bash
# Validate only
b2c content push pages/summer.json --site-id RefArch --dry-run

# Create or update a page
b2c content push pages/summer.json --site-id RefArch

# Round-trip an exported page
b2c content export homepage -o ./export
b2c content push ./export/libraries/SharedLibrary/library.xml --page homepage

# Validate against component types you haven't deployed yet
b2c content push pages/summer.json --local-types ./cartridges --dry-run
```

### Output

```
summer-campaign (pages/summer.json): created

1 page(s) saved. New pages are offline until you set them online in Business Manager; changes to an online page are live right away.
```

With `--json`, the command returns `{siteId, dryRun, pages: [{pageId, source, status, errors?, warnings?, message?}]}`, where `status` is `created`, `updated`, `validated` (dry run), `invalid`, or `failed`. The command exits with a non-zero status when any page is invalid or rejected.

### Notes

- **Updates merge by region.** A region included in the body replaces that region's components. Regions you leave out are kept as they are.
- Components removed from a region stay in the library as unassigned components.
- The type of an existing page can't be changed. Push a new page ID instead.
- The Experiences API can't read, delete, or publish pages. Use `b2c content export` to read pages back, and Business Manager to activate or delete them.

---

## b2c content asset

Read and change classic library content assets (not Page Designer pages) without an export or import job.

### Usage

```bash
b2c content asset get <contentId> [--library <id>] [--folders]
b2c content asset put <contentId> [--file <json>] [field flags] [--folder <folderId>]
b2c content asset update <contentId> [--file <json>] [field flags]
b2c content asset delete <contentId> [--force]
```

`--library` takes a shared library ID, or a site ID for a site-private library. It defaults to `content-library` or the first `libraries` entry in `dw.json`.

### Flags

| Flag                                                            | Description                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `--library`                                                     | Library ID (shared library or site ID)                          |
| `-f`, `--file`                                                  | JSON body (as printed by `get`); flags override its fields      |
| `--name`, `--description`, `--page-title`, `--page-description` | Localized values for `--locale`                                 |
| `--[no-]online`                                                 | Online in `--locale`                                            |
| `-a`, `--attribute c_id=value`                                  | Localized string custom attribute (repeatable)                  |
| `--markup c_id=<html>`                                          | Localized markup custom attribute such as `c_body` (repeatable) |
| `--template`                                                    | Rendering template                                              |
| `--locale`                                                      | Locale for localized values (default `default`)                 |
| `--folder`                                                      | `put` only: assign the asset to this classification folder      |
| `--folders`                                                     | `get` only: include the folders the asset is in                 |
| `--force`                                                       | `delete` only: skip the confirmation prompt                     |

### Examples

```bash
b2c content asset put summer-banner --name "Summer Banner" --online \
  --markup c_body="<p>Summer is here</p>" --folder promos
b2c content asset update summer-banner --locale fr --markup c_body="<p>L'été est là</p>"
b2c content asset get summer-banner > summer-banner.json
b2c content asset delete summer-banner --force
```

### Notes

- `update` merges fields and locales into the existing asset.
- The platform ignores custom attribute IDs it doesn't know, so check the result with `get`.
- If `put --folder` saves the asset but the folder assignment fails, the command says so. Retry the assignment with `b2c content folder assign`.
- `delete` asks for confirmation unless you pass `--force` or `--json`.

## b2c content folder

Walk and change the folder tree of a library.

### Usage

```bash
b2c content folder list [--folder <id>] [--depth <n>] [--folders-only] [--tree]
b2c content folder get <folderId>
b2c content folder put <folderId> [--parent <id>] [--name <name>] [--[no-]online]
b2c content folder update <folderId> [--parent <id>] [field flags]
b2c content folder delete <folderId> [--force]
b2c content folder assign <folderId> <contentId> [--default] [--position <n>]
b2c content folder unassign <folderId> <contentId>
```

### Flags

| Flag                                                                                        | Description                                                |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `--library`                                                                                 | Library ID (shared library or site ID)                     |
| `--folder`                                                                                  | `list` only: starting folder (default `root`)              |
| `--depth`                                                                                   | `list` only: maximum depth below the starting folder       |
| `--folders-only`                                                                            | `list` only: skip content assets                           |
| `--tree`                                                                                    | `list` only: print a tree instead of a table               |
| `--parent`                                                                                  | `put`/`update`: parent folder (default `root`)             |
| `--name`, `--description`, `--page-title`, `--page-description`, `-a`, `--file`, `--locale` | Same as `content asset`                                    |
| `--[no-]online`                                                                             | Folder online flag (not localized)                         |
| `--default`                                                                                 | `assign` only: make this the asset's classification folder |
| `--position`                                                                                | `assign` only: sort position in the folder                 |
| `--force`                                                                                   | `delete` only: skip the confirmation prompt                |

### Examples

```bash
b2c content folder put promos --name Promotions --online
b2c content folder assign promos summer-banner --default
b2c content folder list --folder promos --tree
b2c content folder list --folders-only --json
```

### Notes

- `list` starts at `root` (or `--folder`) and lists sub-folders and their content assets. It's faster than `content list` for folder-scoped views, but it can't show Page Designer pages or assets that aren't in any folder.
- `list` works with the read-only `sfcc.experiences` scope. `get` and all writes need `sfcc.experiences.rw`.
- `delete` refuses to delete `root`.

---

## b2c content slot list

List the content slots of a site with their context type, number of configurations, and which configurations are active now.

### Usage

```bash
b2c content slot list [--site-id <site>] [--context global|category|folder]
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag                      | Description                                                                                             | Default                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| `--site-id`               | Site whose slots to list                                                                                | `siteId` from configuration |
| `--context`               | Only slots of this context type                                                                         | All                         |
| `--columns`, `--extended` | Select table columns (`slotId`, `contextType`, `configurations`, `activeConfigurations`, `description`) |                             |

## b2c content slot get

Show a slot and all of its configurations.

### Usage

```bash
b2c content slot get <slotId> [--site-id <site>] [--context global|category|folder]
```

`--context` defaults to `global`.

## b2c content slot config list

List slot configurations with their context, enabled and active state, content type, and content IDs.

### Usage

```bash
b2c content slot config list [--site-id <site>] [--slot-id <slot>] [--context global|category|folder]
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag                      | Description                                                                                                                                                               | Default                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `--site-id`               | Site whose configurations to list                                                                                                                                         | `siteId` from configuration |
| `--slot-id`               | Only configurations of this slot                                                                                                                                          | All slots                   |
| `--context`               | Only configurations with this context                                                                                                                                     | All                         |
| `--columns`, `--extended` | Select table columns (`slotId`, `configurationId`, `context`, `enabled`, `active`, `default`, `rank`, `contentType`, `content`, `customerGroups`, `schedule`, `template`) |                             |

`active` means the configuration is enabled and inside its schedule now.

## b2c content slot config get

Print one slot configuration as JSON. Redirect the output to a file to edit it and pass it back to `put --file`.

```bash
b2c content slot config get <slotId> <configurationId> [--site-id <site>] [--context <context>]
```

## b2c content slot config put

Create or replace a slot configuration. The slot must already exist. Slots are defined by templates and can't be created through the API.

### Usage

```bash
b2c content slot config put <slotId> <configurationId> [content flag] --template <template> [flags]
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag                               | Description                                                               |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `--site-id`                        | Site the slot belongs to (default: `siteId` from configuration)           |
| `-f`, `--file`                     | JSON file with the configuration body; flags override its fields          |
| `--content-assets`                 | Comma-separated content asset IDs                                         |
| `--products`                       | Comma-separated product IDs                                               |
| `--categories`                     | Comma-separated category IDs                                              |
| `--html`                           | HTML markup for the default locale                                        |
| `--template`                       | Rendering template, for example `slots/content/htmlslotcontainer.isml`    |
| `--context`, `--context-id`        | `global` (default), or `category`/`folder` with the category or folder ID |
| `--[no-]enabled`, `--[no-]default` | Enable the configuration, or make it the slot's default                   |
| `--rank`                           | Rank used to order configurations                                         |
| `--customer-groups`                | Comma-separated customer group IDs                                        |
| `--start-date`, `--end-date`       | Schedule window (ISO 8601)                                                |
| `--description`                    | Configuration description                                                 |

Content (one of `--content-assets`, `--products`, `--categories`, `--html`, or `slotContent` in `--file`) and a template are required. Referenced content must exist: content assets are looked up in the site's library.

### Examples

```bash
b2c content slot config put home-main summer-sale \
  --content-assets summer-banner \
  --template slots/content/htmlslotcontainer.isml \
  --enabled --customer-groups Everyone \
  --start-date 2026-06-01T00:00:00Z --end-date 2026-09-01T00:00:00Z

# Copy a configuration
b2c content slot config get home-main summer-sale > summer.json
b2c content slot config put home-main winter-sale --file summer.json --start-date 2026-12-01T00:00:00Z
```

## b2c content slot config update

Change fields of an existing configuration and keep the rest. Takes the same flags as `put`. The current content is kept unless you pass a content flag.

```bash
# Disable a configuration
b2c content slot config update home-main summer-sale --no-enabled

# Extend the schedule
b2c content slot config update home-main summer-sale --end-date 2026-09-15T00:00:00Z
```

## b2c content slot config delete

Delete a slot configuration. Asks for confirmation unless you pass `--force` or `--json`. The command is blocked on instances marked as production or read-only in your configuration.

```bash
b2c content slot config delete home-main summer-sale --force
```
