# B2C Tooling SDK — symbol catalog

The full public surface of `b2c_tooling_sdk`, grouped by subsystem. Everything
listed under "top-level barrel" is importable directly from `b2c_tooling_sdk`
(async) and, unless noted, has a blocking twin in `b2c_tooling_sdk.sync` with an
identical signature minus `await`. Submodule-only APIs (SLAS, `operations.sites`,
log streaming) must be imported from their submodule and are called out below.

Async source is the truth; for sync, import the same name from
`b2c_tooling_sdk.sync` and drop `await`. See the SKILL for the async/sync rules
and the operations-vs-clients error contract.

## Auth (`b2c_tooling_sdk.auth`)

Strategies: `OAuthStrategy`, `JwtOAuthStrategy`, `PkceOAuthStrategy`,
`ImplicitOAuthStrategy`, `BasicAuthStrategy`, `ApiKeyStrategy`.
Base/protocol: `AuthStrategy`, `AuthConfig`, `AuthCredentials`, `AuthMethod`,
`ALL_AUTH_METHODS`, `AccessTokenResponse`, `DecodedJWT`.
Helpers: `resolve_auth_strategy`, `check_available_auth_methods`, `decode_jwt`.

Session store (from `b2c_tooling_sdk.auth`, shared byte-for-byte with the CLI's
`auth-sessions.json`): `find_auth_session`, `is_auth_session_token_valid`,
`list_auth_sessions`. Interactive user-login helper: `create_user_auth_strategy`.

## Config (`b2c_tooling_sdk.config`)

`resolve_config`, `create_config_resolver`, `ConfigResolver`,
`create_instance_from_config`, `find_dw_json`, `load_dw_json`.
Types/options: `NormalizedConfig`, `ResolvedB2CConfig`, `ResolveConfigOptions`,
`CreateB2CInstanceOptions`, `CreateOAuthOptions`, `ConfigSource`,
`ConfigSourceInfo`, `ConfigWarning`.
Multi-env `dw.json` management (from `b2c_tooling_sdk.config`): `add_instance`,
`remove_instance`, `set_active_instance`.

## Instance (`b2c_tooling_sdk.instance`)

