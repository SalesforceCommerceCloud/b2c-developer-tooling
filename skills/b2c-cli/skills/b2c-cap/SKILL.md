---
name: b2c-cap
description: Manage Commerce App Packages (CAPs), also called commerce apps or apps, and commerce features using the b2c CLI. Use this skill whenever the user needs to validate, package, install, uninstall, list, or pull commerce apps on B2C Commerce instances, view configuration tasks, or pull app sources for cartridge deployment or Storefront Next development. Also use when checking which apps are installed on an instance, inspecting app details or versions, or managing app lifecycle — even if they just say "what apps do I have", "list my commerce apps", "which CAPs are installed", "install this app", "pull app sources", or "show installed apps".
---

# B2C CAP Skill

Use the `b2c` CLI plugin to **validate, package, install, uninstall, list, and pull** Commerce App Packages (CAPs) and commerce features on Salesforce B2C Commerce instances.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli cap list`).

## Examples

### List Installed Features

```bash
# list all commerce features across all sites
b2c cap list

# list features for specific sites
b2c cap list --site-id RefArch,SiteGenesis

# list with full JSON output (includes config tasks and installation metadata)
b2c cap list --json

# list locally detected CAP directories
b2c cap list --local
```

### Pull App Sources

Pull installed Commerce App source packages for cartridge deployment or Storefront Next (`sfnext`) development. Pulled apps are extracted into `./commerce-apps/{name}/` and contain cartridges, IMPEX data, and `storefront-next/` extensions ready for use with the `sfnext` CLI.

```bash
# pull all registry apps to ./commerce-apps
b2c cap pull

# pull a specific app by name
b2c cap pull avalara-tax

# pull to a custom output directory
b2c cap pull --output ./my-apps

# pull apps installed on a specific site
b2c cap pull --site-id RefArch
```

### View Configuration Tasks

```bash
# show configuration tasks with clickable BM links
b2c cap tasks avalara-tax --site-id RefArch

# get tasks as JSON
b2c cap tasks avalara-tax --site-id RefArch --json
```

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
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch

# install a pre-packaged zip
b2c cap install ./commerce-avalara-tax-app-v0.2.5.zip --site-id RefArch

# install with a timeout
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch --timeout 600

# skip validation before install
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch --skip-validate

# remove the uploaded archive after install
b2c cap install ./commerce-avalara-tax-app-v0.2.5 --site-id RefArch --clean-archive
```

### Uninstall a CAP

```bash
# uninstall a commerce app (domain is looked up automatically)
b2c cap uninstall avalara-tax --site-id RefArch
```

### More Commands

See `b2c cap --help` for a full list of available commands and options in the `cap` topic.

## Related Skills

- `b2c-cli:b2c-job` - For running general jobs and site archive import/export
- `b2c-cli:b2c-site-import-export` - For site archive structure and metadata XML patterns
- `b2c-cli:b2c-code` - For deploying cartridges pulled from Commerce Apps
