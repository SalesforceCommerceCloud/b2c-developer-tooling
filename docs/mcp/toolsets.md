---
description: B2C Commerce MCP tool names, capabilities, and required access.
---

# Tools and Capabilities

All toolsets are enabled by default. Use exact names from these tables with
`--tools` or your client's tool controls. Use `--toolsets` to select capability
groups. See [tool selection](./configuration#toolset-selection).

## Skills and documentation {#documentation}

Available in every toolset. No Commerce credentials required; some documentation
is retrieved online.

| Tool                 | Capability                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| `skills_read`        | Browse, search, and read Commerce, CLI, Storefront Next, and MCP skills. |
| `docs_search`        | Find platform references, guides, Salesforce Help, and tooling docs.     |
| `docs_read`          | Read a documentation article.                                            |
| `docs_list`          | Browse documentation categories and titles.                              |
| `docs_schema_search` | Find XML import/export schemas.                                          |
| `docs_schema_read`   | Read an XML schema.                                                      |
| `docs_schema_list`   | List available XML schemas.                                              |

See [included skills](./skills) and [documentation topic settings](./configuration#documentation-tools-restriction).

## Deployment {#cartridges}

| Tool               | Capability                                                      | Toolsets                   |
| ------------------ | --------------------------------------------------------------- | -------------------------- |
| `cartridge_deploy` | Deploy selected cartridges; optionally reload the code version. | CARTRIDGES                 |
| `mrt_bundle_push`  | Publish a pre-built storefront bundle; optionally deploy it.    | MRT, PWAV3, STOREFRONTNEXT |

Cartridges require WebDAV write access; code-version reload also requires OCAPI
access. Check [deployment permissions](./security#deployments) before connecting.

### Managed Runtime {#mrt}

Bundle publishing requires an [MRT API key and project](./configuration#mrt-credentials),
plus an environment when deploying.

## Debugging {#diagnostics}

Available in DIAGNOSTICS, CARTRIDGES, and SCAPI. Requires a Business Manager user
or access key with `WebDAV_Manage_Customization`; OAuth is unsupported.

| Tool                          | Capability                                                   |
| ----------------------------- | ------------------------------------------------------------ |
| `debug_start_session`         | Connect the debugger and map local cartridge sources.        |
| `debug_end_session`           | Disconnect and release the debugger slot.                    |
| `debug_list_sessions`         | Find active sessions, breakpoints, and paused threads.       |
| `debug_set_breakpoints`       | Set or clear breakpoints.                                    |
| `debug_wait_for_stop`         | Wait for execution to pause.                                 |
| `debug_control`               | Continue execution or step into, over, or out of a function. |
| `debug_inspect`               | Inspect stacks, frame variables, and object members.         |
| `debug_evaluate`              | Evaluate JavaScript in a paused frame.                       |
| `debug_capture_at_breakpoint` | Capture debugger state at a selected line.                   |

Breakpoints pause requests; evaluation can change application state. Use a
sandbox and end sessions when finished. See [debugger access](./security#debugger).

## Logs {#logs}

| Tool                  | Capability                                   | Toolsets                           |
| --------------------- | -------------------------------------------- | ---------------------------------- |
| `logs_list_files`     | Browse instance log files.                   | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `logs_get_recent`     | Read and filter recent instance logs.        | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `logs_watch`          | Start, list, or stop instance log watches.   | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `logs_watch_poll`     | Retrieve entries from an instance log watch. | DIAGNOSTICS, CARTRIDGES, SCAPI     |
| `mrt_logs_watch`      | Start, list, or stop live MRT log streams.   | DIAGNOSTICS, PWAV3, STOREFRONTNEXT |
| `mrt_logs_watch_poll` | Retrieve entries from an MRT log stream.     | DIAGNOSTICS, PWAV3, STOREFRONTNEXT |

Instance logs require WebDAV log-read access. MRT logs require an API key,
project, and environment; historical MRT logs are not available. Logs may
contain sensitive data; see [data handling](./security#protect-credentials-and-data).

## SCAPI development {#scapi}

Available in SCAPI, PWAV3, and STOREFRONTNEXT. Requires OAuth, the instance short
code, and tenant ID. See [authentication and scopes](../guide/authentication#configuring-scopes).

| Tool                           | Capability                                       | OAuth scope          |
| ------------------------------ | ------------------------------------------------ | -------------------- |
| `scapi_schemas_list`           | Browse and read standard and custom API schemas. | `sfcc.scapi-schemas` |
| `scapi_custom_apis_get_status` | Check custom endpoint registration.              | `sfcc.custom-apis`   |

### SCAPI code mode (preview)

**Discover nearly 600 Salesforce Commerce API operations through two MCP tools.**

Explore products, catalogs, orders, customers, inventory, pricing, and more.
The bundled reference covers 594 Admin and Shopper operations across 57 versioned
API schemas. Discovery works offline without Commerce credentials.

Available in SCAPI, PWAV3, and STOREFRONTNEXT.

| Tool                 | Capability                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- |
| `scapi_search`       | Search bundled Admin and Shopper contracts by authentication; no credentials required. |
| `scapi_execute`      | Compose Admin API requests, including creating, updating, and deleting records.        |
| `scapi_snippet_save` | Save a completed workflow for reuse when requested.                                    |

Execution uses the selected project's OAuth credentials, short code, and tenant ID.
Grant the scopes needed for your task; creating products requires `sfcc.products.rw`.
This preview executes standard and custom Admin JSON requests; Shopper execution is not yet
supported. Binary file uploads and downloads are not supported.

Tenant custom attributes are supported in standard Admin requests. The offline
reference excludes tenant-specific definitions. Known custom fields work directly;
the agent can discover unfamiliar fields from your live schema with `sfcc.scapi-schemas`
access. `scapi_schemas_list` includes custom-property definitions by default.

Custom Admin APIs are available through live schema discovery. Grant
`sfcc.scapi-schemas` for discovery and the custom API's declared `c_*` scope for
execution. Custom APIs using Shopper authentication are not yet supported.

You can also request Account Manager or SLAS tokens for a separate HTTP client.
Normal Admin requests authenticate automatically; token export is optional.
See [code mode access](./security#scapi-code-mode).

For example: "Create an offline test product in my catalog, check that its ID is
unused, and verify the saved product."

Code mode includes reusable workflows for failed-job triage, campaign/promotion
inspection, and basic product creation with an optional name, offline setting
(offline by default), and storefront catalog category assignment. Assignment
requires Catalogs API access, including `sfcc.catalogs.rw`. Shipped names use `builtin/`;
your saved workflows use `user/`. You can ask: "Use the built-in failed-job triage
workflow for September 1-8 and show the first three failures."

After reviewing a useful run, ask your assistant to save a parameterized version
for future use. Saved workflows remain available after restarting the MCP. They
use the credentials and safety policy of the project selected for each run.
See [workflow storage](./configuration#saved-workflows).

### Observability metrics (closed beta) {#metrics}

`metrics_get` reads Commerce metrics. Available in SCAPI; requires tenant access
to the Metrics API closed beta and OAuth scope `sfcc.metrics`.

## Configuration inspection

| Tool             | Capability                                                               | Toolsets    |
| ---------------- | ------------------------------------------------------------------------ | ----------- |
| `config_inspect` | Check resolved configuration and targets; secrets are masked by default. | DIAGNOSTICS |

## Toolsets for customization

| Toolset          | Capabilities                                                 |
| ---------------- | ------------------------------------------------------------ |
| `CARTRIDGES`     | Cartridge deployment and instance diagnostics.               |
| `DIAGNOSTICS`    | Debugging, instance/MRT logs, and configuration inspection.  |
| `MRT`            | Managed Runtime bundle publishing and deployment.            |
| `PWAV3`          | Shared MRT and SCAPI tools for PWA Kit projects.             |
| `SCAPI`          | API development, instance diagnostics, and optional metrics. |
| `STOREFRONTNEXT` | Shared MRT and SCAPI tools for Storefront Next projects.     |

Skills and documentation are included in every toolset. Shared tools appear once.
For parameters, consult the installed tool details in your MCP client.
