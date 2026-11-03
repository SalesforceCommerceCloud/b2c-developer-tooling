---
name: b2c-am
description: Manage Account Manager resources including API clients, users, roles, and organizations. Use this skill whenever the user needs to create or update API clients, onboard or offboard developers, assign Account Manager roles scoped to tenants, audit user permissions, look up organizations, or provision API clients for CI/CD pipelines. Also use when managing AM role assignments or querying Account Manager data — even if they just say "add a new developer" or "set up an API client". For instance-level Business Manager administration (BM roles, BM users, BM access keys, BM whoami), defer to the `b2c-cli:b2c-bm-users-roles` skill.
---

# B2C Account Manager Skill

Use the `b2c am` commands to manage Account Manager resources: API clients, users, roles, and organizations.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli am clients list`).

## Authentication

Account Manager commands work with no configuration: the user signs in with their Account Manager account in the browser.

- **Zero-config (browser login):** Default. Just run the commands -- the CLI opens a browser for login.
- **Client credentials:** For CI/CD and automation. The CLI auto-discovers `clientId`/`clientSecret` from `SFCC_*` env vars (including project `.env`), the selected project-local or shared `dw.json`, or configuration plugins — **passing `--client-id`/`--client-secret` flags is usually unnecessary**.
- **Force browser login (`--user-auth`):** When client credentials are configured but you need browser-based login (required for org and client management).

> Run `b2c setup inspect` to confirm which credentials the CLI sees and where they came from. For precedence and troubleshooting, see the `b2c-cli:b2c-config` skill.

### Role Requirements

| Operations       | Client Credentials (roles on API client) | User Auth (roles on user account)           |
| ---------------- | ---------------------------------------- | ------------------------------------------- |
| AM Users & Roles | User Administrator                       | Account Administrator or User Administrator |
| AM Organizations | Not supported -- use `--user-auth`       | Account Administrator                       |
| AM API Clients   | Not supported -- use `--user-auth`       | Account Administrator or API Administrator  |

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

Jobs, sites, Storefront Next storefronts, and other SCAPI and OCAPI commands need an Account Manager API client. If the user has none, or `b2c setup inspect` shows no `clientId`, you can create one with the user's own sign-in. Requires user auth (`--user-auth`) with the **API Administrator** or **Account Administrator** role.

**Always confirm the client in detail with the user before creating it.** A new client is a credential for the organization, and it cannot be deleted until it has been disabled for 7 days. Before running `create`, show the user every value — name, organization, roles, role tenant filter (the tenant IDs it can reach), scopes and default scopes, redirect URLs, and whether it is active — and wait for explicit approval. Ask again for each client; do not reuse an approval. Let the user choose the password, or generate one and tell them where it is stored; never print it.

1. **Find the organization:** `b2c am orgs list --user-auth` (or `b2c am orgs get <org-id>`).
2. **Choose access** for what the user needs:

   | Need                                   | Roles and tenant filter                                     | Scopes                                                                                   |
   | -------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
   | Every client                           |                                                             | `mail,roles,tenantFilter,openid`                                                         |
   | Jobs, sites, and other SCAPI commands  | `SALESFORCE_COMMERCE_API` with tenant IDs (`abcd_001`)      | Per command: `sfcc.jobs.rw`, `sfcc.sites`, ... (`b2c docs read guide-authentication`)    |
   | Storefront Next storefronts (SCAPI)    | `SALESFORCE_COMMERCE_API` with tenant IDs                   | `sfcc.storefront.storefronts.rw`, `sfcc.storefront.environments.rw`, `sfcc.storefront.deployments.rw` |
   | Sandboxes and SLAS clients             | `Sandbox API User` with realm or tenant IDs                 |                                                                                          |

   Add the same scopes to `--scopes` and `--default-scopes`. Only grant the tenants and scopes the user asked for.

3. **Create it** after the user approves. The command prints the details and asks for confirmation; when the agent cannot answer the prompt, pass `--force` only after the user approved those exact details.

   ```bash
   b2c am clients create --user-auth \
     --name "CI/CD Pipeline" \
     --orgs <org-id> \
     --password "<client-secret>" \
     --roles SALESFORCE_COMMERCE_API \
     --role-tenant-filter "SALESFORCE_COMMERCE_API:abcd_001,abcd_002" \
     --scopes "mail,roles,tenantFilter,openid,sfcc.jobs.rw,sfcc.sites" \
     --default-scopes "mail,roles,tenantFilter,openid,sfcc.jobs.rw,sfcc.sites" \
     --active
   ```

   The client authenticates with its secret (`client_secret_basic`) unless `--token-endpoint-auth-method` says otherwise; a client set to `private_key_jwt` rejects the secret with `invalid_client` ("Invalid authentication method"). Clients are created inactive unless `--active` is set; activate later with `b2c am clients update <api-client-id> --active`.

4. **Save it** in the instance configuration with the client ID from the output (`b2c-cli:b2c-config`):

   ```bash
   b2c setup instance create staging --hostname staging.example.com \
     --client-id <api-client-id> --client-secret "<client-secret>" \
     --short-code kv7kzm78 --tenant-id abcd_001
   ```

5. **Verify:** `b2c setup inspect`, then a read such as `b2c sites list`.

Commands that use OCAPI (for example, with `--api-backend ocapi`) also need the client ID in the instance's Open Commerce API Settings, and WebDAV with client credentials needs WebDAV Client Permissions; see the [Authentication guide](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.md).

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

Client must be disabled for 7+ days before deletion. Destructive operation (safe mode check); confirm with the user first.

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
