---
name: b2c-sites
description: List and inspect storefront sites on B2C Commerce (SFCC/Demandware) instances with the b2c cli. Always reference when using the CLI to list storefront sites, find site IDs, or check site configuration.
---

# B2C Sites Skill

Use the `b2c` CLI plugin to list and inspect storefront sites on Salesforce B2C Commerce instances.

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

### More Commands

See `b2c sites --help` for a full list of available commands and options in the `sites` topic.
