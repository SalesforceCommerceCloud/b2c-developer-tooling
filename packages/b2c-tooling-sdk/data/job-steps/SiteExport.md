<!-- prettier-ignore-start -->
# Job Step: SiteExport

**Type ID:** `SiteExport`  
**Scope:** Organization (add to an organization-level job flow)  
**Category:** Standard / system job step (Export)

Exports site data. The DataUnits parameter defines which objects are included in the export. Its function is similar to the Data Units to Export field on the Business Manager Site Import & Export page. The parameter requires a string in JSON format that describes the data to be exported. Units not included in the JSON are not included in the export.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `DataUnits` | Yes | — | — | String in JSON format that describes the data to be exported. |
| `ExportFile` | No | — | — | Export file name and path relative to 'IMPEX/src/instance'. Required if not using FileNamePrefix. |
| `FileNamePrefix` | No | — | — | Prefix for the export file. Can include a path relative to 'IMPEX/src/instance'. The timestamp is appended. To order the files chronologically, sort alphabetically. Required if not using ExportFile. |
| `OverwriteExportFile` | Yes | `true` | — | If selected, the option overwrites an existing file. If not selected and a file exists, the job exits and reports an error. |
| `SaveOnRealm` | Yes | `false` | — | If selected, the export file will be saved in the global realm directory. |

## Working With IMPEX Files

This step writes a file into the instance IMPEX area (typically under `IMPEX/src/...`). The produced file can be consumed by a later step in the same flow (for example a replication or a custom processing step) or downloaded via WebDAV. See the `b2c:b2c-custom-job-steps` skill for IMPEX hand-off patterns.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
