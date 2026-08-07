<!-- prettier-ignore-start -->
# Job Step: UndoPreconfiguredDataReplicationProcess

**Type ID:** `UndoPreconfiguredDataReplicationProcess`  
**Scope:** Organization (add to an organization-level job flow)  
**Category:** Standard / system job step (Processing)

Undo the preconfigured data replication process with the ID defined at parameter 'ReplicationProcessID'. The given data replication process must have been executed using a step of type 'ExecutePreconfiguredDataReplicationProcess' by the same job.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `ReplicationProcessID` | Yes | — | — | The ID of the preconfigured replication process. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
