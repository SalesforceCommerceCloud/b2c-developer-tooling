---
name: b2c-content
description: Export, list, validate, and push Page Designer content in B2C Commerce libraries. Use this skill whenever the user needs to export Page Designer pages, components, or content blocks, list pages in a content library, validate page JSON or metadefinitions, create or update a draft page from JSON, inspect the page and component types deployed to an instance, discover page IDs, migrate content between instances, or work with library XML offline. Also use when extracting content for review or building content deployment pipelines -- even if they just say 'export the homepage' or 'what pages are in the shared library'.
---

# B2C Content Skill

Use the `b2c` CLI to export, list, validate, and push Page Designer content from Salesforce B2C Commerce content libraries.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli content export homepage`).

## Configuration & Authentication

The CLI auto-discovers the target instance and credentials from `SFCC_*` environment variables (including project `.env`), the selected project-local or shared `dw.json`, and configuration plugins. `package.json` supplies only non-sensitive defaults. **Flags like `--server`, `--client-id`, `--client-secret`, `--username`, and `--password` are usually unnecessary** — only pass them to override what's auto-detected.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (use `--json` for scripting; secrets stay masked by default). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

Online export/list starts a system export job: SCAPI uses `sfcc.jobs.rw` plus the tenant scope; WebDAV downloads the archive and assets. `--api-backend ocapi` forces OCAPI; `auto` permits fallback. If an error only mentions OCAPI, retry with `--api-backend scapi` to expose the SCAPI failure before assuming OCAPI permissions are needed.

`content types` and `content push` use the SCAPI Admin Experiences API: client credentials or JWT auth with `sfcc.experiences.rw` (or read-only `sfcc.experiences` for `types`) plus the tenant scope. If those scopes are missing, only these commands fail. Export, list, and validate are unaffected.

## Examples

### Export Pages

```bash
# export a single page from a shared library
b2c content export homepage --library SharedLibrary

# export multiple pages
b2c content export homepage about-us contact --library SharedLibrary

# export pages matching a regex pattern
b2c content export "hero-.*" --library SharedLibrary --regex

# export to a specific output directory
b2c content export homepage --library SharedLibrary -o ./my-export

# export a specific component by ID
b2c content export hero-banner --library SharedLibrary

# export a content block (reusable fragment) by ID
b2c content export DiscoverContentBlock --library RefArch --site-library

# export from a site-private library
b2c content export homepage --library RefArch --site-library

# preview without downloading (dry run)
b2c content export homepage --library SharedLibrary --dry-run

# export with JSON output
b2c content export homepage --library SharedLibrary --json

# export from a local XML file (offline, no instance needed)
b2c content export homepage --library SharedLibrary --library-file ./library.xml --offline

# filter pages by folder classification
b2c content export homepage --library SharedLibrary --folder seasonal

# custom asset extraction paths
b2c content export homepage --library SharedLibrary -q "image.path" -q "video.url"

# include orphan components in export
b2c content export homepage --library SharedLibrary --keep-orphans
```

### Export Directly into an Import-Set Migration

The focused content exporter writes standard archive-relative `libraries/` or site-library files directly into the directory passed to `--output`; unlike `b2c job export`, it does not add a generated `*_export` wrapper. Preview first, then use the final timestamped migration directory and review the exported XML and assets in place:

```bash
b2c content export homepage --library SharedLibrary --dry-run --show-tree
b2c content export homepage \
  --library SharedLibrary \
  --output migrations/20260815T120000-update-homepage
```

For a site-private library, configure or pass `--site-library`. Do not require a temporary directory and copy step. Never write into an existing or applied migration. See `b2c-cli:b2c-import-set-migrations` for archive identity, trimming, and deployment rules.

### List Content

```bash
# list all content in a library
b2c content list --library SharedLibrary

# list only pages
b2c content list --library SharedLibrary --type page

# list content blocks (reusable fragments; includes unlinked blocks)
b2c content list --library SharedLibrary --type fragment

# list including components
b2c content list --library SharedLibrary --components

# show tree structure
b2c content list --library SharedLibrary --tree

# list from a site-private library
b2c content list --library RefArch --site-library

# list from a local XML file
b2c content list --library SharedLibrary --library-file ./library.xml

