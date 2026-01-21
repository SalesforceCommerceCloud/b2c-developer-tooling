---
description: Commands for managing Account Manager roles including listing roles, viewing role details, and granting/revoking roles to users.
---

# Role Management Commands

Commands for managing roles and role assignments in Account Manager.

## Global Role Flags

These flags are available on all role commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (e.g., `account.demandware.com`) |

## Authentication

Role commands require an Account Manager API Client with OAuth authentication.

### Required Configuration

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID for Account Manager |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret for Account Manager |

### Required Roles

The API client must have the following role:
- `sfcc.accountmanager.user.manage` - Required for role assignment operations

### Configuration

```bash
# Set Account Manager host
export SFCC_ACCOUNT_MANAGER_HOST=account.demandware.com

# Set OAuth credentials
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret

# List roles
b2c role list
```

---

## b2c role list

List roles in Account Manager with pagination support.

### Usage

```bash
b2c role list [FLAGS]
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size` | Number of results per page (1-4000) | `20` |
| `--target-type` | Filter by target type (`User` or `ApiClient`) | All types |
| `--columns` | Comma-separated list of columns to display | Default columns |
| `--extended` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

### Default Columns

- ID
- Description
- Scope
- Internal Role

### Extended Columns

- Target Type

### Examples

```bash
# List first page of roles (default: 20 per page)
b2c role list

# List roles with custom page size
b2c role list --size 50

# Get second page of results
b2c role list --page 1 --size 25

# Filter roles by target type
b2c role list --target-type User

# Show all columns
b2c role list --extended

# Show only specific columns
b2c role list --columns id,description

# Output as JSON
b2c role list --json

# Using environment variables
export SFCC_ACCOUNT_MANAGER_HOST=account.demandware.com
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret
b2c role list
```

### Output

Displays a table of roles with the selected columns. If more pages are available, an info message is displayed at the end.

### Notes

- Page size must be between 1 and 4000
- Page number must be a non-negative integer (0-based)
- If the requested page exceeds available data, an error is returned
- Target type filter accepts `User` or `ApiClient`

---

## b2c role get

Get detailed information about a specific role.

### Usage

```bash
b2c role get <ROLE_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `ROLE_ID` | Role identifier (e.g., `bm-admin`, `SLAS_ORGANIZATION_ADMIN`) | Yes |

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |

### Examples

```bash
# Get role details
b2c role get bm-admin

# Get internal role details
b2c role get SLAS_ORGANIZATION_ADMIN

# Output as JSON
b2c role get bm-admin --json
```

### Output

When not using `--json`, displays formatted role information including:

- Basic Information: ID, Description, Scope, Target Type
- Internal Role: Whether this is an internal role

### Notes

- Role ID can be either the external role name (e.g., `bm-admin`) or internal role enum name (e.g., `ECOM_ADMIN`)
- If role is not found, an error is returned

---

## b2c role grant

Grant a role to a user, optionally with tenant scope.

### Usage

```bash
b2c role grant <LOGIN> --role <ROLE_ID> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

### Required Flags

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to grant (e.g., `bm-admin`) | Yes |

### Optional Flags

| Flag | Description |
|------|-------------|
| `--scope`, `-s` | Tenant scope (comma-separated list of tenant IDs). If not provided, grants role without scope restrictions. |
| `--json` | Output results as JSON |

### Examples

```bash
# Grant a role without scope
b2c role grant user@example.com --role bm-admin

# Grant a role with single tenant scope
b2c role grant user@example.com --role bm-admin --scope tenant1

# Grant a role with multiple tenant scopes
b2c role grant user@example.com --role bm-admin --scope "tenant1,tenant2"

# Using short flags
b2c role grant user@example.com -r bm-admin -s tenant1

# Output as JSON
b2c role grant user@example.com --role bm-admin --scope tenant1 --json
```

### Notes

- If the user already has the role, the scope will be updated if `--scope` is provided
- If `--scope` is not provided, the role is granted without tenant restrictions
- If `--scope` is provided, it replaces any existing scope for that role
- Multiple scopes can be specified as a comma-separated list
- If user is not found, an error is returned

---

## b2c role revoke

Revoke a role from a user, optionally removing specific tenant scope.

### Usage

```bash
b2c role revoke <LOGIN> --role <ROLE_ID> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

### Required Flags

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to revoke (e.g., `bm-admin`) | Yes |

### Optional Flags

| Flag | Description |
|------|-------------|
| `--scope`, `-s` | Tenant scope to remove (comma-separated). If not provided, removes the entire role. |
| `--json` | Output results as JSON |

### Examples

```bash
# Revoke entire role
b2c role revoke user@example.com --role bm-admin

# Revoke specific tenant scope (keeps role for other tenants)
b2c role revoke user@example.com --role bm-admin --scope tenant1

# Revoke multiple tenant scopes
b2c role revoke user@example.com --role bm-admin --scope "tenant1,tenant2"

# Using short flags
b2c role revoke user@example.com -r bm-admin -s tenant1

# Output as JSON
b2c role revoke user@example.com --role bm-admin --scope tenant1 --json
```

### Notes

- If `--scope` is not provided, the entire role is removed from the user
- If `--scope` is provided, only the specified tenant scopes are removed
- If all scopes are removed, the role itself is removed
- Multiple scopes can be specified as a comma-separated list
- If user is not found, an error is returned
