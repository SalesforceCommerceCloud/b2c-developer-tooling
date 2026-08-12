<!-- prettier-ignore-start -->
# Job Step: ImportPageLocalization

**Type ID:** `ImportPageLocalization`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Import)

Import translated page content for localization purposes

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `AfterImportFileHandling` | Yes | `Archive` | `Keep`, `Delete`, `Archive`, `Archive Zipped` | What to do with the import file after successful or failed import. The handling is not performed if there was a locking problem, or if ImportFailedHandling is ERROR and the file failed to validate. |
| `ArchiveFolder` | No | `archive` | — | Folder to store archived import files. Used when 'AfterImportFileHandling' is 'Archive' or 'Archive Zipped'. Folder location relative to 'IMPEX/' folder. If not defined 'IMPEX/archive/' is used. |
| `FileFormat` | Yes | — | `JSON`, `RESOURCE` | The format in which the data is provided. |
| `FileName` | Yes | — | — | File name for the file to be imported (relative to the 'WorkingFolder'). |
| `ImportFailedHandling` | Yes | `WARN` | `ERROR`, `WARN` | The step exit status that will be used when the import process failed. |
| `NoFilesFoundHandling` | Yes | `NO_FILES_FOUND` | `OK`, `ERROR`, `WARN`, `NO_FILES_FOUND` | The step exit status that will be used when no matching files were found. |
| `WorkingFolder` | Yes | — | — | The folder that contains the import files, relative to the 'IMPEX/src/' folder. If not defined 'IMPEX/src/' is used as working folder. |

## Working With IMPEX Files

This step reads files from the instance IMPEX area. `WorkingFolder` is resolved relative to `IMPEX/src/` (and defaults to `IMPEX/src/`); use `FileNamePattern` to select which file(s) to import. A prior step — custom or standard — that writes a file under `IMPEX/src/...` can hand off directly to this step. See the chaining example in the `b2c:b2c-custom-job-steps` skill.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
