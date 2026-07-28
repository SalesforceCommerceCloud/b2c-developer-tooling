<!-- prettier-ignore-start -->
# Job Step: ExportFacebookFeed

**Type ID:** `ExportFacebookFeed`  
**Scope:** Site (add to a site-level job flow)  
**Category:** Standard / system job step (Export)

Exports Catalog Feed for Facebook.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

This step takes no configuration parameters.

## Working With IMPEX Files

This step writes a file into the instance IMPEX area (typically under `IMPEX/src/...`). The produced file can be consumed by a later step in the same flow (for example a replication or a custom processing step) or downloaded via WebDAV. See the `b2c:b2c-custom-job-steps` skill for IMPEX hand-off patterns.

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
