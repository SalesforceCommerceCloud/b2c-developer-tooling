---
name: b2c-replication
description: Automate code and data replication from a B2C Commerce staging instance to production or development with the b2c CLI, using a custom job built on the ExecuteCodeReplication and ExecuteDataReplication job steps. Use this skill whenever the user wants to script or schedule replication, replicate from CI, choose replication tasks, or troubleshoot a failed replication job — even if they just say "push staging to production" or "replicate my site data".
---

# B2C Replication Skill

Replicate code and data from a staging instance to its production or development instance by importing a custom job that uses the platform's replication job steps, then running it with `b2c job run`. Run every command against the **staging** instance.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (for example, `npx @salesforce/b2c-cli job run Replicate-Global --wait`).

To publish individual products, price tables, or content assets instead of whole task groups, use granular replications (`b2c scapi replications`).

## Choose a Step

| Step type                | Replicates                                   | Availability         |
| ------------------------ | -------------------------------------------- | -------------------- |
| `ExecuteCodeReplication` | A code version (transfer, activate, or both) | B2C Commerce 26.11+  |
| `ExecuteDataReplication` | Global and per-site data task groups         | All current releases |

Both steps take one `ReplicationConfiguration` parameter: a JSON string that describes the process and its tasks. Nothing needs to be set up in Business Manager first. Both run in the organization context (`<context site-id="Sites"/>`).

The `ExecutePreconfiguredCodeReplicationProcess` and `ExecutePreconfiguredDataReplicationProcess` steps instead run a replication process already defined in Business Manager. Use them when the process should stay editable there.

## Define the Jobs

Put the job definitions in `jobs.xml` at the archive root. For the full `jobs.xml` format, see `b2c:b2c-custom-job-steps`. Ready-to-use definitions: [job definitions](references/JOBS.md).

```xml
<job job-id="Replicate-Code">
    <description>Transfer and activate the active code version</description>
    <parameters/>
    <flow>
        <context site-id="Sites"/>
        <step step-id="ReplicateCode" type="ExecuteCodeReplication" enforce-restart="false">
            <description/>
            <parameters>
                <parameter name="ReplicationConfiguration">{"code_replication_configuration":{"target":"production","type":"transfer_and_activation","code_version":{"selection":"active"}}}</parameter>
            </parameters>
        </step>
    </flow>
    <rules/>
    <triggers>
        <run-once enabled="false">
            <date>2026-01-01Z</date>
            <time>00:00:00.000Z</time>
        </run-once>
    </triggers>
</job>
```

Validate the archive, then import it on staging:

```bash
b2c validate ./replication-jobs
b2c job import ./replication-jobs --show-log
```

## Run

```bash
b2c job run Replicate-Code --wait --show-log
b2c job run Replicate-Global --wait --show-log
b2c job run Replicate-MySite --wait --show-log
```

Each run transfers the selected data (or code) and, for `transfer_and_publish` / `transfer_and_activation`, makes it live on the target. Runs take minutes. Replications run one at a time, so start the next job after the previous one finishes.

To change what a run replicates, re-import the job with an updated configuration. Keep one job per configuration you run (for example, a code job, a global-data job, and one per site) rather than editing a single job.

`<triggers>` is required. The disabled `run-once` trigger registers the job for on-demand runs. To schedule replication, use a `<run-recurring>` trigger (see `b2c:b2c-custom-job-steps`) or run `b2c job run` from a scheduled CI pipeline.

## Configuration

Code replication (`code_replication_configuration`):

| Field          | Values                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`       | `production` or `development` (required)                                                                                                              |
| `type`         | `transfer`, `activation`, `transfer_and_activation`, or `undo` (required)                                                                             |
| `code_version` | `{"selection":"active"}` or `{"selection":"specific","id":"<version>"}`; required for `transfer` and `transfer_and_activation`, not allowed otherwise |
| `description`  | Optional label for the process                                                                                                                        |

Data replication (`data_replication_configuration`):

| Field                | Values                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `target`             | `production` or `development` (required)                                                  |
| `type`               | `transfer`, `publish`, `transfer_and_publish`, or `undo` (required)                       |
| `tasks.global`       | Global task groups, or `{"all": true}`                                                    |
| `tasks.sites.<site>` | Per-site task groups keyed by site ID, or `{"all": true}`                                 |
| `cache_invalidation` | `clear_all`, `clear_impacted_partitions`, or `keep_all`                                   |
| `notification`       | `{"type": "process_end" \| "process_error" \| "periodically", "to": ["ops@example.com"]}` |
| `description`        | Optional label for the process                                                            |

Tasks left out, or set to `false`, are not replicated. Task group names: [data tasks](references/DATA-TASKS.md).

## First Replication of a Site

Site data replicates only to a site that already exists on the target. The site itself is created by the **global** tasks (`sites`). A combined configuration fails on the first run: the target has no site yet, so the site tasks are skipped, and the run fails with a generic error such as `Optimistic locking failure` or `ErrorGeneric`.

For a site that has never been replicated, run two jobs in order:

1. Global data (`{"global": {"all": true}}` or at least `{"global": {"sites": true}}`)
2. Site data (`{"sites": {"MySite": {"all": true}}}`)

Keep the global and site jobs separate so the same jobs work for new and existing sites.

## Troubleshooting

- **Generic failure, no detail in the job log.** Look for the cause in the staging instance logs around the run time (`b2c logs get --level INFO --since 30m -g replication`). Lines such as `Skipping site ... because it is not replicated to 'Production' yet` or `Empty replication task encountered` point to the first-replication order above.
- **Job is OK but nothing replicated.** Check the step exit status. `NO_STAGING_INSTANCE` means the job ran on an instance other than staging; the step succeeds without doing anything.
- **Storefronts.** Composable storefronts (Storefront Next) do not replicate. Import them on the target; see `b2c-cli:b2c-storefronts`.

## Related Skills

- `b2c-cli:b2c-job` — run, wait for, and inspect jobs
- `b2c:b2c-custom-job-steps` — `jobs.xml` format, triggers, and custom steps
- `b2c-cli:b2c-storefronts` — moving Storefront Next storefronts between instances
