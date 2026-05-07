---
description: Commands for managing Business Manager access roles, user assignments, and permissions on B2C Commerce instances.
---

# BM Roles Commands

Commands for managing instance-level Business Manager access roles on B2C Commerce instances. These are distinct from [Account Manager roles](/cli/account-manager#roles) which manage roles at the Account Manager level.

## Authentication

BM roles commands require OAuth authentication with OCAPI permissions for the `/roles` resource.

### Required OCAPI Permissions

| Resource | Methods |
|----------|---------|
| `/roles` | GET |
| `/roles/*` | GET, PUT, DELETE |
| `/roles/*/users` | GET, PUT, DELETE |

### Configuration

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication).

---

## b2c bm roles list

List all Business Manager access roles on an instance.

### Usage

```bash
b2c bm roles list [--count <n>] [--start <n>]
```

### Flags

| Flag | Description |
|------|-------------|
| `--count`, `-n` | Number of roles to return (default 25) |
| `--start` | Start index for pagination (default 0) |

Uses [global instance and authentication flags](./index#global-flags).

### Examples

```bash
b2c bm roles list --server my-sandbox.demandware.net
b2c bm roles list --count 50 --json
```

---

## b2c bm roles get

Get details of a specific access role.

### Usage

```bash
b2c bm roles get <role> [--expand <expansion>]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `role` | Role ID (e.g. "Administrator") |

### Flags

| Flag | Description |
|------|-------------|
| `--expand`, `-e` | Expansions to apply (e.g. `users`, `permissions`). Can be specified multiple times. |

### Examples

```bash
b2c bm roles get Administrator
b2c bm roles get Administrator --expand users
b2c bm roles get Administrator --json
```

---

## b2c bm roles create

Create a new custom access role on an instance.

### Usage

```bash
b2c bm roles create <role> [--description <text>]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `role` | Role ID to create |

### Flags

| Flag | Description |
|------|-------------|
| `--description`, `-d` | Description for the role |

### Examples

```bash
b2c bm roles create ContentEditor --description "Role for content editors"
b2c bm roles create ContentEditor --json
```

::: warning
Reserved role IDs ("Support", "Business Support") cannot be created.
:::

---

## b2c bm roles delete

Delete a custom access role from an instance.

### Usage

```bash
b2c bm roles delete <role>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `role` | Role ID to delete |

### Examples

```bash
b2c bm roles delete ContentEditor
```

::: warning
System roles (e.g. "Administrator") cannot be deleted.
:::

---

## b2c bm roles grant

Assign a user to an access role on an instance.

### Usage

```bash
b2c bm roles grant <login> --role <role>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `login` | User login (email) |

### Flags

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to grant (required) |

### Examples

```bash
b2c bm roles grant user@example.com --role Administrator
b2c bm roles grant user@example.com --role ContentEditor --json
```

---

## b2c bm roles revoke

Unassign a user from an access role on an instance.

### Usage

```bash
b2c bm roles revoke <login> --role <role>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `login` | User login (email) |

### Flags

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to revoke (required) |

### Examples

```bash
b2c bm roles revoke user@example.com --role Administrator
```

---

## b2c bm roles permissions get

Get permissions for an access role.

### Usage

```bash
b2c bm roles permissions get <role> [--output <file>]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `role` | Role ID (e.g. "Administrator") |

### Flags

| Flag | Description |
|------|-------------|
| `--output`, `-o` | Write full permissions JSON to a file for editing |

### Examples

```bash
# View summary
b2c bm roles permissions get Administrator

# Export to file for editing
b2c bm roles permissions get Administrator --output admin-perms.json

# Get raw JSON
b2c bm roles permissions get Administrator --json
```

---

## b2c bm roles permissions set

Set (replace) all permissions for an access role from a JSON file.

### Usage

```bash
b2c bm roles permissions set <role> --file <path>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `role` | Role ID |

### Flags

| Flag | Description |
|------|-------------|
| `--file`, `-f` | JSON file containing permissions (`role_permissions` schema) (required) |

### Examples

```bash
# Export, edit, then apply
b2c bm roles permissions get MyRole --output perms.json
# ... edit perms.json ...
b2c bm roles permissions set MyRole --file perms.json
```

::: warning
This command replaces **all** existing permissions for the role. Use `permissions get --output` first to ensure you have the complete set.
:::

### Permissions JSON Structure

The JSON file follows the OCAPI `role_permissions` schema with four sections:

```json
{
  "functional": {
    "organization": [{"name": "PERMISSION_NAME", "type": "functional", "value": "ACCESS"}],
    "site": []
  },
  "module": {
    "organization": [{"application": "bm", "name": "ModuleName", "type": "module", "system": true, "value": "ACCESS"}],
    "site": []
  },
  "locale": {
    "unscoped": [{"locale_id": "default", "type": "locale", "value": "ACCESS"}]
  },
  "webdav": {
    "unscoped": [{"folder": "Catalogs", "type": "webdav", "value": "ACCESS"}]
  }
}
```
