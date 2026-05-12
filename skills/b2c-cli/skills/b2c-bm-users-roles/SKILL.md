---
name: b2c-bm-users-roles
description: Manage Business Manager users, access roles, role permissions, and per-user access keys on a B2C Commerce instance using the b2c CLI. Use this skill whenever the user needs to list or search BM users on a sandbox or production instance, identify which BM user an OAuth token resolves to ("whoami"), assign or revoke instance-level access roles, edit role permissions, look up a user's WebDAV / OCAPI / Storefront access key, or rotate access keys for SSO-managed users. Also use when the user asks "what's my BM login on sandbox X", "rotate my WebDAV password", "how do I make a custom BM role", "audit BM users on this instance", or "delete a stale BM user from a sandbox".
---

# B2C Business Manager Users, Roles, and Access Keys

Use the `b2c bm` commands to administer instance-level Business Manager resources via the OCAPI Data API. These commands target a specific Commerce Cloud instance — pass `--server`/`-s` or set the active instance in `dw.json` first.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli bm whoami`).

For **Account Manager** user/role/client management (cross-instance, scoped to tenants), see the `b2c-cli:b2c-am` skill instead.

## API Backend

`bm users` (list, get, update, delete) and `bm roles` (all subcommands including permissions) support both the OCAPI Data API and the SCAPI Merchant Users / Merchant Roles APIs. Auto mode (default) prefers SCAPI when `shortCode` and `tenantId` are configured.

```bash
# force SCAPI (requires sfcc.users.rw / sfcc.roles.rw scope)
b2c bm users list --api-backend scapi

# force OCAPI
b2c bm roles get Administrator --api-backend ocapi
```

OCAPI-only commands (no SCAPI equivalent): `bm users search`, `bm whoami`, `bm access-key *`.

`bm users update --disabled` requires OCAPI (SCAPI's PATCH endpoint doesn't support changing `disabled`). Auto mode falls back to OCAPI for that case.

## Authentication

Most BM commands accept either client credentials or browser-based user auth. A handful require a *real BM user identity* and the CLI defaults those to user-auth automatically.

| Command group | Default auth | Why |
|---|---|---|
| `b2c bm roles ...` | client-credentials → jwt → implicit | OCAPI permissions for `/roles` |
| `b2c bm users {list,get,search,update,delete}` | client-credentials → jwt → implicit | OCAPI permissions for `/users` |
| `b2c bm whoami` | **implicit (browser)** | OCAPI `/users/this` requires the token to resolve to a BM user |
| `b2c bm access-key {get,create,set,delete}` | **implicit (browser)** | OCAPI access-key endpoints require "a valid user" plus `Manage_Users_Access_Keys` permission |

Override the default with `--auth-methods client-credentials` (or `--client-secret` flags) when your service-client setup is configured to issue user-bearing tokens.

## Business Manager Roles

BM roles are instance-level Business Manager access roles (e.g. `Administrator`, `Support`, plus any custom roles).

```bash
# list roles on the configured instance
b2c bm roles list

# target a different instance
b2c bm roles list --server my-sandbox.demandware.net

# get role details, including assigned users
b2c bm roles get Administrator --expand users

# create a custom role
b2c bm roles create MyEditor --description "Custom role for content editors"

# delete a custom role (system roles cannot be deleted)
b2c bm roles delete MyEditor

# assign / unassign a user
b2c bm roles grant user@example.com --role Administrator
b2c bm roles revoke user@example.com --role Administrator

# all commands accept --json for machine-readable output
b2c bm roles list --json
```

### Role Permissions

Permissions use a file-based get/set workflow because the API replaces the entire permission set on each write.

```bash
# view a permission summary
b2c bm roles permissions get Administrator

# export to a JSON file for editing
b2c bm roles permissions get Administrator --output admin-perms.json

# edit the file, then apply
b2c bm roles permissions set Administrator --file admin-perms.json
```

The permissions JSON has four sections: `functional`, `module`, `locale`, and `webdav`. Each can be scoped to organization, site, or unscoped depending on the permission type.

## Business Manager Users

Most production instances use SSO with Account Manager — creating *local* BM users is rejected with `LocalUserCreationException`. These commands focus on **read/search/update/delete** for AM-managed users plus the per-user access-key administration below.

```bash
# list (default 25)
b2c bm users list
b2c bm users list --count 50 --start 50            # pagination
b2c bm users list --extended                       # add lastLogin, externalId
b2c bm users list --columns login,email,lastLogin  # custom column set

# get one user by login (email)
b2c bm users get user@example.com

