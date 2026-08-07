<!-- prettier-ignore-start -->
# Job Step: UploadActiveDataToStorage

**Type ID:** `UploadActiveDataToStorage`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Processing)

Upload current site's active data to storage system. This step uploads active data from an old site to storage system during a site move if active data is required to migrate to the new site. Before this step can run, put the old site in 'Maintenance' mode for at least 90 minutes. This lets the old site fully process active data before the migration happens. When the job finishes, copy the storage folder name from the job log.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `TargetRealm` | Yes | — | — | The 4-letter target realm where the Active Data is intended to be downloaded by the DownoadActiveDataFromStorage step. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
