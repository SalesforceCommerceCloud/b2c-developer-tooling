<!-- prettier-ignore-start -->
# Job Step: ExecutePipeline

**Type ID:** `ExecutePipeline`  
**Scope:** Organization & Sites (add to an organization- or site-level job flow)  
**Category:** Standard / system job step (Processing)

Executes a pipeline. The name and start node of the pipeline has to be configured at parameter 'ExecutePipeline.Pipeline'. This step has been provided to ease the transition from pipeline based jobs to the new job framework. To fully leverage the new framework use system or custom job steps. Deprecated: This job step is deprecated. We recommend you replace pipelines with system job steps and custom job steps.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `ExecutePipeline.Pipeline` | Yes | — | — | The process pipeline to execute, e.g. 'MyProcessPipeline-Start'. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
