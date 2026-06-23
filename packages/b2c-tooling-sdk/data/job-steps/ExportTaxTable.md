<!-- prettier-ignore-start -->
# Job Step: ExportTaxTable

**Type ID:** `ExportTaxTable`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Export)

Exports tax data.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `ExportFile` | No | — | — | Export file name and path relative to 'IMPEX/src'. Required if not using FileNamePrefix. |
| `FileNamePrefix` | No | — | — | Prefix for the export file. A timestamp is appended and site information as applicable. To order the files chronologically, sort alphanumerically. Path is relative to 'IMPEX/src' and can include a subdirectory. Required if not using ExportFile. |
| `OverwriteExportFile` | No | `true` | — | If selected, the option overwrites an existing file. If not selected and a file exists, the job step exits and reports an error. |

## Working With IMPEX Files

This step writes a file into the instance IMPEX area (typically under `IMPEX/src/...`). The produced file can be consumed by a later step in the same flow (for example a replication or a custom processing step) or downloaded via WebDAV. See the `b2c:b2c-custom-job-steps` skill for IMPEX hand-off patterns.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
