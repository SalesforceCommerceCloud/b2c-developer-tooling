---
name: b2c-am
description: Manage users, roles, API clients, and organizations across Account Manager and Business Manager using the b2c CLI. Use this skill whenever the user needs to create or delete users, grant or revoke roles (AM or BM), onboard or offboard developers, audit permissions, look up organizations, create or update API clients for CI/CD pipelines, or manage BM role permissions on an instance. Also use when the user asks about user administration, role assignments, or permission audits — even if they just say "add a new developer", "set up an API client", or "who has admin access".
---

# B2C Account Manager Skill

Use the `b2c am` commands to manage Account Manager resources: API clients, users, roles, and organizations.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli am clients list`).

## Authentication

Account Manager commands work out of the box with no configuration. The CLI uses a built-in public client and opens a browser for login.

- **Zero-config (browser login):** Default. Just run the commands -- the CLI opens a browser for login.
- **Client credentials:** For CI/CD and automation. Pass `--client-id` and `--client-secret` (or set `SFCC_CLIENT_ID` and `SFCC_CLIENT_SECRET` env vars).
- **Force browser login (`--user-auth`):** When client credentials are configured but you need browser-based login (required for org and client management).

### Role Requirements

| Operations | Client Credentials (roles on API client) | User Auth (roles on user account) |
|---|---|---|
| AM Users & Roles | User Administrator | Account Administrator or User Administrator |
| AM Organizations | Not supported -- use `--user-auth` | Account Administrator |
| AM API Clients | Not supported -- use `--user-auth` | Account Administrator or API Administrator |
| BM Roles | OCAPI permissions for `/roles` resource | OCAPI permissions for `/roles` resource |

Organization and API client management are only available with user authentication.

## API Clients

### List Clients

```bash
b2c am clients list

# with pagination
b2c am clients list --size 50 --page 2

# JSON output
b2c am clients list --json
```

### Get Client

```bash
# by UUID
b2c am clients get <api-client-id>

# with expanded organizations and roles
b2c am clients get <api-client-id> --expand organizations,roles
```

### Create Client

Clients are created inactive by default. Requires user auth.

```bash
b2c am clients create \
  --name "My API Client" \
  --orgs <org-id> \
  --password "securePassword123"

# with roles, role tenant filter, and redirect URLs
b2c am clients create \
  --name "CI/CD Pipeline" \
  --orgs <org-id> \
  --password "securePassword123" \
  --roles SALESFORCE_COMMERCE_API \
  --role-tenant-filter "SALESFORCE_COMMERCE_API:zzxy_prd" \
  --redirect-urls "https://example.com/callback" \
  --active
```

### Update Client

Partial update -- only specified fields are changed.

```bash
b2c am clients update <api-client-id> --name "New Name"
b2c am clients update <api-client-id> --active
```

### Change Client Password

```bash
b2c am clients password <api-client-id> --current "oldPass" --new "newSecurePass123"
```

### Delete Client

Client must be disabled for 7+ days before deletion. Destructive operation (safe mode check).

```bash
b2c am clients delete <api-client-id>
```

## Users

### List Users

```bash
b2c am users list

# with extended columns (roles, organizations)
b2c am users list --extended

# JSON output with pagination
b2c am users list --size 100 --json
```

### Get User

```bash
b2c am users get user@example.com

# with expanded roles and organizations
b2c am users get user@example.com --expand-all
```

### Create User

```bash
b2c am users create \
  --org "My Organization" \
  --mail user@example.com \
  --first-name Jane \
  --last-name Doe
```

The `--org` flag accepts either an org ID or org name. Users are created in INITIAL state with no roles.

### Update User

```bash
b2c am users update user@example.com --first-name Janet --last-name Smith
```

### Delete User

Soft-deletes by default. Use `--purge` for hard delete (user must already be in DELETED state).

```bash
# soft delete
b2c am users delete user@example.com

# hard delete (purge)
b2c am users delete developer@example.com --purge
```

### Reset User Password

Resets password to INITIAL state, clearing expiration. Destructive operation (safe mode check).

```bash
b2c am users reset user@example.com
```

## Roles

### List Roles

```bash
b2c am roles list

# filter by target type
b2c am roles list --target-type User
b2c am roles list --target-type ApiClient
```

### Get Role

```bash
b2c am roles get bm-admin
b2c am roles get SLAS_ORGANIZATION_ADMIN
```

### Grant Role to User

```bash
b2c am roles grant user@example.com --role bm-admin

# with tenant scope
b2c am roles grant user@example.com --role bm-admin --scope zzzz_001,zzzz_002
```

### Revoke Role from User

```bash
# revoke entire role
b2c am roles revoke user@example.com --role bm-admin

# revoke specific tenant scopes only
b2c am roles revoke user@example.com --role bm-admin --scope zzzz_001
```

## Organizations

### List Organizations

```bash
b2c am orgs list

# all organizations (max page size)
b2c am orgs list --all

# extended columns
b2c am orgs list --extended
```

### Get Organization

Accepts org ID or name.

```bash
b2c am orgs get <org-id>
b2c am orgs get "My Organization"
```

## Business Manager Roles

BM role commands operate on a specific Commerce Cloud instance (via `--server` or config).

```bash
# list BM roles on the configured instance
b2c bm roles list

# target a different instance
b2c bm roles list --server my-sandbox.demandware.net

# get role details (with user list)
b2c bm roles get Administrator --expand users

# create a custom role
b2c bm roles create MyCustomRole --description "Custom role for content editors"

# delete a custom role (system roles cannot be deleted)
b2c bm roles delete MyCustomRole

# grant a BM role to a user on the instance
b2c bm roles grant user@example.com --role Administrator

# revoke a BM role from a user
b2c bm roles revoke user@example.com --role Administrator

# all commands support --json for machine-readable output
b2c bm roles list --json
```

### Business Manager Role Permissions

Permissions use a file-based get/set workflow since the API replaces all permissions at once.

```bash
# view permission summary
b2c bm roles permissions get Administrator

# export permissions to a JSON file for editing
b2c bm roles permissions get Administrator --output admin-perms.json

# edit the file, then apply
b2c bm roles permissions set Administrator --file admin-perms.json
```

The permissions JSON has four sections: `functional`, `module`, `locale`, and `webdav`. Each can be scoped to organization, site, or unscoped depending on type.

## Common Workflows

### User Onboarding

```bash
# Create the user
b2c am users create --org $ORG_ID --mail developer@example.com \
  --first-name Alex --last-name Developer

# Grant Business Manager Admin role scoped to a specific tenant
b2c am roles grant developer@example.com --role bm-admin --scope zzxy_prd
```

### User Offboarding

```bash
# Revoke roles
b2c am roles revoke developer@example.com --role bm-admin

# Soft delete the user
b2c am users delete developer@example.com

# Permanent deletion (user must be in DELETED state first)
b2c am users delete developer@example.com --purge
```

### Bulk Operations with JSON

```bash
# Export all users as JSON
b2c am users list --size 4000 --json

# Pipe to jq for filtering
b2c am users list --json | jq '.[] | select(.userState == "ACTIVE")'
```

## Common Patterns

All `am` commands support `--json` for programmatic output. List commands support `--columns`, `--extended`, `--size`, and `--page` for pagination and column control.

Destructive operations (user delete, user reset, client delete) check safe mode. Only delete or purge users when explicitly requested.

### More Commands

See `b2c am --help` for a full list of available commands and options.
