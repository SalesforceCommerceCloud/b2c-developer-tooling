---
description: Search, read, and download B2C Commerce Script API documentation and bundled XSD schemas.
---

# Docs Commands

Commands for searching and reading Script API documentation (`dw.*` classes/modules), reading bundled XSD schemas, and downloading fresh documentation from an instance.

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

Search bundled Script API documentation using fuzzy matching.

### Usage

```bash
b2c docs search [query]
```

### Arguments

| Argument | Description                                             | Required                              |
| -------- | ------------------------------------------------------- | ------------------------------------- |
| `query`  | Search query (class name, module path, or partial text) | No (required unless `--list` is used) |

### Flags

| Flag            | Description                              | Default |
| --------------- | ---------------------------------------- | ------- |
| `--limit`, `-l` | Maximum number of results to display     | `20`    |
| `--list`        | List all available documentation entries | `false` |

### Examples

```bash
# Search by class name
b2c docs search ProductMgr

# Search with multiple terms
b2c docs search "catalog product"

# Limit result count
b2c docs search status --limit 5

# List all available entries
b2c docs search --list
```

### Output

Default output is a table with `ID`, `Title`, and `Match` score. With `--list`, output shows all entries (`ID` and `Title`) plus a total count.

---

## b2c docs read

Read Script API documentation for a specific class or module.

### Usage

```bash
b2c docs read <query>
```

### Arguments

| Argument | Description                        | Required |
| -------- | ---------------------------------- | -------- |
| `query`  | Class/module name or partial match | Yes      |

### Flags

| Flag          | Description                                 | Default |
| ------------- | ------------------------------------------- | ------- |
| `--raw`, `-r` | Output raw markdown (no terminal rendering) | `false` |

### Examples

```bash
# Read a class doc
b2c docs read ProductMgr

# Read by fully qualified name
b2c docs read dw.catalog.ProductMgr

# Output raw markdown for piping
b2c docs read ProductMgr --raw

# JSON output with selected entry + content
b2c docs read ProductMgr --json
```

### Output

By default, markdown is rendered for terminal display. Raw markdown is emitted when using `--raw` (or when output is not a TTY).

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

| Flag           | Description                | Default |
| -------------- | -------------------------- | ------- |
| `--list`, `-l` | List all available schemas | `false` |

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
```

### Output

Without `--json`, the command writes schema XML directly to stdout. With `--list`, it prints available schema IDs and a total count.

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
