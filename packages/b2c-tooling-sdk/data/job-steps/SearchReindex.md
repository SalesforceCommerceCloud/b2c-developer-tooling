<!-- prettier-ignore-start -->
# Job Step: SearchReindex

**Type ID:** `SearchReindex`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Processing)

Rebuilds or updates search indexes. The number of search indexes that can be rebuilt or updated in parallel is globally limited. If the limit is exceeded, any rebuild or update action will be queued and executed once resources are available again.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `Active data search index` | No | `false` | — | Reindex active data search indexes. |
| `Content search index` | No | `false` | — | Reindex content search indexes. |
| `Indexer Type` | Yes | `Full Index Rebuild` | `Full Index Rebuild`, `Incremental Index Update` | Determines whether to rebuild or update incrementally. |
| `Product related search indexes` | No | `false` | — | Reindex product related search indexes which contain 'Product', 'Suggest' and 'Synonym' search indexes. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