# JSON output
b2c content list --library SharedLibrary --json
```

### Content Blocks

Content blocks are Page Designer "content blocks" — reusable `fragment.*`-typed content that is **shared** across pages (one definition, linked from many places). They are listed distinctly in the tree as `(CONTENT BLOCK)`, counted separately in export summaries, and can be exported by ID like a component (a Layout content block keeps its region children). `b2c content list --type fragment` shows the deduplicated catalog of every content block in a library, including blocks not currently linked to any page.

### Configuration

The `--library` flag can be configured in `dw.json` or `package.json` so you don't need to pass it every time:

```json
// dw.json
{
  "hostname": "my-sandbox.demandware.net",
  "content-library": "SharedLibrary"
}
```

```json
// package.json
{
  "b2c": {
    "contentLibrary": "SharedLibrary"
  }
}
```

With a configured library, commands become shorter:

```bash
b2c content export homepage
b2c content list --type page
```

### Validate Metadefinitions

```bash
# validate a single metadefinition file
b2c content validate cartridge/experience/pages/storePage.json

# validate all metadefinitions in a directory recursively
b2c content validate cartridge/experience/

# validate with a glob pattern
b2c content validate 'cartridge/experience/**/*.json'

# explicitly specify the schema type
b2c content validate --type componenttype mycomponent.json

# JSON output for CI/scripting
b2c content validate cartridge/experience/ --json
```

Schema types are auto-detected from file paths (`experience/pages/` → pagetype, `experience/components/` → componenttype) and from JSON content. Use `--type` to override.

### Inspect Deployed Page and Component Types

```bash
# list page and component types for a site (live from the instance)
b2c content types list --site-id RefArch

# only component types, as JSON
b2c content types list --kind component --json

# regions and attributes of one type (IDs have no page./component. prefix)
b2c content types get Content.hero
```

Run these before building a page body, so that region IDs, component type IDs, enum values and required attributes come from the instance and aren't guessed.

### Push Pages (Draft)

```bash
# validate a page body against the deployed types without pushing
b2c content push pages/summer.json --site-id RefArch --dry-run

# create or update the page as a draft
b2c content push pages/summer.json --site-id RefArch

# round-trip: export, edit library.xml, push back
b2c content export homepage -o ./export
b2c content push ./export/libraries/SharedLibrary/library.xml --page homepage

# validate a page body offline against local cartridge types
b2c content validate --page pages/summer.json --types-dir ./cartridges
```

A page body is `{id, name, typeId, data?, regions: [{id, components: [{id, typeId, data?, regions?}]}]}`. Layout components nest `regions` in the same shape.

- Pushed pages are always **drafts**. Tell the user to activate them in Business Manager.
- Updates merge by region: a region you send replaces its components, and regions you leave out are kept.
- An existing page's type can't be changed.
- The API can't read, delete, or publish pages. Use `content export` to read pages back.

### More Commands

See `b2c content --help` for a full list of available commands and options in the `content` topic.

## Troubleshooting

- **"Library is required"** -- Set `--library` flag or configure `content-library` in `dw.json`.
- **Authentication errors** -- Inspect resolved configuration first. SCAPI needs client-credentials or JWT authentication with `sfcc.jobs.rw` and the tenant scope; browser login is OCAPI/WebDAV-only. Use `b2c-cli:b2c-config` for setup. `--library-file` skips the remote export job; add `--offline` to skip asset downloads too.
- **Library not found** -- Verify the library ID matches exactly. For site-private libraries, add `--site-library`.
- **No content found** -- Check that the page/content IDs exist. Use `b2c content list` to discover available IDs.
- **Experiences API errors on `content types` or `content push`** -- A 403 or "not granted the Experiences scope" error means the API client needs `sfcc.experiences.rw` (or `sfcc.experiences`) in Account Manager. These commands also need client credentials (not browser login), a short code, and a tenant ID.
- **Timeout errors** -- Large libraries may exceed the default timeout. Use `--timeout <seconds>` to increase it.

## Related Skills

- `b2c-cli:b2c-import-set-migrations` - Ordered, idempotent migrations built from focused content exports
- `b2c-cli:b2c-site-import-export` - Site archive import/export operations
- `b2c-cli:b2c-webdav` - Low-level file operations on content libraries
- `b2c-cli:b2c-config` - Configuration and credential management
