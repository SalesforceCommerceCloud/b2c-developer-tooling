---
name: b2c-sites
description: List storefront sites, check site status, and manage cartridge paths on B2C Commerce instances using the b2c CLI. Use this skill whenever the user needs to discover site IDs, check which storefronts are online or offline, get site configuration as JSON, or view/modify the ordered cartridge path for a site or Business Manager. Also use when the user needs site information for scripting, CI/CD pipelines, or as input to other commands — even if they just say "what sites do I have" or "add this cartridge to my site".
---

# B2C Sites Skill

Use the `b2c` CLI plugin to list and manage storefront sites on Salesforce B2C Commerce instances.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli sites list`).

## Commands

### `b2c sites list`

Lists all sites on a B2C Commerce instance, showing site ID, display name, and storefront status.

```bash
# list all sites on the configured instance
b2c sites list

# list sites on a specific server
b2c sites list --server my-sandbox.demandware.net

# list sites with JSON output (useful for parsing/automation)
b2c sites list --json

# use a specific instance from config
b2c sites list --instance production

# enable debug logging
b2c sites list --debug
```

### Cartridge Path Management

Manage the ordered list of active cartridges on a site. The singular alias `sites cartridge` also works.

```bash
# list the cartridge path for a storefront site
b2c sites cartridges list --site-id RefArch

# list the Business Manager cartridge path
b2c sites cartridges list --bm

# add a cartridge to the beginning of a site's path (default)
b2c sites cartridges add plugin_applepay --site-id RefArch

# add a cartridge to the end
b2c sites cartridges add plugin_applepay --site-id RefArch --position last

# add a cartridge after a specific cartridge
b2c sites cartridges add plugin_applepay --site-id RefArch --position after --target app_storefront_base

# add a cartridge to Business Manager
b2c sites cartridges add bm_extension --bm --position first

# remove a cartridge from a site
b2c sites cartridges remove old_cartridge --site-id RefArch

# replace the entire cartridge path
b2c sites cartridges set "app_storefront_base:plugin_applepay:plugin_wishlists" --site-id RefArch

# JSON output for automation
b2c sites cartridges list --site-id RefArch --json
```

When OCAPI direct permissions for `/sites/*/cartridges` are unavailable, cartridge commands automatically fall back to site archive import/export. Business Manager (`--bm`) updates always use site archive import.

**Key flags (inherited from InstanceCommand):**

| Flag | Short | Description |
|------|-------|-------------|
| `--server` | `-s` | B2C instance hostname (env: `SFCC_SERVER`) |
| `--json` | | Output full site data as JSON |
| `--instance` | | Named instance from config |
| `--debug` | | Enable debug logging |

**Output columns:** ID, Display Name, Status (storefront_status).

**JSON output** returns the full OCAPI sites response including all site properties (useful for extracting channel IDs, custom preferences, and other site metadata not shown in the table).

## Common Use Cases

**Finding site IDs for other commands:** Many commands (e.g., site import/export) require a site ID. Use `sites list` to discover valid IDs:

```bash
b2c sites list
# then use the ID in other commands
b2c site-import upload --site RefArch ...
```

**Checking site status:** The status column shows the storefront status (online/offline) for each site, useful for verifying deployment state.

**Scripting and automation:** Use `--json` to get machine-readable output for CI/CD pipelines:

```bash
b2c sites list --json | jq '.data[].id'
```

## Related Skills

- **b2c-config** -- configure instances, credentials, and debug connection issues
- **b2c-site-import-export** -- import/export site archives and metadata XML
