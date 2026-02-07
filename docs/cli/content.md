---
description: Commands for exporting and listing Page Designer content from B2C Commerce content libraries.
---

# Content Commands

Commands for working with Page Designer content libraries on B2C Commerce instances.

## Authentication

Content commands require OAuth authentication:

| Operation | Auth Required |
|-----------|--------------|
| `content export` | OAuth (OCAPI for export job + WebDAV for assets) |
| `content list` | OAuth (OCAPI for export job) |

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
```

Both commands also support a `--library-file` flag for offline use with a local XML file, which skips authentication entirely.

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

| Argument | Description | Required |
|----------|-------------|----------|
| `PAGES` | One or more content IDs to export (pages, content assets, or components) | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--library` | Library ID or site ID. Also configurable via `content-library` in dw.json. | |
| `--output`, `-o` | Output directory | `content-<timestamp>` |
| `--site-library` | Treat the library as a site-private library | `false` |
| `--asset-query`, `-q` | JSON dot-paths for static asset extraction (can be repeated) | `image.path` |
| `--regex`, `-r` | Treat page IDs as regular expressions | `false` |
| `--folder` | Filter by folder classification (can be repeated) | |
| `--offline` | Skip asset downloads | `false` |
| `--library-file` | Use a local library XML file instead of fetching from instance | |
| `--keep-orphans` | Include orphan components (not linked to any page) in export | `false` |
| `--show-tree` | Display tree structure of exported content | `true` |
| `--timeout` | Export job timeout in seconds | |
| `--dry-run` | Preview export without downloading assets or writing files | `false` |

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
```

### Output

The command displays:

1. A tree visualization of the exported content (pages, components, and assets)
2. Asset download progress with success/failure indicators
3. A summary line listing counts by type, e.g.: `Exported: 2 pages, 1 content asset, 5 components, 3 static assets to ./export`

With `--json`, returns a structured result including the library tree, output path, downloaded/failed asset lists, and counts.

### Notes

- The `--library` flag can be set in `dw.json` as `content-library` or in `package.json` under `b2c.contentLibrary` to avoid passing it every time
- Use `b2c content list` to discover available page IDs before exporting
- You can export pages, content assets, or individual components by their content ID. When a component ID is specified, it is promoted to the root of the export with its full child tree
- The `--asset-query` flag specifies JSON dot-notation paths within component data to extract static asset references. The default `image.path` covers the common Page Designer image component pattern
- Use `*` in asset query paths to traverse arrays (e.g., `slides.*.image.path`)

---

## b2c content list

List pages and content items in a content library. Useful for discovering page IDs before running an export.

### Usage

```bash
b2c content list --library <library-id>
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Description | Default |
|------|-------------|---------|
| `--library` | Library ID or site ID. Also configurable via `content-library` in dw.json. | |
| `--site-library` | Treat the library as a site-private library | `false` |
| `--library-file` | Use a local library XML file instead of fetching from instance | |
| `--type` | Filter by node type: `page`, `content`, or `component` | |
| `--components` | Include components in table output | `false` |
| `--tree` | Show tree structure instead of table | `false` |
| `--timeout` | Job timeout in seconds | |

### Examples

```bash
# List all content in a library
b2c content list --library SharedLibrary --server my-sandbox.demandware.net

# List only pages
b2c content list --library SharedLibrary --type page

# List including components
b2c content list --library SharedLibrary --components

# Show tree structure
b2c content list --library SharedLibrary --tree

# List from a site-private library
b2c content list --library RefArch --site-library

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

Pages show `id (typeId: type)`, components show `typeId (id)`, content assets show `id (CONTENT ASSET)`, and static assets show `path (STATIC ASSET)`. The tree uses color when output to a terminal: page names are bold, component type IDs are cyan, asset paths are green, and tree connectors are dim.

With `--json`, returns `{ data: [...] }` with each item containing `id`, `type`, `typeId`, and `children` count.
