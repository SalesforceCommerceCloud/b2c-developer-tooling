---
name: b2c-site-import-export
description: Author, validate, import, and verify B2C Commerce site archives and metadata XML; export selected data for inspection or migration.
---

# Site Archives

Use `b2c job import` / `b2c job export` to transfer site archives. If `b2c` is
unavailable, use `npx @salesforce/b2c-cli`.

## Configuration and tool choice

CLI and MCP share resolved configuration: `SFCC_*` variables (including project
`.env`), project/shared `dw.json`, and plugins. `package.json` provides nonsecret
defaults. Use `--project-directory` outside the target project. Inspect with
`b2c setup inspect --json` or MCP `config_inspect`; keep secrets masked. Configured
values normally make credential flags and manual `dw.json` reads unnecessary.
For resolution issues, use `b2c-cli:b2c-config`.

No dedicated MCP archive-transfer tool exists. Use the CLI for XML imports and
exports, including settings absent from SCAPI contracts. MCP `scapi_execute` can
manage supported Admin fields; a metadata record alone does not prove that
promotion discounts or targeting rules are configured.

## Import and verify

1. Resolve the target site/catalog and intended change. Include only relevant
   data in the archive; preserve unrelated settings and requested enabled state.
2. Author XML in the platform archive layout. Check the relevant XSD with
   `b2c docs schema <name>` (list names with `--list`), then validate locally.
3. Import the directory or zip. The command waits by default; `--show-log` shows
   job logs on failure. Check completion before retrying.
4. Read back the affected fields. If the API omits them, export the matching data
   unit and inspect the relevant XML records. A successful job alone is insufficient.

```bash
b2c job import ./archive --show-log
b2c job export --site MySite --site-data campaigns_and_promotions --output ./verification
```

`--site` alone exports all site data; specify `--site-data` for focused work.
Directory output retains the platform's generated `*_export` root. Do not overwrite
an existing/applied migration. Exports may contain secrets or unrelated defaults;
review and trim before committing, preserving XSD-required fields.

## Focused references

- Archive layout and XML workflows: [archive workflows](references/WORKFLOWS.md).
- Attribute/type XML patterns: [metadata XML](references/METADATA-XML.md).
- Remote imports, size splitting, and import-set options: [import options](references/IMPORT-OPTIONS.md).
- Export flags, data units, and compact JSON results: [export reference](../b2c-job/references/EXPORT.md).
- Ordered migrations, naming, history, and recovery: `b2c-cli:b2c-import-set-migrations`.
- Service configuration XML: `b2c:b2c-webservices`.

Jobs prefer SCAPI; `--api-backend auto` can fall back to OCAPI on supported
rejections. Archive transfer uses WebDAV in either case. For job scopes, backend
selection, and monitoring, use the relevant section of `b2c-cli:b2c-job`.