`B2CInstance`, `B2CInstanceOptions`, `InstanceConfig`, `ScapiClientConfig`.
`B2CInstance` exposes lazy typed clients: `.ocapi` (OCAPI Data API), `.webdav`,
and `.scapi_client_config` (`ScapiClientConfig | None` — `None` when the instance
can't do SCAPI; carries `short_code`, `tenant_id`, `auth`).

## Clients (`b2c_tooling_sdk.clients`)

Low-level, **openapi-fetch semantics**: every call returns
`ClientResult(data, error, response)` and never raises on 4xx/5xx (only a real
network failure raises `NetworkError`).

Factories: `create_ocapi_client`, `create_metrics_client`, `create_ods_client`,
`create_custom_apis_client`, `create_preferences_client`, `create_cdn_zones_client`,
`create_granular_replications_client`, `create_slas_client`,
`create_account_manager_users_client`, `create_account_manager_roles_client`,
`create_account_manager_orgs_client`, `create_account_manager_api_clients_client`.
Client classes: `OcapiClient`, `WebDavClient`, `MetricsClient`, `OdsClient`,
`CustomApisClient`, `PreferencesClient`, `CdnZonesClient`,
`GranularReplicationsClient`, `SlasClient`, `AccountManager*Client`.
Configs: `MetricsClientConfig`, `OdsClientConfig`, `CustomApisClientConfig`,
`PreferencesClientConfig`, `CdnZonesClientConfig`,
`GranularReplicationsClientConfig`, `SlasClientConfig`,
`AccountManagerClientConfig`.
Middleware: `create_auth_middleware`, `create_extra_params_middleware`.
Errors/helpers: `OcapiDeprecatedError`, `get_api_error_message`,
`throw_ocapi_error`, `is_ocapi_deprecated_fault`, `ocapi_deprecated_message`.
Scope/tenant helpers: `to_organization_id`, `normalize_tenant_id`,
`build_tenant_scope`, `resolve_to_internal_role`, `resolve_from_internal_role`,
`fetch_role_mapping`, `is_valid_role_tenant_filter`.
Scope constants: `METRICS_DEFAULT_SCOPES`, `CUSTOM_APIS_DEFAULT_SCOPES`,
`PREFERENCES_READ_SCOPES`, `PREFERENCES_RW_SCOPES`, `CDN_ZONES_READ_SCOPES`,
`CDN_ZONES_RW_SCOPES`.
`WebDavClient`: `put`, `get`, `delete`, `propfind` (`PropfindEntry`).

## Operations (task-oriented, **success-or-raise**)

### Code (`operations.code`)
`find_and_deploy_cartridges`, `find_cartridges`, `upload_cartridges`,
`delete_cartridges`, `watch_cartridges` (`WatchOptions`/`WatchResult`),
`list_code_versions`, `get_active_code_version`, `create_code_version`,
`activate_code_version`, `reload_code_version`, `delete_code_version`.
Backend factory: `create_scripts_backend` (`ScriptsBackend`,
`Ocapi`/`ScapiScriptsBackend`). Types: `DeployOptions`, `DeployResult`,
`FindCartridgesOptions`, `CartridgeMapping`, `CodeVersion`, `CodeVersionInfo`,
`CodeVersionResult`, `CodeVersionActivationResult`.
Deploy requires `instance.config.code_version` set.

### Jobs (`operations.jobs`)
`execute_job`, `wait_for_job`, `wait_for_job_execution`, `get_job_execution`,
`get_job_log`, `search_job_executions`, `find_running_job_execution`,
`get_job_error_message`. Site archive: `site_archive_import`,
`site_archive_export`, `site_archive_export_to_path`. Native SCAPI variants:
`scapi_execute_job`, `scapi_get_job_execution`, `scapi_get_job_log`,
`scapi_search_job_executions`, `scapi_delete_job_execution`.
Errors: `JobExecutionError`, `CanonicalJobExecutionError`. Types:
`JobExecution`, `JobExecutionStatus`, `JobStepExecution`, `ExecuteJobOptions`,
`WaitForJobOptions`, `SiteArchive{Import,Export}Options`/`Result`, plus the
`Export*Configuration` structures.

### Sites (`operations.sites` — submodule import only)
`get_cartridge_path`, `set_cartridge_path`, `add_cartridge`, `remove_cartridge`,
`create_sites_backend`. Types: `SiteInfo`, `SitesBackend`, `CartridgePathResult`,
`CartridgePosition`, `AddCartridgeOptions`, `ListSitesOptions`, `BM_SITE_ID`.

### Catalogs (`operations.catalogs`)
`create_catalogs_backend` (dual-backend SCAPI→OCAPI). Types: `CatalogInfo`,
`CatalogsBackend`, `ListCatalogsOptions`, `Ocapi`/`ScapiCatalogsBackend`.

### BM users / BM roles (`operations.bm_users`, `operations.bm_roles`)
`create_users_backend`, `create_roles_backend` (dual-backend). Types:
`UserInfo`/`RoleInfo`, `CreateUserInput`/`CreateRoleInput`,
`UpdateUserChanges`, `ListUsersOptions`, `SearchUsersOptions`, backends and
their configs.

### ODS / sandboxes (`operations.ods`)
`wait_for_sandbox`, `wait_for_clone`, `wait_for_clones`, `build_sandbox_settings`,
`resolve_sandbox_id`, `parse_friendly_sandbox_id`, `is_friendly_sandbox_id`,
`is_uuid`. Pair with `create_ods_client`. States: `SandboxState`, `CloneState`.
Errors: `SandboxNotFoundError`, `SandboxPollingError`,
`SandboxPollingTimeoutError`, `SandboxTerminalStateError`, `CloneFailedError`,
`ClonePollingError`/`TimeoutError`, `CloneBatch*Error`.

### Metrics (`operations.metrics`)
`get_overall_metrics`, `get_sales_metrics`, `get_scapi_metrics`,
`get_scapi_hooks_metrics`, `get_ocapi_metrics`, `get_controller_metrics`,
`get_ecdn_metrics`, `get_mrt_metrics`, `get_third_party_metrics`,
`get_metrics_by_category`. Pair with `create_metrics_client`. Window helpers:
`resolve_metrics_window`, `parse_metrics_bound`, `parse_series_tags`,
`enrich_metrics_tags`. Constants: `METRIC_CATEGORIES`,
`METRICS_DEFAULT_WINDOW_MS`, `METRICS_RETENTION_MS`.

### Logs (`operations.logs`)
`list_log_files`, `get_recent_logs`. **`tail_logs` is async-only** (streaming;
not in `b2c_tooling_sdk.sync`) — import from `operations.logs` and use the async
API. Filters/parsers: `filter_by_level`, `filter_by_search`, `filter_by_since`,
`parse_log_entry`, `aggregate_log_entries`, `create_path_normalizer`. Types:
`LogEntry`, `LogFile`, `TailLogsOptions`, `TailLogsCallbacks`, `TailLogsResult`.

### Account Manager (`operations.users`, `operations.roles`, `operations.orgs`)
Users: `create_user`, `get_user`, `get_user_by_login`, `update_user`,
`delete_user`, `purge_user`, `reset_user`, `grant_role`, `revoke_role`,
`list_users`. Roles: `list_roles`, `get_role`. Orgs: `list_orgs`, `get_org`,
`get_org_by_name`.

## SLAS shopper tokens (`b2c_tooling_sdk.slas` — submodule import only)

Not in the top-level barrel; blocking twins live in `b2c_tooling_sdk.sync`.
`get_guest_token`, `get_registered_token`, `generate_code_verifier`,
`generate_code_challenge`. Types: `SlasTokenConfig`, `SlasTokenResponse`,
`SlasRegisteredLoginConfig`.
The tooling SDK has no dedicated storefront client — after minting a token, call
Shopper endpoints with plain `httpx` using `token.access_token` as a bearer.

## Version / defaults / logging (top-level)

`SDK_NAME`, `SDK_VERSION`, `SDK_USER_AGENT`; `DEFAULT_ACCOUNT_MANAGER_HOST`,
`DEFAULT_ODS_HOST`, `DEFAULT_PUBLIC_CLIENT_ID`, `get_default_public_client_id`;
`get_logger`, `configure_logger`.
