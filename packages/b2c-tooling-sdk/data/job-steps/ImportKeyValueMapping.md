<!-- prettier-ignore-start -->
# Job Step: ImportKeyValueMapping

**Type ID:** `ImportKeyValueMapping`  
**Scope:** Organization (add to an organization-level job flow)  
**Category:** Standard / system job step (Import)

Import or delete a key/value mapping in the Generic Mapping high-performance data store. Key/value mappings are exposed through Script API class dw.util.MappingMgr. See Generic Mapping

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `AfterImportFileHandling` | Yes | `Archive` | `Keep`, `Delete`, `Archive`, `Archive Zipped` | What to do with the import file after successful or failed import. The handling is not performed if ImportFailedHandling is ERROR and the file failed to validate. Ignored if using import mode 'Delete'. |
| `ArchiveFolder` | No | `archive` | — | Folder to store archived import files. Used when 'AfterImportFileHandling' is 'Archive' or 'Archive Zipped'. Folder location relative to 'IMPEX' folder. If not defined, 'IMPEX/archive' is used. Ignored if using import mode 'Delete'. |
| `FileNamePattern` | No | — | — | Regular expression pattern to select the import files, e.g. 'import_.*\.csv'. Matching files are imported in alphanumerical order. If not defined all files in working folder are imported. Ignored if using import mode 'Delete'. |
| `ImportFailedHandling` | Yes | `WARN` | `WARN`, `ERROR` | WARN - Skip malformed files. Perform action specified by AfterImportFileHandling on files. Use Exit Status WARN. ERROR - If invalid file is found, do not perform action specified by AfterImportFileHandling and abort immediately with Exit Status ERROR. Ignored if using import mode 'Delete'. |
| `ImportMode` | Yes | `Replace` | `Replace`, `Merge`, `Delete` | Replace - Create new mapping or replace existing mapping, Merge - Create new mapping or update/create values in existing mapping, Delete - Delete specified mapping. All import file related parameters are ignored. |
| `KeyCount` | No | `1` | — | Number of columns in CSV file that are composite key columns, from left to right. Default is 1, which indicates that the first column in CSV file is a key. All other columns are an aggregated list of values. Ignored if using import mode 'Delete'. |
| `MappingName` | Yes | — | — | Name used to access the mapping. Example: 'backend-to-web-skus' or 'web-products-to-backend'. |
| `WorkingFolder` | No | — | — | Folder containing import files, relative to 'IMPEX/src'. If not defined, working folder is 'IMPEX/src'. Ignored if using import mode 'Delete'. |

## Working With IMPEX Files

This step reads files from the instance IMPEX area. `WorkingFolder` is resolved relative to `IMPEX/src/` (and defaults to `IMPEX/src/`); use `FileNamePattern` to select which file(s) to import. A prior step — custom or standard — that writes a file under `IMPEX/src/...` can hand off directly to this step. See the chaining example in the `b2c:b2c-custom-job-steps` skill.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
