---
name: b2c-sites
description: List and inspect storefront sites on B2C Commerce (SFCC/Demandware) instances with the b2c cli. Always reference when using the CLI to list storefront sites, find site IDs, check site status, view storefront configuration, site settings, channel IDs, or get a site list.
---

# B2C Sites Skill

Use the `b2c` CLI plugin to list and inspect storefront sites on Salesforce B2C Commerce instances.

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
