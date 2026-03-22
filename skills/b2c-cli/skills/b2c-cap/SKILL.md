---
name: b2c-cap
description: Manage Commerce App Packages (CAPs) using the b2c CLI. Use when validating, packaging, installing, or uninstalling Commerce App Packages on B2C Commerce instances.
---

# B2C CAP Skill

Use the `b2c` CLI plugin to **validate, package, install, and uninstall** Commerce App Packages (CAPs) on Salesforce B2C Commerce instances.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli cap validate`).

## Examples

### Validate a CAP

```bash
# validate a local CAP directory
b2c cap validate ./commerce-avalara-tax-app-v0.2.5

# validate a CAP zip file
b2c cap validate ./commerce-avalara-tax-app-v0.2.5.zip

# validate with JSON output
b2c cap validate ./commerce-avalara-tax-app-v0.2.5 --json
```

### Package a CAP

```bash
# package a CAP directory into a distributable zip
b2c cap package ./commerce-avalara-tax-app-v0.2.5

# package with a custom output path
b2c cap package ./commerce-avalara-tax-app-v0.2.5 --output ./dist/my-app.zip
```

### Install a CAP

```bash
# install a CAP directory on an instance
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch

# install a pre-packaged zip
b2c cap install ./commerce-avalara-tax-app-v0.2.5.zip --site RefArch

# install with a timeout
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch --timeout 600

# skip validation before install
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch --skip-validate

# keep the uploaded archive on the instance
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site RefArch --keep-archive
```

### Uninstall a CAP

```bash
# uninstall a commerce app
b2c cap uninstall avalara-tax --domain tax --site RefArch
```

### More Commands

See `b2c cap --help` for a full list of available commands and options in the `cap` topic.

## Related Skills

- `b2c-cli:b2c-job` - For running general jobs and site archive import/export
- `b2c-cli:b2c-site-import-export` - For site archive structure and metadata XML patterns
