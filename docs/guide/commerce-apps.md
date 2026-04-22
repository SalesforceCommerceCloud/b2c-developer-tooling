---
description: How to validate, package, install, and uninstall Commerce App Packages (CAPs) with the B2C CLI and VS Code extension.
---

# Commerce Apps (CAPs)

Commerce App Packages (CAPs) are the standard format for distributing B2C Commerce integrations. A CAP bundles cartridges, IMPEX configuration data, and Storefront Next UI extensions into a single installable unit.

## What Is a Commerce App Package?

A CAP can contain any combination of:

- **Back-end cartridges** — site cartridges implementing extension points (e.g., `sf.commerce.app.tax.calculate`) and BM cartridges for admin UI
- **IMPEX data** — services, site preferences, custom object definitions, and uninstall cleanup scripts
- **Storefront Next extensions** — React components injected into the storefront via UI targets
- **App configuration** — `tasksList.json` defining the post-install setup wizard in Business Manager

## CAP Directory Structure

```
commerce-{app}-v{version}/
├── commerce-app.json          # Required: app manifest (id, name, version, domain)
├── README.md                  # Required: documentation
├── app-configuration/
│   └── tasksList.json         # Required: post-install configuration wizard
├── cartridges/
│   ├── bm_cartridges/         # Business Manager cartridges (may have controllers/)
│   └── site_cartridges/       # Site cartridges (no controllers/, no pipelines)
├── icons/
│   └── icon.png               # Recommended: marketplace icon
├── impex/
│   ├── install/               # Data imported on install
│   └── uninstall/             # Recommended: cleanup data for removal
└── storefront-next/
    └── src/extensions/        # React components and target-config.json
```

## Development Workflow

### 1. Build and Organize Your CAP

Structure your project following the CAP layout above. The `commerce-app.json` manifest is required:

```json
{
  "id": "my-integration",
  "name": "My Integration",
  "version": "1.0.0",
  "domain": "tax",
  "description": "Automated tax compliance",
  "publisher": {
    "name": "My Company",
    "url": "https://example.com"
  }
}
```

### 2. Validate

Run validation before packaging or installing to catch structural issues early:

```bash
b2c cap validate ./commerce-my-integration-v1.0.0
```

Validation checks include:
- Required files (`commerce-app.json`, `README.md`, `tasksList.json`)
- Valid manifest schema and semver version
- No pipelines or `.ds` files (not supported in CAPs)
- Site cartridges must not have `controllers/` (use extension points instead)

### 3. Package (Optional)

Create a distributable zip for CI/CD pipelines or registry submission:

```bash
b2c cap package ./commerce-my-integration-v1.0.0 --output ./dist
```

This creates `dist/my-integration-v1.0.0.zip` with the correct root directory structure.

### 4. Install on a Sandbox

Install the CAP on a sandbox instance for testing. Provide the local directory or zip:

```bash
# From a directory
b2c cap install ./commerce-my-integration-v1.0.0 --site RefArch

# From a zip
b2c cap install ./dist/my-integration-v1.0.0.zip --site RefArch
```

The CLI uploads the package to WebDAV (`Temp/`) and triggers the `sfcc-install-commerce-app` platform job, which deploys cartridges, imports IMPEX data, and creates a Storefront Next PR (if applicable).

### 5. Complete Configuration Tasks

After install, complete the setup wizard tasks in Business Manager or via CLI. Installed apps transition through:

`INSTALLING` → `INSTALLED` → `CONFIGURING` → `ACTIVE`

### 6. Uninstall

To remove an installed app:

```bash
b2c cap uninstall my-integration --domain tax --site RefArch
```

## VS Code Extension Integration

The B2C DX VS Code extension provides Commerce App support directly in the file explorer.

### CAP Directory Detection

Any directory containing a `commerce-app.json` file is automatically decorated with a **CA** badge in the VS Code explorer, making CAP directories easy to identify.

### Install from the Explorer

Right-click any CAP directory in the VS Code explorer and choose **B2C-DX → Install Commerce App (CAP)**. You will be prompted for the target site ID.

## Authentication Requirements

Install and uninstall commands require:

- **OAuth credentials** (`SFCC_CLIENT_ID`, `SFCC_CLIENT_SECRET`) — for running the system job
- **WebDAV credentials** (`SFCC_USERNAME`, `SFCC_PASSWORD`) — for uploading the CAP zip

```bash
export SFCC_HOSTNAME=my-instance.commercecloud.salesforce.com
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

See the [Authentication Guide](/guide/authentication) for complete setup instructions.

## CI/CD Integration

A typical CI/CD pipeline for Commerce App deployment:

```yaml
- name: Validate CAP
  run: b2c cap validate ./commerce-my-integration-v${{ env.VERSION }}

- name: Package CAP
  run: b2c cap package ./commerce-my-integration-v${{ env.VERSION }} --output ./dist

- name: Install CAP
  run: b2c cap install ./dist/my-integration-v${{ env.VERSION }}.zip --site ${{ env.SITE_ID }}
  env:
    SFCC_HOSTNAME: ${{ secrets.SFCC_HOSTNAME }}
    SFCC_CLIENT_ID: ${{ secrets.SFCC_CLIENT_ID }}
    SFCC_CLIENT_SECRET: ${{ secrets.SFCC_CLIENT_SECRET }}
    SFCC_USERNAME: ${{ secrets.SFCC_USERNAME }}
    SFCC_PASSWORD: ${{ secrets.SFCC_PASSWORD }}
```

## Reference

- [CAP CLI Commands](/cli/cap) — full command reference
- [ISV Developer Guide](https://developer.salesforce.com) — CAP structure specification and domain extension points
