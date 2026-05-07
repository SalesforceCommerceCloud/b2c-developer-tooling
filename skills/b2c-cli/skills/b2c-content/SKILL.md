---
name: b2c-content
description: Export, list, and validate Page Designer content from B2C Commerce libraries. Use this skill whenever the user needs to export Page Designer pages or components, list pages in a content library, validate page JSON or metadefinitions, discover page IDs, migrate content between instances, or work with library XML offline. Also use when extracting content for review or building content deployment pipelines -- even if they just say 'export the homepage' or 'what pages are in the shared library'.
---

# B2C Content Skill

Use the `b2c` CLI to export, list, and validate Page Designer content from Salesforce B2C Commerce content libraries.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli content export homepage`).

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

### List Content

```bash
# list all content in a library
b2c content list --library SharedLibrary

# list only pages
b2c content list --library SharedLibrary --type page

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

### More Commands

See `b2c content --help` for a full list of available commands and options in the `content` topic.

## Troubleshooting

- **"Library is required"** -- Set `--library` flag or configure `content-library` in `dw.json`.
- **Authentication errors** -- OAuth credentials are required for remote operations. Run `b2c auth:login` first. The `--library-file` flag bypasses authentication for offline/local use.
- **Library not found** -- Verify the library ID matches exactly. For site-private libraries, add `--site-library`.
- **No content found** -- Check that the page/content IDs exist. Use `b2c content list` to discover available IDs.
- **Timeout errors** -- Large libraries may exceed the default timeout. Use `--timeout <seconds>` to increase it.

## Related Skills

- `b2c-cli:b2c-site-import-export` - Site archive import/export operations
- `b2c-cli:b2c-webdav` - Low-level file operations on content libraries
- `b2c-cli:b2c-config` - Configuration and credential management
