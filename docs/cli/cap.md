---
description: Commands for validating, packaging, installing, uninstalling, and listing Commerce App Packages (CAPs) and commerce features.
---

# Commerce App (CAP) Commands

Commands for managing Commerce App Packages (CAPs) — the standard format for distributing B2C Commerce integrations — and listing commerce features installed on an instance.

## Overview

A Commerce App Package bundles cartridges, IMPEX data, and Storefront Next extensions into a single installable unit. See the [Commerce Apps guide](/guide/commerce-apps) for full workflow details.

The `cap list` and `cap tasks` commands work with the broader commerce feature state system, which tracks all installed features including ISV apps, native apps, native features, and custom features.

## Authentication

Install, uninstall, list, and tasks commands require OAuth authentication with OCAPI permissions and WebDAV access.

### Required OCAPI Permissions

Configure these resources in Business Manager under **Administration** > **Site Development** > **Open Commerce API Settings**:

| Resource | Methods | Commands |
|----------|---------|----------|
| `/jobs/*/executions` | POST | `cap install`, `cap uninstall`, `cap list`, `cap tasks` |
| `/jobs/*/executions/*` | GET | `cap install`, `cap uninstall`, `cap list`, `cap tasks` |
| `/sites` | GET | `cap list` (when no `--site-id` specified) |

### WebDAV Access

The `cap install` command uploads the CAP zip to WebDAV (`Impex/commerce-apps/`) before triggering the install job. The `cap list`, `cap tasks`, and `cap uninstall` commands download site archive exports via WebDAV.

---

## b2c cap validate

Validate the structure and manifest of a Commerce App Package (CAP).

### Usage

```bash
b2c cap validate PATH
```

### Arguments

| Argument | Description |
|----------|-------------|
| `PATH` | Path to a CAP directory or `.zip` file |

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output result as JSON |

### Validation Checks

**Errors** (blocking — must fix before install):

- `commerce-app.json` must exist and be valid JSON
- Manifest must include `id`, `name`, `version`, `domain` fields
- `version` must be a valid semver string
- `app-configuration/tasksList.json` must exist as a valid JSON array
- Each task must have `taskNumber`, `name`, `description`, `link`
- At least one of `cartridges/`, `storefront-next/`, or `impex/` must be present
- No `pipeline/` directories in cartridges
- No `*.ds` pipeline descriptor files
- Site cartridges (`cartridges/site_cartridges/`) must not contain `controllers/`
- `README.md` must exist

**Warnings** (advisory):

- `icons/icon.png` is recommended for marketplace listing
- `impex/uninstall/` is recommended for clean removal

### Examples

```bash
# Validate a local CAP directory
b2c cap validate ./commerce-avalara-tax-app-v0.2.5

# Validate a zipped CAP
b2c cap validate ./commerce-avalara-tax-app-v0.2.5.zip

# Machine-readable output
b2c cap validate ./commerce-avalara-tax-app-v0.2.5 --json
```

---

## b2c cap package

Package a Commerce App directory into a distributable `.zip` file.

### Usage

```bash
b2c cap package PATH [--output PATH]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `PATH` | Path to the CAP source directory |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--output PATH` | `-o` | Output path (directory or `.zip` filename). Defaults to current directory. |
| `--json` | | Output result as JSON |

### Examples

```bash
# Package to current directory
b2c cap package ./commerce-avalara-tax-app-v0.2.5

# Package to a specific output directory
b2c cap package ./commerce-avalara-tax-app-v0.2.5 --output ./dist

# Package with explicit zip filename
b2c cap package ./commerce-avalara-tax-app-v0.2.5 --output ./dist/my-app.zip
```

---

## b2c cap install

Install a Commerce App Package on a B2C Commerce instance.

### Usage

```bash
b2c cap install PATH --site-id SITE_ID
```

### Arguments

| Argument | Description |
|----------|-------------|
| `PATH` | Path to a CAP directory or `.zip` file |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id SITE_ID` | `-s` | **Required.** Site ID to install the app on |
| `--clean-archive` | | Delete the uploaded zip from the instance after install |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--skip-validate` | | Skip CAP structure validation before install |
| `--json` | | Output result as JSON |

### Install Process

1. Validates the CAP structure (unless `--skip-validate`)
2. Packages the directory into a zip if a directory is provided
3. Uploads the zip to WebDAV at `Impex/commerce-apps/{id}-v{version}.zip`
4. Executes the `sfcc-install-commerce-app` system job
5. Waits for job completion
6. Archive is kept on the instance by default (use `--clean-archive` to remove)

