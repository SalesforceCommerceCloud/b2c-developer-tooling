<!-- prettier-ignore-start -->
# Job Step: ExecuteDataReplication

**Type ID:** `ExecuteDataReplication`  
**Scope:** Organization (add to an organization-level job flow)  
**Category:** Standard / system job step (Processing)

Replicates data to a target system. The ReplicationConfiguration parameter requires a string in JSON format that describes the replication process and its tasks that will be executed. The parameter section that describes the tasks is similar to the Replication Tasks step of the Business Manager Data Replication wizard. Replication tasks not included in the JSON are not included in the data replication process. Replication tasks set to 'false' are also not included in the data replication process.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `ReplicationConfiguration` | Yes | — | — | Describes the replication process and its replication tasks that will be executed. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
