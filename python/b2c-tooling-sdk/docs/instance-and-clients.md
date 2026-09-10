# Instance & Clients

## `B2CInstance`

A `B2CInstance` represents a connection to one B2C Commerce instance. It combines
instance configuration (`InstanceConfig`) with authentication (`AuthConfig`) and
exposes lazy, typed API clients. You usually build one from resolved
configuration rather than constructing it directly:

```python
from b2c_tooling_sdk import resolve_config

config = await resolve_config()
instance = config.create_b2c_instance()
```

Authentication is selected automatically from the configured credentials: WebDAV
prefers Basic auth when configured and allowed, otherwise falls back to OAuth;
OCAPI always uses OAuth.

## `.ocapi` and `.webdav`

The two most-used clients are lazy properties on the instance:

```python
# OCAPI Data API (always OAuth)
result = await instance.ocapi.get("/sites")

# WebDAV file operations
await instance.webdav.put("Cartridges/version1/foo.txt", b"hello")
entries = await instance.webdav.propfind("Logs/")
```

## Typed SCAPI clients

SCAPI Admin clients are created with factory functions from
`b2c_tooling_sdk.clients` (or the top-level barrel). Each takes a config
dataclass plus an auth strategy. Because SCAPI Admin APIs need system auth that
can request arbitrary `sfcc.*` scopes per request, an instance only offers SCAPI
coordinates when it is configured with a stateless flow (client-credentials or
JWT) **and** carries a `short_code` + `tenant_id`:

```python
from b2c_tooling_sdk.clients import create_metrics_client, MetricsClientConfig

scapi = instance.scapi_client_config
if scapi is not None:
    metrics = create_metrics_client(
        MetricsClientConfig(short_code=scapi.short_code, tenant_id=scapi.tenant_id),
        scapi.auth,
    )
```

Available client factories include `create_metrics_client`,
`create_ocapi_client`, `create_ods_client`, `create_preferences_client`,
`create_cdn_zones_client`, `create_custom_apis_client`,
`create_granular_replications_client`, `create_slas_client`, and the Account
Manager clients (`create_account_manager_orgs_client`, `..._users_client`,
`..._roles_client`, `..._api_clients_client`).

## `ClientResult`: clients never raise on HTTP errors

The typed clients mirror the TypeScript SDK's `openapi-fetch` convention. Every
call returns a `ClientResult` with three attributes and **never raises on a
4xx/5xx** response:

- `data` — the parsed body on a 2xx response (otherwise `None`)
- `error` — the parsed body on any non-2xx response (otherwise `None`)
- `response` — the raw `httpx.Response`, always present

Only genuine network failures raise (wrapped as a `NetworkError`) before a result
exists.

```python
result = await instance.ocapi.get("/sites")
if result.error is not None:
    print("request failed:", result.response.status_code, result.error)
else:
    for site in result.data.get("data", []):
        print(site["id"])
```

## Operations raise typed exceptions

The higher-level [operations layer](operations.md) is the ergonomic counterpart:
each operation inspects the `ClientResult` for you and **raises a typed
exception** on failure (mirroring the TypeScript `if (error || !data) throw`
convention) — for example `JobExecutionError`, `OcapiDeprecatedError`, or the
various sandbox polling errors. Reach for the raw clients when you want to handle
status codes yourself; reach for operations when you want success-or-raise
semantics.

## API reference

See the [instance](api-reference.md#instance) and
[clients](api-reference.md#clients) sections of the API reference.
