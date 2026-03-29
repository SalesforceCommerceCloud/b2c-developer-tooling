---
name: b2c-sites
description: List and manage storefront sites and cartridge paths on B2C Commerce (SFCC/Demandware) instances with the b2c cli. Always reference when using the CLI to list storefront sites, find site IDs, check site configuration, or manage the ordered list of active cartridges on a site or Business Manager.
---

# B2C Sites Skill

Use the `b2c` CLI plugin to list and manage storefront sites on Salesforce B2C Commerce instances.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli sites list`).

## Examples

### List Sites

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

### More Commands

See `b2c sites --help` for a full list of available commands and options in the `sites` topic.
