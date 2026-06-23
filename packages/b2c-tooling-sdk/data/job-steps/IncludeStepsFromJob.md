<!-- prettier-ignore-start -->
# Job Step: IncludeStepsFromJob

**Type ID:** `IncludeStepsFromJob`  
**Scope:** Organization & Sites (add to an organization- or site-level job flow)  
**Category:** Standard / system job step (Processing)

Includes steps from another job. This step makes it easy to create a set of standard steps that you can execute in multiple jobs. It is recommended to use the IncludeStepsFromJob step in single execution scope flows only (Organization or one specific Storefront Site). If the IncludeStepsFromJob step is used in multi-site execution scope flows (more than one specific Storefront Site, All Storefront Sites) inclusion of the steps is done multiple times.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `JobID` | Yes | — | — | The ID of the job to import steps from. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
