---
description: Validate B2C Commerce import/export XML files against the bundled XSD schemas, offline and without installing xmllint.
---

# Validate Command

Check catalogs, price books, inventory lists, site archives, and other import/export XML against the B2C Commerce XSD schemas before you import them. Validation runs locally, needs no credentials or instance, and does not require `xmllint` or any other tool to be installed.

## b2c validate

Validate XML files against the bundled XSDs (the same schemas as [`b2c docs schema`](./docs.md#b2c-docs-schema)). Each file's schema is chosen from the namespace of its root element, so a site archive with catalogs, price books, and preferences validates in one run.

### Usage

```bash
b2c validate [paths...]
```

### Arguments

| Argument | Description                                                                                | Required                               |
| -------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| `paths`  | XML files, directories (searched recursively for `*.xml`), or glob patterns. Accepts many. | No (defaults to the current directory) |

### Flags

| Flag          | Description                                                                                                   | Default |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------- |
| `--schema`    | Validate every file against this schema: a bundled schema ID (see `b2c docs schema --list`) or an `.xsd` path | detect  |
| `--exclude`   | Glob pattern of files to skip when expanding directories and globs. Repeatable.                               |         |
| `--fail-fast` | Stop after the first file that fails                                                                          | `false` |

### Examples

```bash
# Validate a site archive before importing it
b2c validate site_template

# Validate specific files
b2c validate catalog.xml pricebook.xml

# Validate with a glob, skipping a directory
b2c validate 'site_template/**/*.xml' --exclude '**/sites/**'

# Force a schema when the root element namespace is missing or different
b2c validate custom-export.xml --schema catalog

# Validate against your own XSD (sibling .xsd files are available to xs:include and xs:import)
b2c validate data.xml --schema ./schemas/custom.xsd

# Machine-readable output for CI
b2c validate site_template --json
```

### Output

Each file is reported as `PASS`, `FAIL`, or `SKIP`, followed by a summary:

```text
PASS: site_template/catalogs/storefront-catalog/catalog.xml (catalog)
FAIL: site_template/inventory-lists/inventory.xml (inventory)
  ERROR line 9: Element '{http://www.demandware.com/xml/impex/inventory/2007-05-31}allocation': 'ten' is not a valid value of the atomic type 'xs:decimal'.
SKIP: site_template/meta/notes.xml - No bundled schema for namespace urn:example

1/3 file(s) valid, 1 error(s), 1 skipped
```

- **PASS**: the file is well-formed and conforms to its schema.
- **FAIL**: the file is not well-formed XML, does not conform to its schema, or (when named directly) has no matching schema.
- **SKIP**: a well-formed file found in a directory or glob whose root namespace matches no bundled schema.

The command exits with status 1 when any file fails. With `--json`, it returns the totals and a `results` array with each file's `status`, `schema`, and `errors` (each with `line`, optional `column`, `message`, and `severity`).

### Notes

- Validation uses libxml2 compiled to WebAssembly. It runs in memory, does not load external entities or DTDs, and makes no network requests, so it is safe to run on untrusted files.
- Large files are streamed through the validator; a 10 MB catalog validates in well under a second.
- The schemas match the platform version noted in `b2c docs schema --list --json`. Newer platform features may not be in the bundled schemas yet.
