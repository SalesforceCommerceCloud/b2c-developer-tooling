---
name: b2c-job
description: Run and monitor jobs on B2C Commerce instances using the b2c CLI, including site archive import/export and search indexing. Use this skill whenever the user needs to trigger a job, import a site archive, export site data, rebuild search indexes, check job status, or troubleshoot failed job executions — even if they just say "import this folder" or "rebuild the search index".
---

# B2C Job Skill

Use the `b2c` CLI plugin to **run existing jobs** and import/export site archives on Salesforce B2C Commerce instances.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli job run`).

> **Creating a new job?** If you need to write custom job step *code* (batch processing, scheduled tasks, data sync) **or author the `jobs.xml` job definition** that makes a job exist (so it can be run/scheduled), use the `b2c:b2c-custom-job-steps` skill — see its [jobs.xml Reference](../../../b2c/skills/b2c-custom-job-steps/references/JOBS-XML.md). `b2c job run` only executes jobs that already exist on the instance.

## Configuration & Authentication

The CLI auto-discovers the target instance and credentials from `SFCC_*` environment variables, `dw.json` in the current or parent directories, `~/.mobify`, `package.json`, and configuration plugins. **Flags like `--server`, `--client-id`, and `--client-secret` are usually unnecessary** — only pass them to override what's auto-detected.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (use `--json` for scripting, `--unmask` to reveal secrets). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

## Examples

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

Some system jobs (like search indexing) use non-standard request schemas. Use `--body` to provide a raw JSON request body:

```bash
# run search index job for specific sites
b2c job run sfcc-search-index-product-full-update --wait --body '{"site_scope":{"named_sites":["RefArch","SiteGenesis"]}}'

# run search index job for a single site
b2c job run sfcc-search-index-product-full-update --wait --body '{"site_scope":{"named_sites":["RefArch"]}}'
```

Note: `--body` and `-P` are mutually exclusive.

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

### Import Site Archives

The `job import` command waits for the import job to complete by default. The same command imports a **job definition** (`jobs.xml` at the archive root) that registers a new runnable job on the instance — for the `jobs.xml` structure (job/flow/step, step `type`, the required `<triggers>` element), see the [jobs.xml Reference](../../../b2c/skills/b2c-custom-job-steps/references/JOBS-XML.md).

```bash
# import a local directory as a site archive (waits for completion by default)
b2c job import ./my-site-data

# import a local zip file
b2c job import ./export.zip

# import and return immediately without waiting for completion
b2c job import ./my-site-data --no-wait

# keep the archive on the instance after import
b2c job import ./my-site-data --keep-archive

# import an archive that already exists on the instance (in Impex/src/instance/)
b2c job import existing-archive.zip --remote

# show job log on failure
b2c job import ./my-site-data --show-log

# import only a subset of a directory (extra positionals are paths/globs
# resolved against the directory; preserves layout inside the archive)
b2c job import ./my-site-data sites/RefArch libraries/mylib
b2c job import ./my-site-data 'libraries/**'
```

### Export Site Archives

The `job export` command exports data from a B2C Commerce instance as a site archive. You must specify at least one data unit to export.

```bash
# export global metadata
b2c job export --global-data meta_data

# export multiple global data units
b2c job export --global-data meta_data,custom_types,locales

# export a site with all site data
b2c job export --site RefArch

# export a site with specific site data units
b2c job export --site RefArch --site-data content,site_preferences

# export multiple sites
b2c job export --site RefArch --site SiteGenesis --site-data campaigns_and_promotions

# export catalogs
b2c job export --catalog storefront-catalog
b2c job export --catalog storefront-catalog,electronics-catalog

# export libraries
b2c job export --library RefArchSharedLibrary

# export inventory lists
b2c job export --inventory-list my-inventory

# export price books
b2c job export --price-book usd-sale-prices

# combine multiple top-level categories
b2c job export --site RefArch --site-data content --catalog storefront-catalog --global-data meta_data

# full control via raw JSON data units configuration
b2c job export --data-units '{"global_data":{"meta_data":true},"sites":{"RefArch":{"content":true}}}'

# save to a specific output directory
b2c job export --global-data meta_data -o ./my-export

# save as a zip file without extracting
b2c job export --global-data meta_data --zip-only

# leave the archive on the instance without downloading
b2c job export --global-data meta_data --no-download

# keep the archive on the instance after downloading
b2c job export --global-data meta_data --keep-archive

# set a timeout (seconds)
b2c job export --global-data meta_data --timeout 600
```

#### Available Data Units

**Top-level categories** (each takes one or more IDs via flags):

| Flag | Description |
|---|---|
| `--site` | Site IDs to export (use `--site-data` to pick specific units, defaults to all) |
| `--catalog` | Catalog IDs |
| `--library` | Library IDs |
| `--inventory-list` | Inventory list IDs |
| `--price-book` | Price book IDs |
| `--global-data` | Global data units (comma-separated names from the list below) |

**Site data units** (use with `--site-data`):

`ab_tests`, `active_data_feeds`, `all`, `cache_settings`, `campaigns_and_promotions`, `content`, `coupons`, `custom_objects`, `customer_cdn_settings`, `customer_groups`, `distributed_commerce_extensions`, `dynamic_file_resources`, `gift_certificates`, `ocapi_settings`, `payment_methods`, `payment_processors`, `redirect_urls`, `search_settings`, `shipping`, `site_descriptor`, `site_preferences`, `sitemap_settings`, `slots`, `sorting_rules`, `source_codes`, `static_dynamic_alias_mappings`, `stores`, `tax`, `url_rules`

**Global data units** (use with `--global-data`):

`access_roles`, `all`, `csc_settings`, `csrf_whitelists`, `custom_preference_groups`, `custom_quota_settings`, `custom_types`, `geolocations`, `global_custom_objects`, `job_schedules`, `job_schedules_deprecated`, `locales`, `meta_data`, `oauth_providers`, `ocapi_settings`, `page_meta_tags`, `preferences`, `price_adjustment_limits`, `services`, `sorting_rules`, `static_resources`, `system_type_definitions`, `users`, `webdav_client_permissions`

For full control over the export configuration (including `catalog_static_resources`, `library_static_resources`, and `customer_lists`), use `--data-units` with a JSON string matching the `ExportDataUnitsConfiguration` shape.

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

### Wait for Job Completion

```bash
# wait for a specific job execution to complete (requires both job ID and execution ID)
b2c job wait <job-id> <execution-id>

# wait with a timeout
b2c job wait <job-id> <execution-id> --timeout 600

# wait with a custom polling interval
b2c job wait <job-id> <execution-id> --poll-interval 5
```

## Related Skills

- `b2c:b2c-custom-job-steps` - For **creating** new custom job steps and **chaining them with standard steps** (includes the standard step catalog, IMPEX hand-off, and in-flow-vs-CLI guidance)
- `b2c-cli:b2c-docs` - To look up standard job step type IDs and their parameters (`b2c docs read job-steps`)
- `b2c-cli:b2c-site-import-export` - For site archive structure and metadata XML patterns
