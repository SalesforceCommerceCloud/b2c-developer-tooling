---
name: b2c-mcp-site-import
description: Required before site_archive_import. Write B2C Commerce data that has no SCAPI write (such as promotion discount rules) by importing site archive XML, then verify it.
---

# Site archive import

`site_archive_import` takes archive files as text, validates each against its
bundled schema, zips them and runs the `sfcc-site-archive-import` job. Nothing is
uploaded if a file fails validation, so a separate `validate_xml_schema` call is
not needed. No terminal, CLI or WebDAV steps are involved.
Read this skill once through resources or `skills_read` (`mcp/b2c-mcp-site-import`),
then pass `skillRead: true`.

## When to use

Prefer SCAPI (`scapi_execute`) for any field its contracts cover. Use an archive
import for data SCAPI cannot write today, for example promotion discount rules
(see the [SCAPI promotions reference](skill://mcp/b2c-mcp-scapi/references/promotions.md)).
Create the records themselves through SCAPI where possible, then import only
what SCAPI lacks.

## Write the files

- Paths are relative to the archive root: `sites/{siteId}/promotions.xml`,
  `catalogs/{catalogId}/catalog.xml`, `pricebooks/{priceBookId}/pricebook.xml`,
  `inventory-lists/{listId}/inventory.xml`, `sites/{siteId}/preferences.xml`,
  `meta/system-objecttype-extensions.xml`. Use the IDs you resolved, not guesses.
- Include only the records and elements you mean to change. Import merges: a
  record that carries only some elements updates those and keeps the rest (for
  example, a `<promotion>` with only its rule keeps its name and campaign
  assignment). Do not export and re-import whole files to change one record.
- For element names and order, read the schema with `docs_schema_read`
  (`promotion`, `catalog`, `pricebook`, ...), or copy the shape of an existing
  record.

## Run and verify

1. Call with `dryRun: true` first when the XML is new to you. Fix every `errors`
   entry (line and message) and call again. A `skip` status means no bundled schema
   applies; that file is imported without validation.
2. Run the import. `outcome` is `imported` when the job finished OK. On `failed`,
   read `execution.logFilePath` with `webdav_get` (`tail: true`) before changing
   anything; do not rerun an import to find out what happened.
3. Verify with a read: a SCAPI GET for fields it returns. For fields no API
   returns, ask the user to check Business Manager, or with a terminal export the
   data unit (`b2c job export`). A finished job alone does not prove the data changed.

Imports are writes. Confirm the target instance and site with the user. Import
records with the enabled state the user asked for, enabled by default; dates and
schedules control when shoppers see them.