### Examples

```bash
# Install from a local directory
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch

# Install from a zip
b2c cap install ./commerce-avalara-tax-app-v0.2.5.zip --site-id RefArch

# Install without running validation first
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch --skip-validate

# Remove the uploaded archive after install
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch --clean-archive
```

---

## b2c cap uninstall

Uninstall a Commerce App from a B2C Commerce instance. Looks up the app's domain automatically from the commerce feature state.

### Usage

```bash
b2c cap uninstall APP_NAME --site-id SITE_ID
```

### Arguments

| Argument | Description |
|----------|-------------|
| `APP_NAME` | App ID to uninstall (from `commerce-app.json` `"id"` field, e.g. `avalara-tax`) |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id SITE_ID` | `-s` | **Required.** Site ID to uninstall the app from |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--json` | | Output result as JSON |

### Examples

```bash
# Uninstall Avalara Tax from a site
b2c cap uninstall avalara-tax --site-id RefArch
```

---

## b2c cap list

List commerce features installed on a B2C Commerce instance. Exports the `commerce_feature_states` data unit from each site and parses the results.

### Usage

```bash
b2c cap list [--site-id SITE_IDS]
```

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id SITE_IDS` | `-s` | Site IDs to query (comma-separated). If omitted, queries all sites. |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--local` | `-l` | List locally detected Commerce App Packages (no instance required) |
| `--json` | | Output result as JSON |

### Table Columns

| Column | Description |
|--------|-------------|
| Site ID | Site the feature is installed on (includes `Sites-` prefix) |
| Name | Feature name (e.g. `avalara-tax`) |
| Type | `ISV_APP`, `NATIVE_APP`, `NATIVE_FEATURE`, or `CUSTOM_FEATURE` |
| Source | `CUSTOM` (uploaded via WebDAV) or `REGISTRY` (from App Registry) |
| Install Status | e.g. `INSTALLED` |
| Config Status | e.g. `NOT_CONFIGURED`, `CONFIGURED` |
| Version | Feature version if available |
| Installed At | Installation timestamp |

### JSON Output

With `--json`, returns the full feature state including `configTasks` (parsed JSON array of configuration steps) and `installationMetadata` (parsed JSON with job details, cartridge mappings, and IMPEX uninstall data).

### Examples

```bash
# List all installed features across all sites
b2c cap list

# List features for specific sites
b2c cap list --site-id RefArch,SiteGenesis

# Machine-readable output with full details
b2c cap list --json

# List locally detected CAP directories
b2c cap list --local
```

---

## b2c cap tasks

List configuration tasks for an installed Commerce App, with clickable links to Business Manager pages.

### Usage

```bash
b2c cap tasks APP_NAME --site-id SITE_ID
```

### Arguments

| Argument | Description |
|----------|-------------|
| `APP_NAME` | Commerce App feature name (e.g. `avalara-tax`) |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id SITE_ID` | `-s` | **Required.** Site ID to query |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--json` | | Output result as JSON |

### Examples

```bash
# Show configuration tasks for an installed app
b2c cap tasks avalara-tax --site-id RefArch

# Get tasks as JSON (includes full feature state)
b2c cap tasks avalara-tax --site-id RefArch --json
```

---

## b2c cap pull

Pull installed Commerce App source packages from a B2C Commerce instance. By default, pulls all registry-sourced apps. Optionally specify a single app by name.

Useful for deploying cartridges to a code version or working with Storefront Next extensions locally.

### Usage

```bash
b2c cap pull [APP_NAME] [--site-id SITE_ID] [--output DIR]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `APP_NAME` | *(optional)* Commerce App feature name to pull (e.g. `avalara-tax`). If omitted, pulls all registry apps. |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id SITE_ID` | `-s` | Site ID to query for installed apps. If omitted, queries all sites. |
| `--output DIR` | `-o` | Output directory (default: `./commerce-apps`) |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--json` | | Output result as JSON |

### Examples

```bash
# Pull all registry apps to ./commerce-apps
b2c cap pull

# Pull a specific app by name
b2c cap pull avalara-tax

# Pull to a custom output directory
b2c cap pull --output ./my-apps

# Pull apps installed on a specific site
b2c cap pull --site-id RefArch
```
