---
name: b2c-slas
description: Salesforce B2C Commerce SLAS (Shopper Login and API Access Service) client management Skill
---

# B2C SLAS Skill

Use the `b2c` CLI plugin to manage SLAS (Shopper Login and API Access Service) API clients and credentials.

## Examples

### List SLAS Clients

```bash
# list all SLAS clients for a tenant
b2c slas client list --tenant-id abcd_123

# list with JSON output
b2c slas client list --tenant-id abcd_123 --json
```

### Get SLAS Client Details

```bash
# get details for a specific SLAS client
b2c slas client get --tenant-id abcd_123 --client-id my-client-id
```

### Create SLAS Client

```bash
# create a new SLAS client with default scopes (auto-generates UUID client ID)
b2c slas client create --tenant-id abcd_123 --channels RefArch --default-scopes --redirect-uri http://localhost:3000/callback

# create with a specific client ID and custom scopes
b2c slas client create my-client-id --tenant-id abcd_123 --channels RefArch --scopes sfcc.shopper-products,sfcc.shopper-search --redirect-uri http://localhost:3000/callback

# create a public client
b2c slas client create --tenant-id abcd_123 --channels RefArch --default-scopes --redirect-uri http://localhost:3000/callback --public

# create client without auto-creating tenant (if you manage tenants separately)
b2c slas client create --tenant-id abcd_123 --channels RefArch --default-scopes --redirect-uri http://localhost:3000/callback --no-create-tenant

# output as JSON (useful for capturing the generated secret)
b2c slas client create --tenant-id abcd_123 --channels RefArch --default-scopes --redirect-uri http://localhost:3000/callback --json
```

Note: By default, the tenant is automatically created if it doesn't exist.

### Update SLAS Client

```bash
# update an existing SLAS client
b2c slas client update --tenant-id abcd_123 --client-id my-client-id
```

### Delete SLAS Client

```bash
# delete a SLAS client
b2c slas client delete --tenant-id abcd_123 --client-id my-client-id
```

### Configuration

The tenant ID can be set via environment variable:
- `SFCC_TENANT_ID`: SLAS tenant ID (organization ID)

### More Commands

See `b2c slas --help` for a full list of available commands and options in the `slas` topic.
