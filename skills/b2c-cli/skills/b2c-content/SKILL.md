---
name: b2c-content
description: Export and list Page Designer pages from B2C Commerce content libraries. Always reference when using the CLI to export or list Page Designer content, discover page IDs, or work with content library assets.
---

# B2C Content Skill

Use the `b2c` CLI to export and list Page Designer content from Salesforce B2C Commerce content libraries.

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

### More Commands

See `b2c content --help` for a full list of available commands and options in the `content` topic.

## Related Skills

- `b2c-cli:b2c-site-import-export` - Site archive import/export operations
- `b2c-cli:b2c-webdav` - Low-level file operations on content libraries
- `b2c-cli:b2c-config` - Configuration and credential management
