<!-- prettier-ignore-start -->
# Job Step: ExecuteScriptModule

**Type ID:** `ExecuteScriptModule`  
**Scope:** Organization & Sites (add to an organization- or site-level job flow)  
**Category:** Standard / system job step (Processing)

Executes a function exported by a script module. The module ID has to be configured at parameter 'ExecuteScriptModule.Module'. Deprecated: This job step is deprecated. We recommend that you use the steptypes.json file to execute a script.

This is a built-in (standard) job step provided by the B2C Commerce platform. Add it to a job flow in **Business Manager → Administration → Operations → Jobs**, or reference it by its type ID in a `jobs.xml` flow inside a site-import archive.

## Configuration Parameters

| Parameter | Required | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `ExecuteScriptModule.Module` | Yes | — | — | The ID of the script module, e.g. my_cartridge/cartridge/scripts/job/myScriptModule.js |
| `ExecuteScriptModule.FunctionName` | No | `execute` | — | The name of the script module's exported function to execute. If not defined teh script is supposed to export a function named 'execute'. |
| `ExecuteScriptModule.TimeoutInSeconds` | No | — | — | The timeout in seconds for the script module's function. If not defined the batch processing framework applies the default timeout. |
| `ExecuteScriptModule.Transactional` | No | `false` | — | Indicates if the script module's function requires transaction handling. The default value is 'false'. To avoid a negative impact on system performance and allow more granular transaction control, keep the default setting of 'false'. Implement transaction handling within the job step using the dw.system.Transaction API. |

## Related

- Run a job that uses this step: `b2c job run <job-id>` (see the `b2c-cli:b2c-job` skill).
- Author custom steps to chain with this one: `b2c:b2c-custom-job-steps` skill.
- Find more docs: `b2c docs search <term>` and `b2c docs read <id>`.

<!-- prettier-ignore-end -->
