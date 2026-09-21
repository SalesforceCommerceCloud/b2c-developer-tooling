# Export Site Archives

## Compact Results

Normal CLI output reports completion and the saved path. When scripting, save
the full JSON and stderr to files; print only verification fields. For example:

```bash
b2c job export --site MySite --site-data campaigns_and_promotions \
  --output ./verification --json > export-result.json 2> export-stderr.log
archive_status=$?
if [ "$archive_status" -eq 0 ]; then
  jq '{localPath, archiveFilename, execution: (.execution | {id, execution_status, exit_status})}' export-result.json
else
  jq '{name, message, code}' export-result.json
  tail -n 40 export-stderr.log
  exit "$archive_status"
fi
```

Keep full artifacts for investigation; do not print them alongside the projection.
After an import/export failure, inspect job status/logs before retrying. For an
import, the same approach reports execution status without `localPath`.

## Export Commands

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

#### Output Directory Semantics

When `--output` names a directory, the CLI extracts the downloaded platform zip as-is. Platform exports contain a generated top-level directory such as `<timestamp>_export`, so `--output migrations` creates `migrations/<generated>_export/...`; it does not merge data units directly into `migrations/`. If `--output` ends in `.zip`, the CLI writes that exact zip path instead.

For an ordered import-set migration, export to the import-set directory, rename the one newly generated archive root once to its permanent ordered name, and then review and trim it in place:

```bash
b2c job export --site RefArch --site-data site_descriptor --output migrations
mv migrations/<GENERATED_EXPORT_DIR> migrations/20260815T120000-update-site-descriptor
b2c job import-set --dry-run
```

Do not require a temporary directory and copy step for export-based migrations. Never export over an existing or applied archive. See `b2c-cli:b2c-import-set-migrations` for naming, trimming, retry, and deployment rules, and `b2c-cli:b2c-site-import-export` for valid archive structure.

#### Available Data Units

**Top-level categories** (each takes one or more IDs via flags):

| Flag               | Description                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| `--site`           | Site IDs to export (use `--site-data` to pick specific units, defaults to all) |
| `--catalog`        | Catalog IDs                                                                    |
| `--library`        | Library IDs                                                                    |
| `--inventory-list` | Inventory list IDs                                                             |
| `--price-book`     | Price book IDs                                                                 |
| `--global-data`    | Global data units (comma-separated names from the list below)                  |

**Site data units** (use with `--site-data`):

`ab_tests`, `active_data_feeds`, `all`, `cache_settings`, `campaigns_and_promotions`, `content`, `coupons`, `custom_objects`, `customer_cdn_settings`, `customer_groups`, `distributed_commerce_extensions`, `dynamic_file_resources`, `gift_certificates`, `ocapi_settings`, `payment_methods`, `payment_processors`, `redirect_urls`, `search_settings`, `shipping`, `site_descriptor`, `site_preferences`, `sitemap_settings`, `slots`, `sorting_rules`, `source_codes`, `static_dynamic_alias_mappings`, `stores`, `tax`, `url_rules`

**Global data units** (use with `--global-data`):

`access_roles`, `all`, `csc_settings`, `csrf_whitelists`, `custom_preference_groups`, `custom_quota_settings`, `custom_types`, `geolocations`, `global_custom_objects`, `job_schedules`, `job_schedules_deprecated`, `locales`, `meta_data`, `oauth_providers`, `ocapi_settings`, `page_meta_tags`, `preferences`, `price_adjustment_limits`, `services`, `sorting_rules`, `static_resources`, `system_type_definitions`, `users`, `webdav_client_permissions`

For full control over the export configuration (including `catalog_static_resources`, `library_static_resources`, and `customer_lists`), use `--data-units` with a JSON string matching the `ExportDataUnitsConfiguration` shape.
