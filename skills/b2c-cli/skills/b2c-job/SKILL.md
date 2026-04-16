---
name: b2c-job
description: Run and monitor jobs on B2C Commerce instances using the b2c CLI, including site archive import/export and search indexing. Use this skill whenever the user needs to trigger a job, import a site archive, export site data, rebuild search indexes, check job status, or troubleshoot failed job executions — even if they just say "import this folder" or "rebuild the search index".
---

# B2C Job Skill

Use the `b2c` CLI plugin to **run existing jobs** and import/export site archives on Salesforce B2C Commerce instances.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli job run`).

> **Creating a new job?** If you need to write custom job step code (batch processing, scheduled tasks, data sync), use the `b2c:b2c-custom-job-steps` skill instead.

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

### Import Site Archives

The `job import` command waits for the import job to complete by default.

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

- `b2c:b2c-custom-job-steps` - For **creating** new custom job steps (batch processing scripts, scheduled tasks, data sync jobs)
- `b2c-cli:b2c-site-import-export` - For site archive structure and metadata XML patterns
