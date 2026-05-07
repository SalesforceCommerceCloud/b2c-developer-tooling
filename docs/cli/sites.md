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
| `/sites/*/cartridges` | POST, PUT, DELETE |

Cartridge path commands also work without the cartridge-specific OCAPI permissions — they automatically fall back to site archive import/export when direct OCAPI access is unavailable. The fallback requires job execution permissions for `sfcc-site-archive-import` and WebDAV write access to `Impex/`.

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

---

## Cartridge Commands

Manage the cartridge path for a site — the ordered list of cartridges that are active on a storefront. Use `sites cartridges` or the singular alias `sites cartridge`.

::: tip Business Manager
Use the `--bm` flag as a shorthand for `--site-id Sites-Site` to manage the Business Manager cartridge path. BM updates always use site archive import since OCAPI direct updates are not supported for the BM site.
:::

::: tip Automatic Fallback
If OCAPI permissions for `/sites/*/cartridges` are not available, cartridge commands automatically fall back to site archive import/export. This means the commands work even without specific cartridge OCAPI permissions, as long as job execution and WebDAV access are configured.
:::

---

### b2c sites cartridges list

List the cartridge path for a site.

#### Usage

```bash
b2c sites cartridges list --site-id <site-id>
b2c sites cartridges list --bm
```

#### Flags

| Flag | Description |
|------|-------------|
| `--site-id <id>` | Site ID (e.g. `RefArch`) |
| `--bm` | Use Business Manager site (`Sites-Site`) |
| `--json` | Output as JSON |

One of `--site-id` or `--bm` is required.

#### Examples

```bash
# List cartridge path for a storefront site
b2c sites cartridges list --site-id RefArch

# List Business Manager cartridge path
b2c sites cartridges list --bm

# JSON output for automation
b2c sites cartridges list --site-id RefArch --json
```

---

### b2c sites cartridges add

Add a cartridge to a site's cartridge path.

#### Usage

```bash
b2c sites cartridges add <cartridge> --site-id <site-id> [--position <position>] [--target <target>]
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `cartridge` | Name of the cartridge to add |

#### Flags

| Flag | Description |
|------|-------------|
| `--site-id <id>` | Site ID (e.g. `RefArch`) |
| `--bm` | Use Business Manager site (`Sites-Site`) |
| `--position <pos>` | Position: `first` (default), `last`, `before`, `after` |
| `--target <name>` | Target cartridge (required when position is `before` or `after`) |
| `--json` | Output as JSON |

#### Examples

```bash
# Add to beginning of path (default)
b2c sites cartridges add plugin_applepay --site-id RefArch

# Add to end
b2c sites cartridges add plugin_applepay --site-id RefArch --position last

# Add after a specific cartridge
b2c sites cartridges add plugin_applepay --site-id RefArch --position after --target app_storefront_base

# Add to Business Manager
b2c sites cartridges add bm_extension --bm --position first
```

---

### b2c sites cartridges remove

Remove a cartridge from a site's cartridge path.

::: warning Destructive Operation
This command modifies the site cartridge path. It is blocked in safe mode — use `--safety-level off` to allow it.
:::

#### Usage

```bash
b2c sites cartridges remove <cartridge> --site-id <site-id>
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `cartridge` | Name of the cartridge to remove |

#### Flags

| Flag | Description |
|------|-------------|
| `--site-id <id>` | Site ID (e.g. `RefArch`) |
| `--bm` | Use Business Manager site (`Sites-Site`) |
| `--json` | Output as JSON |

#### Examples

```bash
b2c sites cartridges remove old_cartridge --site-id RefArch
b2c sites cartridges remove bm_extension --bm
```

---

### b2c sites cartridges set

Replace the entire cartridge path for a site.

::: warning Destructive Operation
This command replaces the entire cartridge path. It is blocked in safe mode — use `--safety-level off` to allow it.
:::

#### Usage

```bash
b2c sites cartridges set <cartridges> --site-id <site-id>
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `cartridges` | New cartridge path (colon-separated, e.g. `cart1:cart2:cart3`) |

#### Flags

| Flag | Description |
|------|-------------|
| `--site-id <id>` | Site ID (e.g. `RefArch`) |
| `--bm` | Use Business Manager site (`Sites-Site`) |
| `--json` | Output as JSON |

#### Examples

```bash
b2c sites cartridges set "app_storefront_base:plugin_applepay:plugin_wishlists" --site-id RefArch
b2c sites cartridges set "bm_ext1:bm_ext2" --bm
```

