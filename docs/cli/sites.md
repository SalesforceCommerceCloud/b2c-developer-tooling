---
description: Commands for listing and managing storefront sites on B2C Commerce instances.
---

# Sites Commands

Commands for managing sites on B2C Commerce instances.

## Authentication

Sites commands require OAuth authentication with OCAPI permissions for the `/sites` resource.

### Required OCAPI Permissions

| Resource | Methods |
|----------|---------|
| `/sites` | GET |
| `/sites/*` | GET |

### Configuration

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication).

---

## b2c sites list

List sites on a B2C Commerce instance.

### Usage

```bash
b2c sites list
```

### Flags

Uses [global instance and authentication flags](./index#global-flags).

### Examples

```bash
# List sites on an instance
b2c sites list --server my-sandbox.demandware.net --client-id xxx --client-secret yyy

# Using environment variables
export SFCC_SERVER=my-sandbox.demandware.net
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
b2c sites list
```

### Output

The command displays a list of sites with their:

- Site ID
- Display name
- Status

Example output:

```
Found 2 site(s):

  RefArch
    Display Name: Reference Architecture
    Status: online

  SiteGenesis
    Display Name: Site Genesis
    Status: online
```

