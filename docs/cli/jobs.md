# Job Commands

Commands for executing and monitoring jobs on B2C Commerce instances.

## b2c job run

Execute a job on a B2C Commerce instance.

### Usage

```bash
b2c job run JOBID
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `JOBID` | Job ID to execute | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--wait` | `-w` | Wait for job to complete | `false` |
| `--timeout` | `-t` | Timeout in seconds when waiting | No timeout |
| `--param` | `-P` | Job parameter in format "name=value" (repeatable) | |
| `--no-wait-running` | | Do not wait for running job to finish before starting | `false` |
| `--show-log` | | Show job log on failure | `true` |

### Examples

```bash
# Execute a job
b2c job run my-custom-job

# Execute and wait for completion
b2c job run my-custom-job --wait

# Execute with timeout
b2c job run my-custom-job --wait --timeout 600

# Execute with parameters
b2c job run my-custom-job -P "SiteScope={\"all_storefront_sites\":true}" -P OtherParam=value

# Output as JSON
b2c job run my-custom-job --wait --json
```

### Authentication

This command requires OAuth authentication with OCAPI permissions for the `/jobs` resource.

---

## b2c job wait

Wait for a job execution to complete.

### Usage

```bash
b2c job wait JOBID EXECUTIONID
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `JOBID` | Job ID | Yes |
| `EXECUTIONID` | Execution ID to wait for | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--timeout` | `-t` | Timeout in seconds | No timeout |
| `--poll-interval` | | Polling interval in seconds | `3` |
| `--show-log` | | Show job log on failure | `true` |

### Examples

```bash
# Wait for a job execution
b2c job wait my-job abc123-def456

# Wait with timeout
b2c job wait my-job abc123-def456 --timeout 600

# Wait with custom polling interval
b2c job wait my-job abc123-def456 --poll-interval 5
```

### Authentication

This command requires OAuth authentication with OCAPI permissions for the `/jobs` resource.

---

## b2c job search

Search for job executions on a B2C Commerce instance.

### Usage

```bash
b2c job search
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--job-id` | `-j` | Filter by job ID | |
| `--status` | | Filter by status (comma-separated: RUNNING,PENDING,OK,ERROR) | |
| `--count` | `-n` | Maximum number of results | `25` |
| `--start` | | Starting index for pagination | `0` |
| `--sort-by` | | Sort by field (start_time, end_time, job_id, status) | `start_time` |
| `--sort-order` | | Sort order (asc, desc) | `desc` |

### Examples

```bash
# Search all recent job executions
b2c job search

# Search for a specific job
b2c job search --job-id my-custom-job

# Search for running or pending jobs
b2c job search --status RUNNING,PENDING

# Get more results
b2c job search --count 50

# Output as JSON
b2c job search --json
```

### Output

The command displays a table of job executions with:

- Execution ID
- Job ID
- Status
- Start Time

### Authentication

This command requires OAuth authentication with OCAPI permissions for the `/job_execution_search` resource.

---

## b2c job import

Import a site archive to a B2C Commerce instance using the `sfcc-site-archive-import` system job.

### Usage

```bash
b2c job import TARGET
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `TARGET` | Directory, zip file, or remote filename to import | Yes |

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--keep-archive` | `-k` | Keep archive on instance after import | `false` |
| `--remote` | `-r` | Target is a filename already on the instance (in Impex/src/instance/) | `false` |
| `--timeout` | `-t` | Timeout in seconds | No timeout |
| `--show-log` | | Show job log on failure | `true` |

### Examples

```bash
# Import from a local directory (will be zipped automatically)
b2c job import ./my-site-data

# Import from a zip file
b2c job import ./export.zip

# Keep archive on instance after import
b2c job import ./my-site-data --keep-archive

# Import from existing file on instance
b2c job import existing-archive.zip --remote

# With timeout
b2c job import ./my-site-data --timeout 300
```

### Notes

- When importing a directory, it will be automatically zipped before upload
- The archive is uploaded to `Impex/src/instance/` on the instance
- By default, the archive is deleted after successful import (use `--keep-archive` to retain)

### Authentication

This command requires OAuth authentication with OCAPI permissions for the `/jobs` resource and WebDAV access for file upload.

---

## b2c job export

Export a site archive from a B2C Commerce instance using the `sfcc-site-archive-export` system job.

### Usage

```bash
b2c job export
```

### Flags

In addition to [global flags](./index#global-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--output` | `-o` | Output path for the export | `.` (current directory) |
| `--data-units` | | Data units JSON configuration | |
| `--site` | | Site ID(s) to export (comma-separated, repeatable) | |
| `--site-data` | | Site data types to export (comma-separated) | |
| `--global-data` | | Global data types to export (comma-separated) | |
| `--catalog` | | Catalog ID(s) to export (comma-separated) | |
| `--pricebook` | | Pricebook ID(s) to export (comma-separated) | |
| `--library` | | Library ID(s) to export (comma-separated) | |
| `--inventory` | | Inventory list ID(s) to export (comma-separated) | |
| `--keep-archive` | `-k` | Keep archive on instance after download | `false` |
| `--no-download` | | Do not download archive (implies --keep-archive) | `false` |
| `--zip-only` | | Save as zip file without extracting | `false` |
| `--timeout` | `-t` | Timeout in seconds | No timeout |
| `--show-log` | | Show job log on failure | `true` |

### Examples

```bash
# Export global metadata
b2c job export --global-data meta_data

# Export a site's content and preferences
b2c job export --site RefArch --site-data content,site_preferences

# Export catalogs
b2c job export --catalog storefront-catalog

# Export with custom data units JSON
b2c job export --data-units '{"global_data":{"meta_data":true}}'

# Export to a specific directory
b2c job export --output ./exports

# Keep archive on instance
b2c job export --global-data meta_data --keep-archive

# Output as JSON
b2c job export --global-data meta_data --json
```

### Data Units

The export is configured using "data units" which specify what data to export. You can use convenience flags (`--site`, `--global-data`, etc.) or provide a full JSON configuration with `--data-units`.

#### Site Data Types

When using `--site-data`, available types include:
- `all` - Export all site data
- `content` - Content assets and slots
- `site_preferences` - Site preferences
- `campaigns_and_promotions` - Marketing campaigns
- `customer_groups` - Customer groups
- `payment_methods` - Payment configurations
- And more (see OCAPI documentation)

#### Global Data Types

When using `--global-data`, available types include:
- `all` - Export all global data
- `meta_data` - System and custom object metadata
- `custom_types` - Custom object type definitions
- `preferences` - Global preferences
- `locales` - Locale configurations
- `services` - Service configurations
- And more (see OCAPI documentation)

### Authentication

This command requires OAuth authentication with OCAPI permissions for the `/jobs` resource and WebDAV access for file download.
