---
description: Choose B2C Commerce MCP capabilities for documentation, development, deployment, debugging, and observability.
---

# Tools and Capabilities

All toolsets are enabled by default. Use [tool selection](./configuration#toolset-selection)
to expose a smaller set to your coding assistant. Preview tools require separate
opt-in. Enabling a tool does not grant the credentials it needs.

## Skills and documentation {#documentation}

Get help with B2C Commerce APIs, platform features, and development workflows.
No Commerce credentials are required.

| Capability                                                                          | Tools                                                        | Availability                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| Workflow skills for CLI, Commerce development, and Storefront Next                  | `skills_read`                                                | All toolsets; bundled and available offline.    |
| Script API, job steps, developer guides, Salesforce Help, and tooling documentation | `docs_search`, `docs_read`, `docs_list`                      | All toolsets; some content is retrieved online. |
| XML import/export schema reference                                                  | `docs_schema_search`, `docs_schema_read`, `docs_schema_list` | All toolsets.                                   |

See [workflow skills](./skills) for included topics and
[documentation topic settings](./configuration#documentation-tools-restriction)
to limit the documentation available to your assistant.

## Cartridge deployment {#cartridges}

Deploy all or selected cartridges to a B2C Commerce instance with
`cartridge_deploy`. Available in **CARTRIDGES**.

Configure the instance, code version, and WebDAV write access. Deployment writes
to the selected code version; optionally reloading it requires OCAPI access too.
Verify the target and selected cartridges before deploying. See
[authentication setup](../guide/authentication) and [deployment access](./security#deployments).

## Managed Runtime bundles {#mrt}

Publish a pre-built PWA Kit or Storefront Next bundle with `mrt_bundle_push`.
Available in **MRT**, **PWAV3**, and **STOREFRONTNEXT**.

Build the application before publishing. The tool can push a bundle without
activating it, or deploy it to a chosen environment. Configure an MRT API key,
project, and an environment when deploying. See
[MRT credentials](./configuration#mrt-credentials).

## Debugging {#diagnostics}

Investigate server-side scripts with breakpoints, stepping, stack inspection,
variable inspection, and diagnostic captures. Available in **DIAGNOSTICS**,
**CARTRIDGES**, and **SCAPI**.

The `debug_*` tools cover these operations, including `debug_start_session`,
`debug_capture_at_breakpoint`, and `debug_end_session`. Configure a Business
Manager account or access key with `WebDAV_Manage_Customization` permission;
OAuth is not supported for debugging.

Breakpoints can pause requests, and expression evaluation can change application
state. Use a development sandbox and end sessions when finished. See
[debugger access and cleanup](./security#debugger).

## Logs {#logs}

| Capability                            | Tools                                                | Access and availability                                                    |
| ------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| List, read, and monitor instance logs | `logs_list_files`, `logs_get_recent`, `logs_watch_*` | WebDAV log-read access; DIAGNOSTICS, CARTRIDGES, SCAPI.                    |
| Monitor live MRT application logs     | `mrt_logs_watch_*`                                   | MRT API key, project, and environment; DIAGNOSTICS, PWAV3, STOREFRONTNEXT. |

MRT log access is live-stream only; historical log retrieval is not provided.
Logs may contain customer data, session identifiers, or secrets. Review your
assistant's data handling policies before granting access.

## SCAPI development {#scapi}

Available in **SCAPI**, **PWAV3**, and **STOREFRONTNEXT**.

| Capability                             | Tool                           | Access and effect                                         |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| Browse standard and custom API schemas | `scapi_schemas_list`           | OAuth with `sfcc.scapi-schemas`; reads schemas.           |
| Check custom endpoint registration     | `scapi_custom_apis_get_status` | OAuth with `sfcc.custom-apis`; reads registration status. |

Schema and registration access also require the instance short code and tenant
ID. See [authentication and scopes](../guide/authentication#configuring-scopes).

To generate a custom API locally, use [`b2c scaffold generate custom-api`](../cli/scaffold#b2c-scaffold-generate).

### Observability metrics (closed beta) {#metrics}

`metrics_get` provides Commerce observability metrics for supported categories
and time ranges. It requires Metrics API access, OAuth scope `sfcc.metrics`,
and `--allow-non-ga-tools`. Available in **SCAPI**. Enabling the tool does not
enroll your tenant in the closed beta.

## Configuration inspection

`config_inspect` reports the selected project, instance, credentials configuration,
and target. Secrets are redacted by default. Available in **DIAGNOSTICS**. Use it to check the target before a connected task.

## Toolsets for customization

| Toolset          | Use it for                                                   |
| ---------------- | ------------------------------------------------------------ |
| `CARTRIDGES`     | Cartridge deployment and instance diagnostics.               |
| `DIAGNOSTICS`    | Debugging, instance/MRT logs, and configuration inspection.  |
| `MRT`            | Publishing and deploying Managed Runtime bundles.            |
| `PWAV3`          | Shared MRT and SCAPI tools for PWA Kit projects.             |
| `SCAPI`          | API development, instance diagnostics, and optional metrics. |
| `STOREFRONTNEXT` | Shared MRT and SCAPI tools for Storefront Next projects.     |

Skills and documentation are included in every toolset. Tools shared by
multiple toolsets appear once. For exact tool parameters, use your MCP client's
installed tool details, which match the server version you are running.
