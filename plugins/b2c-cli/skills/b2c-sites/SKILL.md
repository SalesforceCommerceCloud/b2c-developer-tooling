---
name: b2c-sites
description: Salesforce B2C Commerce storefront sites listing and inspection Skill
---

# B2C Sites Skill

Use the `b2c` CLI plugin to list and inspect storefront sites on Salesforce B2C Commerce instances.

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