# search by attribute (any combination of flags)
b2c bm users search --search-phrase smith
b2c bm users search --login user@example.com
b2c bm users search --locked --sort-by last_login_date --sort-order desc
b2c bm users search --query '{"text_query":{"fields":["login"],"search_phrase":"foo"}}'

# update non-identity fields (locale, external_id, disabled, name)
b2c bm users update user@example.com --disabled
b2c bm users update user@example.com --no-disabled --preferred-ui-locale en_US
b2c bm users update user@example.com --first-name Jane --last-name Doe

# delete (prompts for confirmation; --force to skip)
b2c bm users delete user@example.com
b2c bm users delete user@example.com --force --json
```

**Cannot be updated via `update`:** the `locked` flag and the user `password` (those are governed by AM/SSO).

## Whoami — Identify the Current BM User

`bm whoami` calls `GET /users/this` and returns the BM user the OAuth token resolves to. Useful for verifying which identity will be used for downstream commands and for sanity-checking that a token actually carries a user claim.

```bash
b2c bm whoami
b2c bm whoami --json
```

Defaults to browser-based user-auth — a fresh shell will trigger an `b2c auth login` flow. Once logged in, the saved session is reused across commands until it expires.

## Access Keys (WebDAV, OCAPI, Storefront)

Access keys let SSO-managed BM users authenticate to non-OAuth surfaces (WebDAV, classic OCAPI/SCAPI Basic auth, or Storefront diagnostics). Three scopes exist; pick the one matching the surface you need to use.

| Scope | Used for |
|---|---|
| `WEBDAV_AND_STUDIO` (default) | WebDAV uploads (cartridge sync, IMPEX), Studio access |
| `AGENT_USER_AND_OCAPI` | Customer Service Center (CSC) and OCAPI Basic auth |
| `STOREFRONT` | Storefront diagnostic / agent login passwords |

`[LOGIN]` is **optional** on every access-key command — when omitted, the CLI calls `bm whoami` first and operates on your own user. Passing an explicit login lets administrators manage someone else's keys (requires `Manage_Users_Access_Keys` permission).

```bash
# get access-key state for the current user (defaults to WEBDAV_AND_STUDIO)
b2c bm access-key get
b2c bm access-key get --scope STOREFRONT
b2c bm access-key get user@example.com --scope AGENT_USER_AND_OCAPI

# create or rotate an access key — the secret is shown ONCE at creation
b2c bm access-key create
b2c bm access-key create --scope STOREFRONT
b2c bm access-key create --json | jq -r '.access_key'

# enable / disable an existing key
b2c bm access-key set --enabled
b2c bm access-key set --no-enabled
b2c bm access-key set user@example.com --scope STOREFRONT --enabled

# delete (prompts for confirmation; --force to skip)
b2c bm access-key delete
b2c bm access-key delete --scope STOREFRONT --force
```

> **Important:** the `access_key` value is only returned in the response of `create`. Subsequent `get` calls do not return it. If you lose the value, run `create` again — the previous key is removed automatically.

## Common Workflows

### Rotate my own WebDAV password (no admin privileges needed)

```bash
b2c bm access-key create
# record the printed access_key — it's the new password for WebDAV/IMPEX
```

### Audit users with admin role and stale logins

```bash
b2c bm roles get Administrator --expand users --json | jq '.users[].login'
b2c bm users search --sort-by last_login_date --sort-order asc --json
```

### Provision a new custom role and assign one user

```bash
b2c bm roles create MyEditor --description "Content editors"
b2c bm roles permissions get MyEditor --output role.json
# edit role.json
b2c bm roles permissions set MyEditor --file role.json
b2c bm roles grant editor@example.com --role MyEditor
```

### Cycle access keys for an SSO user (admin)

```bash
# disable temporarily
b2c bm access-key set user@example.com --scope WEBDAV_AND_STUDIO --no-enabled

# rotate
b2c bm access-key create user@example.com --scope WEBDAV_AND_STUDIO
```

## Common Patterns

- All list/search commands support `--columns`, `--extended` / `-x`, and `--json`.
- `bm users` and `bm roles` use OCAPI pagination: `--count`/`-n` and `--start`. AM commands use `--size`/`--page` instead — don't mix them up.
- Destructive commands (`bm users delete`, `bm access-key delete`) prompt for confirmation. Use `--force` for non-interactive scripts. `--json` mode skips the prompt automatically.
- When a service client cannot resolve a BM user (e.g. AM-only credential), `whoami` and `access-key` commands return `UserNotAvailableException` from the API — re-run with `--user-auth` or `b2c auth login` first.

### More

See `b2c bm --help`, `b2c bm users --help`, and `b2c bm access-key --help` for the full flag list. The OCAPI Data API user resource documentation describes the underlying endpoints and their fault codes.
