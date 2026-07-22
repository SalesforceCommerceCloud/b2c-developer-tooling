---
name: b2c-am
description: Manage Account Manager resources including API clients, users, roles, and organizations. Use this skill whenever the user needs to create or update API clients, onboard or offboard developers, assign Account Manager roles scoped to tenants, audit user permissions, look up organizations, or provision API clients for CI/CD pipelines. Also use when managing AM role assignments or querying Account Manager data — even if they just say "add a new developer" or "set up an API client". For instance-level Business Manager administration (BM roles, BM users, BM access keys, BM whoami), defer to the `b2c-cli:b2c-bm-users-roles` skill.
persona: operator
category: Access & Identity Administration
tags: [account-manager, access-control, authentication, cli, ci-cd]
---

# B2C Account Manager Skill

Use the `b2c am` commands to manage Account Manager resources: API clients, users, roles, and organizations.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli am clients list`).

## Authentication

Account Manager commands work out of the box with no configuration. The CLI uses a built-in public client and opens a browser for login.

- **Zero-config (browser login):** Default. Just run the commands -- the CLI opens a browser for login.
- **Client credentials:** For CI/CD and automation. The CLI auto-discovers `clientId`/`clientSecret` from `SFCC_*` env vars, `dw.json` (in the current or a parent directory), `package.json`, or configuration plugins — **passing `--client-id`/`--client-secret` flags is usually unnecessary**.
- **Force browser login (`--user-auth`):** When client credentials are configured but you need browser-based login (required for org and client management).

> Run `b2c setup inspect` to confirm which credentials the CLI sees and where they came from. For precedence and troubleshooting, see the `b2c-cli:b2c-config` skill.

### Role Requirements

| Operations | Client Credentials (roles on API client) | User Auth (roles on user account) |
|---|---|---|
| AM Users & Roles | User Administrator | Account Administrator or User Administrator |
| AM Organizations | Not supported -- use `--user-auth` | Account Administrator |
| AM API Clients | Not supported -- use `--user-auth` | Account Administrator or API Administrator |

Organization and API client management are only available with user authentication. For Business Manager administration (BM roles, users, access keys, whoami), see the `b2c-cli:b2c-bm-users-roles` skill.

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

## Business Manager Administration

BM-side resources (instance roles, instance users, access keys, whoami) live in the **`b2c-cli:b2c-bm-users-roles`** skill. Use it for:

- `b2c bm roles` — list/get/create/delete instance access roles, grant/revoke users, manage permissions
- `b2c bm users` — list, get, search, update, and delete instance users via the OCAPI `/users` resource
- `b2c bm whoami` — show the BM user the current OAuth token resolves to
- `b2c bm access-key` — provision and rotate WebDAV/OCAPI/Storefront access keys for SSO-managed users

Defer to that skill for BM examples and patterns. AM-side onboarding flows (creating an AM user, granting AM roles scoped to tenants) stay here.

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
