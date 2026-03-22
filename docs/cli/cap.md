---
description: Commands for validating, packaging, installing, and uninstalling Commerce App Packages (CAPs).
---

# Commerce App (CAP) Commands

Commands for managing Commerce App Packages (CAPs) — the standard format for distributing B2C Commerce integrations.

## Overview

A Commerce App Package bundles cartridges, IMPEX data, and Storefront Next extensions into a single installable unit. See the [Commerce Apps guide](/guide/commerce-apps) for full workflow details.

## Authentication

Install and uninstall commands require OAuth authentication with OCAPI permissions and WebDAV access.

### Required OCAPI Permissions

Configure these resources in Business Manager under **Administration** > **Site Development** > **Open Commerce API Settings**:

| Resource | Methods | Commands |
|----------|---------|----------|
| `/jobs/*/executions` | POST | `cap install`, `cap uninstall` |
| `/jobs/*/executions/*` | GET | `cap install`, `cap uninstall` |

### WebDAV Access

The `cap install` command uploads the CAP zip to WebDAV (`Temp/`) before triggering the install job.

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
b2c cap package ./commerce-avalara-tax-app-v0.2.5 --output ./dist/my-tax-app.zip
```

---

## b2c cap install

Install a Commerce App Package on a B2C Commerce instance.

### Usage

```bash
b2c cap install PATH --site SITE_ID
```

### Arguments

| Argument | Description |
|----------|-------------|
| `PATH` | Path to a CAP directory or `.zip` file |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site SITE_ID` | `-s` | **Required.** Site ID to install the app on |
| `--keep-archive` | `-k` | Keep the uploaded zip on the instance after install |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--skip-validate` | | Skip CAP structure validation before install |
| `--json` | | Output result as JSON |

### Install Process

1. Validates the CAP structure (unless `--skip-validate`)
2. Packages the directory into a zip if a directory is provided
3. Uploads the zip to WebDAV at `Temp/{id}-v{version}.zip`
4. Executes the `sfcc-install-commerce-app` system job
5. Waits for job completion
6. Removes the uploaded zip (unless `--keep-archive`)

### Examples

```bash
# Install from a local directory
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch

# Install from a zip
b2c cap install ./commerce-avalara-tax-app-v0.2.5.zip --site RefArch

# Install without running validation first
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch --skip-validate

# Keep the uploaded archive for debugging
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch --keep-archive
```

---

## b2c cap uninstall

Uninstall a Commerce App from a B2C Commerce instance.

### Usage

```bash
b2c cap uninstall APP_NAME --domain DOMAIN --site SITE_ID
```

### Arguments

| Argument | Description |
|----------|-------------|
| `APP_NAME` | App ID to uninstall (from `commerce-app.json` `"id"` field, e.g. `avalara-tax`) |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--domain DOMAIN` | `-d` | **Required.** Commerce app domain (e.g. `tax`, `shipping`, `fraud`) |
| `--site SITE_ID` | `-s` | **Required.** Site ID to uninstall the app from |
| `--timeout SECONDS` | `-t` | Timeout in seconds (default: no timeout) |
| `--json` | | Output result as JSON |

### Examples

```bash
# Uninstall Avalara Tax from a site
b2c cap uninstall avalara-tax --domain tax --site RefArch
```

---

## b2c cap list

> **Not yet implemented.** Listing installed Commerce Apps will be available in a future release.
