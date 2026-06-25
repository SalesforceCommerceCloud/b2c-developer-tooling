<!-- prettier-ignore-start -->
# Job Step: InvalidateCache

**Type ID:** `InvalidateCache`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Processing)

Invalidate Page and Static Content Cache Invalidates the page cache and/or static content cache (images, styles, etc.) of the sites specified for the job flow. Portions of the page cache may be invalidated by specifying a set of page cache partition IDs, which will invalidate only the page cache that matches the controllers/pipelines specified with these partitions.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `InvalidatePageCache` | Yes | `true` | — | If selected, then pages in the page cache are deleted. If the PageCachePartitionIDs parameters is specified, only those partitions are invalidated, otherwise the entire page cache. |
| `InvalidateStaticCache` | Yes | `true` | — | If selected, then all files in the static content cache are invalidated. Page cache should be invalidated at the same time to refresh static content URLs. |
| `PageCachePartitionIDs` | No | — | — | A comma separated list of page cache partition IDs to invalidate in the page cache. If specified, only the portion of the page cache specified by the partitions is invalidated, as opposed to the entire page cache. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
