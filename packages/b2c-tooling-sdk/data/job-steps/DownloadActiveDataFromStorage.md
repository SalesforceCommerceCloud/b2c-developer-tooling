<!-- prettier-ignore-start -->
# Job Step: DownloadActiveDataFromStorage

**Type ID:** `DownloadActiveDataFromStorage`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Processing)

Download active data from storage system to current site. This step downloads active data to the new site from storage system during a site move if active data is required to migrate to the new site. Before this step can run, set the new site to 'Online' mode. This prevents premature migration for the new site. The StorageFolderName parameter needs to use the value from UploadActiveDataToStorageStep's log.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `StorageFolderName` | Yes | — | — | This is the storage folder name created by the UploadActiveDataToStorage step. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
