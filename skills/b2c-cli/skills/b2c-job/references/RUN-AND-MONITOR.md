# Run and Monitor Jobs

### Run a Job

```bash
# run a job and return immediately
b2c job run my-custom-job

# run a job and wait for completion
b2c job run my-custom-job --wait

# run a job with a timeout (in seconds)
b2c job run my-custom-job --wait --timeout 600

# run a job with parameters (standard jobs)
b2c job run my-custom-job -P "SiteScope={\"all_storefront_sites\":true}" -P OtherParam=value

# show job log if the job fails
b2c job run my-custom-job --wait --show-log
```

### Run System Jobs with Custom Request Bodies

System jobs (`sfcc-*`) do **not** take the generic `parameters` array, so `-P` fails
for them (`unknown property 'parameters'`). Send the job's own document with `--body`
(`--body` and `-P` are mutually exclusive). The body is the same JSON on SCAPI and
OCAPI; field names are snake_case and `site_scope` is a plain array of site IDs.

```bash
# rebuild the product search index for one site
b2c job run sfcc-search-index-product-full-update --wait --body '{"site_scope":["RefArch"]}'

# several sites
b2c job run sfcc-search-index-product-full-update --wait --body '{"site_scope":["RefArch","SiteGenesis"]}'
```

| System job ID                                      | Body                                    |
| -------------------------------------------------- | --------------------------------------- |
| `sfcc-search-index-product-full-update`            | `{"site_scope":["SiteId"]}`             |
| `sfcc-search-index-product-incremental-update`     | `{"site_scope":["SiteId"]}`             |
| `sfcc-search-index-content-full-update`            | `{"site_scope":["SiteId"]}`             |
| `sfcc-search-index-content-incremental-update`     | `{"site_scope":["SiteId"]}`             |
| `sfcc-search-index-active-data-full-update`        | `{"site_scope":["SiteId"]}`             |
| `sfcc-search-index-active-data-incremental-update` | `{"site_scope":["SiteId"]}`             |
| `sfcc-site-archive-import` / `-export`             | use `b2c job import` / `b2c job export` |

Common mistakes (all wrong): `{"site_scope":{"named_sites":[...]}}` (object, rejected as
"expected START*ARRAY"), `siteScope`/camelCase, and `-P SiteScope=...`. The
`SiteScope={"named_sites":[...]}` value is a \_parameter* of custom/standard-step jobs
run with `-P`, not a system-job body. Source: OCAPI `SearchIndexUpdateConfiguration`
(`b2c docs read ocapi/searchindexupdateconfiguration`).

A `JobAlreadyRunningException` (400) means another index job of that kind is active for
a different site scope; wait for it rather than retrying.

A SCAPI 400 (for example a decode error naming the bad property) is a request error and is
reported as-is; `auto` does not retry it over OCAPI. Fallback happens only for
auth/capability rejections (invalid scope, 401/403/404/405/406/415); if OCAPI then also
fails, the error shows both, with "The SCAPI attempt was rejected first: ...". An OCAPI
"isn't allowed for the current client" means the client has no OCAPI job permission.

From MCP code mode, the same job is a SCAPI `createJobExecution` call; see
`skill://mcp/b2c-mcp-scapi/references/jobs.md` (section "Start a job").

### Standard (System) Job Steps

B2C Commerce ships a catalog of **standard job steps** — built-in step **type IDs** (for example `ImportCatalog`, `ExportCatalog`, `ImportInventoryLists`) that are added to job flows in **Business Manager → Administration → Operations → Jobs**, or referenced by type ID in a `jobs.xml` flow inside a site-import archive. They are the building blocks of the multi-step jobs you run with `b2c job run`.

Look up the catalog and any step's configuration parameters via the `b2c-cli:b2c-docs` skill — these docs are bundled with the CLI, so no instance connection is needed:

```bash
# Browse the standard step catalog
b2c docs read job-steps

# Look up a specific step's purpose + parameters
b2c docs read ImportCatalog
b2c docs search "export inventory"
```

**In-flow standard step vs. CLI command.** Some standard steps overlap with CLI commands — for instance, the standard catalog/site import steps vs. `b2c job import` (which itself runs the `sfcc-site-archive-import` system job). Use an **in-flow standard step** when the file is already staged on the instance or produced by an earlier step in the same flow (no round-trip, runs on a BM schedule). Use the **CLI** when moving data between your machine and the instance (uploading a local archive, downloading an export, or scripting from CI). For chaining custom + standard steps and IMPEX file hand-off, see the `b2c:b2c-custom-job-steps` skill.

### View Job Logs

```bash
# get the log from the most recent execution of a job
b2c job log my-custom-job

# get the log from the most recent failed execution
b2c job log my-custom-job --failed

# get the log from a specific execution
b2c job log my-custom-job abc123-def456
```

### Search Job Executions

```bash
# search for recent job executions
b2c job search

# filter by job ID
b2c job search --job-id my-custom-job

# filter by status
b2c job search --status ERROR
b2c job search --status RUNNING,PENDING

# control result count and pagination
b2c job search --count 50 --start 0

# sort results
b2c job search --sort-by start_time --sort-order desc

# search with JSON output
b2c job search --json
```

### Delete Job Executions

```bash
# delete a job execution record (requires SCAPI)
b2c job execution delete my-job abc123-def456
```

### API Backend

Job commands run over SCAPI. Configure `shortCode`, `tenantId`, and the SCAPI scopes and `job run`, `job search`, `job wait`, and `job log` work out of the box.

**SCAPI scopes**: `sfcc.jobs.rw` (recommended) for full access, or `sfcc.jobs` for read-only (search, wait, log).

OCAPI is deprecated and disabled on newer instances. `--api-backend auto` (the default) falls back to the OCAPI Data API on safe SCAPI capability/auth/request rejections; force a backend with `--api-backend scapi|ocapi`, dw.json `"api-backend": "scapi"`, or `SFCC_API_BACKEND=scapi`.

SCAPI `DELETE` removes a completed execution record; it does not cancel a running job. The CLI does not expose job cancellation because the underlying job APIs do not provide that operation.

> **Note:** `job import` and `job export` trigger the site-archive system jobs and transfer archive files over WebDAV. The job trigger honors `--api-backend`: in `auto` mode it runs over SCAPI (needs `sfcc.jobs.rw`) with OCAPI fallback if the SCAPI start is rejected. The archive transfer always uses WebDAV.

### Wait for Job Completion

```bash
# wait for a specific job execution to complete (requires both job ID and execution ID)
b2c job wait <job-id> <execution-id>

# wait with a timeout
b2c job wait <job-id> <execution-id> --timeout 600

# wait with a custom polling interval
b2c job wait <job-id> <execution-id> --poll-interval 5
```
