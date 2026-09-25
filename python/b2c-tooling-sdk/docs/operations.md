# Operations

The operations layer provides task-oriented functions built on top of the typed
clients. Each subpackage lives under `b2c_tooling_sdk.operations.*`; the commonly
used symbols are also re-exported at the top level. Operations inspect
`ClientResult` values and **raise typed exceptions on error** (success-or-raise),
so you can write straight-line code.

All examples assume an authenticated `instance`:

```python
from b2c_tooling_sdk import resolve_config

config = await resolve_config()
instance = config.create_b2c_instance()
```

## Code: deploy, cartridges, versions

`b2c_tooling_sdk.operations.code` handles cartridge upload/deployment and code
version management.

```python
from b2c_tooling_sdk.operations.code import (
    find_and_deploy_cartridges,
    list_code_versions,
    activate_code_version,
    create_code_version,
)

# Find cartridges in a directory, zip, upload via WebDAV, and (optionally) activate
result = await find_and_deploy_cartridges(instance, "./cartridges")

# Manage code versions
versions = await list_code_versions(instance)
await create_code_version(instance, "version2")
await activate_code_version(instance, "version2")
```

Deployment requires `instance.config.code_version` to be set. For SCAPI/OCAPI
selection, use `create_scripts_backend(ScriptsBackendConfig(...))`.

## Jobs: execute, wait, site archive

`b2c_tooling_sdk.operations.jobs` runs Business Manager jobs and performs
site-archive import/export.

```python
from b2c_tooling_sdk.operations.jobs import (
    execute_job,
    wait_for_job,
    site_archive_export_to_path,
)

execution = await execute_job(instance, "MyJob")
finished = await wait_for_job(instance, "MyJob", execution.id)
print(finished.status)

# Export a site archive to a local zip
await site_archive_export_to_path(instance, "./export.zip", options=None)
```

`wait_for_job` polls to a terminal state and raises `JobExecutionError` if the
job fails. SCAPI-native variants are available as `scapi_execute_job`,
`scapi_get_job_execution`, and friends.

## Sites: cartridge paths

`b2c_tooling_sdk.operations.sites` reads and edits site cartridge paths (SCAPI
first, with OCAPI and site-archive fallbacks). `Sites-Site` (Business Manager) is
supported via import/export.

```python
from b2c_tooling_sdk.operations.sites import (
    get_cartridge_path,
    add_cartridge,
    AddCartridgeOptions,
)

result = await get_cartridge_path(instance, "RefArch")
print(result.cartridge_list)

await add_cartridge(instance, "RefArch", AddCartridgeOptions(name="my_cartridge", position="first"))
```

## Catalogs

`b2c_tooling_sdk.operations.catalogs` lists and inspects catalogs through a
dual-backend (SCAPI/OCAPI) façade.

```python
from b2c_tooling_sdk.operations.catalogs import (
    create_catalogs_backend,
    CatalogsBackendConfig,
    ListCatalogsOptions,
)

backend = create_catalogs_backend(CatalogsBackendConfig(instance=instance))
catalogs = await backend.list_catalogs(ListCatalogsOptions())
```

## Business Manager users and roles

`b2c_tooling_sdk.operations.bm_users` and `...bm_roles` manage Business Manager
users and roles via a dual backend.

```python
from b2c_tooling_sdk.operations.bm_users import (
    create_users_backend,
    UsersBackendConfig,
    ListUsersOptions,
)

users = create_users_backend(UsersBackendConfig(instance=instance))
result = await users.list_users(ListUsersOptions())
```

## ODS: sandbox provisioning and polling

`b2c_tooling_sdk.operations.ods` provisions and waits on On-Demand Sandboxes,
with typed polling errors (`SandboxPollingTimeoutError`,
`SandboxTerminalStateError`, `CloneFailedError`, ...).

```python
from b2c_tooling_sdk.clients import create_ods_client, OdsClientConfig
from b2c_tooling_sdk.operations.ods import wait_for_sandbox, WaitForSandboxOptions

client = create_ods_client(OdsClientConfig(...), auth)
await wait_for_sandbox(client, WaitForSandboxOptions(sandbox_id="...", target_state="started"))
```

## Metrics

`b2c_tooling_sdk.operations.metrics` queries the SCAPI Metrics API. Build a
metrics client, then call the category helpers.

```python
from b2c_tooling_sdk.clients import create_metrics_client, MetricsClientConfig
from b2c_tooling_sdk.operations.metrics import get_overall_metrics

scapi = instance.scapi_client_config
client = create_metrics_client(
    MetricsClientConfig(short_code=scapi.short_code, tenant_id=scapi.tenant_id),
    scapi.auth,
)
overall = await get_overall_metrics(client, scapi.tenant_id)
```

Category-specific helpers include `get_sales_metrics`, `get_controller_metrics`,
`get_scapi_metrics`, `get_ocapi_metrics`, `get_ecdn_metrics`, and
`get_metrics_by_category`.

## Logs

`b2c_tooling_sdk.operations.logs` lists, tails, and analyzes instance log files
over WebDAV.

```python
from b2c_tooling_sdk.operations.logs import list_log_files, ListLogsOptions

files = await list_log_files(
    instance,
    ListLogsOptions(prefixes=["error", "customerror"], sort_by="date", sort_order="desc"),
)
for f in files:
    print(f.name, f.size)
```

`tail_logs` and `get_recent_logs` provide streaming and one-shot tailing. The
streaming API (`tail_logs`) is an async, callback-driven operation and is
therefore **not** part of the synchronous facade — see [Synchronous
API](sync-api.md).

## Account Manager users, roles, orgs

Top-level functions cover Account Manager directly: `create_user`, `get_user`,
`update_user`, `delete_user`, `grant_role`, `revoke_role`, `list_users`;
`get_role`, `list_roles`; `get_org`, `get_org_by_name`, `list_orgs`.

## API reference

See the [operations sections of the API reference](api-reference.md#operations-code).
