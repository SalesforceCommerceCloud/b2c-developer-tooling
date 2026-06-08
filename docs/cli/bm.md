---
description: Commands for administering Business Manager resources on a B2C Commerce instance — access roles, users, access keys, and identity (whoami).
---

# Business Manager Commands

Commands for administering instance-level Business Manager resources via the OCAPI Data API. These are distinct from [Account Manager commands](/cli/account-manager) which manage cross-instance identity.

## Authentication

BM commands authenticate via OAuth against the configured Commerce Cloud instance. Two flows are supported:

- **Client credentials** — for automation and CI/CD. Configure an Account Manager API client and grant it the OCAPI permissions listed below. Pass credentials via `--client-id` / `--client-secret`, the `SFCC_CLIENT_ID` / `SFCC_CLIENT_SECRET` environment variables, or `dw.json`.
- **User auth (browser)** — for interactive use. Pass `--user-auth` (or run `b2c auth login` once and reuse the saved session). The CLI opens a browser and the resulting token carries your BM user identity.

A handful of endpoints require *a real BM user identity* and cannot use service-client tokens — the CLI defaults those to user-auth automatically:

| Command group | Default auth | Why |
|---|---|---|
| `b2c bm roles ...` | client-credentials → jwt → implicit | OCAPI permissions for `/roles` |
| `b2c bm users {list,get,search,update,delete}` | client-credentials → jwt → implicit | OCAPI permissions for `/users` |
| `b2c bm whoami` | **implicit (browser)** | `/users/this` requires the token to resolve to a BM user |
| `b2c bm access-key ...` | **implicit (browser)** | Access-key endpoints require *a valid user* plus the `Manage_Users_Access_Keys` BM functional permission |

Override the auto-defaulted user-auth with `--auth-methods client-credentials` (or `--client-secret`) when your service-client setup is configured to issue user-bearing tokens. The interactive defaults can also be skipped end-to-end by exporting `SFCC_AUTH_METHODS=client-credentials,jwt` in CI.

See the [Authentication Guide](/guide/authentication) for end-to-end setup, including the [BM administration OCAPI snippet](/guide/authentication#minimal-configuration-by-feature).

### Required OCAPI Permissions

Add these resources to the Data API client configuration in Business Manager (**Administration** > **Site Development** > **Open Commerce API Settings** > **Data API**):

| Resource | Methods | Used by |
|----------|---------|---------|
| `/roles` | GET | `bm roles list` |
| `/roles/*` | GET, PUT, DELETE | `bm roles get/create/delete` |
| `/roles/*/users` | GET | `bm roles get --expand users` |
| `/roles/*/users/*` | PUT, DELETE | `bm roles grant/revoke` |
| `/roles/*/permissions` | GET, PUT | `bm roles permissions get/set` |
| `/users` | GET | `bm users list` |
| `/users/*` | GET, PATCH, DELETE | `bm users get/update/delete` |
| `/users/this` | GET | `bm whoami`, `bm access-key` (optional login fallback) |
| `/users/*/access_key/*` | GET, PUT, PATCH, DELETE | `bm access-key get/create/set/delete` |
| `/user_search` | POST | `bm users search` |

For an importable JSON snippet covering all BM administration endpoints, see [Minimal Configuration by Feature](/guide/authentication#minimal-configuration-by-feature) in the Authentication Guide.

### Required BM Functional Permission

Access-key writes (`bm access-key {create,set,delete}`) additionally require the **Manage_Users_Access_Keys** BM functional permission on the user account performing the request. Grant it via Business Manager: **Administration** > **Roles & Permissions**. This is why the CLI defaults `bm access-key` commands to user-auth — service clients cannot carry BM functional permissions.

### Configuration Examples

```bash
# Interactive (browser login on first command, session reused after):
b2c auth login --instance my-sandbox
b2c bm whoami

# Client credentials (where supported):
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
export SFCC_SERVER=my-sandbox.demandware.net
b2c bm users list

# Force user-auth on a command that defaults to client-credentials:
b2c bm users list --user-auth

# Force client-credentials on a command that defaults to user-auth (advanced):
b2c bm access-key get --auth-methods client-credentials
```

---

## Roles

`b2c bm roles` — manage instance-level Business Manager access roles, user assignments, and role permissions.

### b2c bm roles list

List all access roles on an instance.

```bash
b2c bm roles list [--count <n>] [--start <n>] [--columns <cols>] [--extended]
```

| Flag | Description |
|------|-------------|
| `--count`, `-n` | Number of roles to return (default 25) |
| `--start` | Start index for pagination (default 0) |
| `--columns`, `-c` | Comma-separated columns to display. Available: `id`, `description`, `userCount`, `userManager` |
| `--extended`, `-x` | Show all columns including extended fields |

```bash
b2c bm roles list
b2c bm roles list --server my-sandbox.demandware.net
b2c bm roles list --extended --json
```

### b2c bm roles get

Get details of a specific access role.

```bash
b2c bm roles get <role> [--expand <expansion>...]
```

| Argument | Description |
|----------|-------------|
| `role` | Role ID (e.g. `Administrator`) |

| Flag | Description |
|------|-------------|
| `--expand`, `-e` | Expansions to apply (`users`, `permissions`). Repeatable. |

```bash
b2c bm roles get Administrator
b2c bm roles get Administrator --expand users
```

### b2c bm roles create

Create a new custom access role.

```bash
b2c bm roles create <role> [--description <text>]
```

| Argument | Description |
|----------|-------------|
| `role` | Role ID to create |

| Flag | Description |
|------|-------------|
| `--description`, `-d` | Description for the role |

```bash
b2c bm roles create ContentEditor --description "Role for content editors"
```

::: warning
Reserved role IDs (`Support`, `Business Support`) cannot be created.
:::

### b2c bm roles delete

Delete a custom access role.

```bash
b2c bm roles delete <role>
```

```bash
b2c bm roles delete ContentEditor
```

::: warning
System roles (e.g. `Administrator`) cannot be deleted.
:::

### b2c bm roles grant

Assign a user to an access role.

```bash
b2c bm roles grant <login> --role <role>
```

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to grant (required) |

```bash
b2c bm roles grant user@example.com --role Administrator
```

### b2c bm roles revoke

Unassign a user from an access role.

```bash
b2c bm roles revoke <login> --role <role>
```

```bash
b2c bm roles revoke user@example.com --role Administrator
```

### b2c bm roles permissions get

Get permissions for an access role.

```bash
b2c bm roles permissions get <role> [--output <file>]
```

| Flag | Description |
|------|-------------|
| `--output`, `-o` | Write full permissions JSON to a file for editing |

```bash
# View summary
b2c bm roles permissions get Administrator

# Export to file for editing
b2c bm roles permissions get Administrator --output admin-perms.json

# Get raw JSON
b2c bm roles permissions get Administrator --json
```

### b2c bm roles permissions set

Set (replace) all permissions for an access role from a JSON file.

```bash
b2c bm roles permissions set <role> --file <path>
```

| Flag | Description |
|------|-------------|
| `--file`, `-f` | JSON file containing permissions (`role_permissions` schema) (required) |

```bash
b2c bm roles permissions get MyRole --output perms.json
# ... edit perms.json ...
b2c bm roles permissions set MyRole --file perms.json
```

::: warning
This command replaces **all** existing permissions for the role. Use `permissions get --output` first to ensure you have the complete set.
:::

#### Permissions JSON Structure

The file follows the OCAPI `role_permissions` schema with four sections:

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

---

## Users

`b2c bm users` — query and manage instance-level Business Manager users via the OCAPI `/users` resource.

::: tip
Most production instances use SSO with Account Manager; creating *local* BM users via the Data API is rejected with `LocalUserCreationException`. These commands focus on read/search/lifecycle for AM-managed users plus access-key administration.
:::

### b2c bm users list

List all users on the instance.

```bash
b2c bm users list [--count <n>] [--start <n>] [--columns <cols>] [--extended]
```

| Flag | Description |
|------|-------------|
| `--count`, `-n` | Number of users to return (default 25) |
| `--start` | Start index for pagination (default 0) |
| `--columns`, `-c` | Comma-separated columns to display. Available: `login`, `email`, `name`, `disabled`, `locked`, `lastLogin`, `externalId` |
| `--extended`, `-x` | Include extended columns (`lastLogin`, `externalId`) |

```bash
b2c bm users list
b2c bm users list --count 100
b2c bm users list --extended --json
b2c bm users list --columns login,email,lastLogin
```

### b2c bm users get

Get details of one user by login.

```bash
b2c bm users get <login>
```

```bash
b2c bm users get user@example.com
b2c bm users get user@example.com --json
```

### b2c bm users search

Search users by login, email, name, lock state, or disabled state. Searchable fields per the Data API: `login`, `email`, `first_name`, `last_name`, `external_id`, `last_login_date`, `is_locked`, `is_disabled`.

```bash
b2c bm users search [--search-phrase <text>] [--login <login>] [--email <email>] \
    [--locked] [--disabled] [--sort-by <field>] [--sort-order asc|desc] \
    [--query <json>] [--count <n>] [--start <n>] [--columns <cols>] [--extended]
```

| Flag | Description |
|------|-------------|
| `--search-phrase` | Free-text phrase searched across login/email/first_name/last_name |
| `--login` | Match a specific login |
| `--email` | Match a specific email |
| `--locked` / `--no-locked` | Match locked / unlocked users |
| `--disabled` / `--no-disabled` | Match disabled / enabled users |
| `--sort-by` | Sort field (e.g. `last_login_date`) |
| `--sort-order` | `asc` or `desc` |
| `--query` | Raw OCAPI query JSON (overrides convenience flags) |
| `--count`, `-n` | Number of users to return (default 25) |
| `--start` | Start index for pagination (default 0) |
| `--columns`, `-c` | Comma-separated columns to display. Available: `login`, `email`, `name`, `disabled`, `locked`, `lastLogin`, `externalId` |
| `--extended`, `-x` | Include extended columns (`lastLogin`, `externalId`) |

```bash
b2c bm users search --search-phrase smith
b2c bm users search --locked --sort-by last_login_date --sort-order desc
b2c bm users search --query '{"text_query":{"fields":["login"],"search_phrase":"foo"}}'
```

### b2c bm users update

Update non-identity user fields. The `locked` flag and `password` cannot be updated through this command — those are governed by Account Manager / SSO.

```bash
b2c bm users update <login> [--disabled | --no-disabled] [--first-name <name>] \
    [--last-name <name>] [--email <email>] [--external-id <id>] \
    [--preferred-ui-locale <locale>] [--preferred-data-locale <locale>]
```

```bash
b2c bm users update user@example.com --disabled
b2c bm users update user@example.com --no-disabled --preferred-ui-locale en_US
b2c bm users update user@example.com --first-name Jane --last-name Doe
```

### b2c bm users delete

Remove a user from the instance. Prompts for confirmation by default.

```bash
b2c bm users delete <login> [--force]
```

| Flag | Description |
|------|-------------|
| `--force` | Skip the confirmation prompt |

```bash
b2c bm users delete user@example.com
b2c bm users delete user@example.com --force --json
```

---

## Whoami

`b2c bm whoami` — show the Business Manager user the current OAuth token resolves to. Calls `GET /users/this`.

```bash
b2c bm whoami [--json]
```

Useful for verifying which BM identity is in use after `b2c auth login`, or for sanity-checking that a token actually carries a user claim.

```bash
b2c bm whoami
b2c bm whoami --json | jq -r '.login'
```

::: tip
This command defaults to browser-based user-auth — a fresh shell triggers `b2c auth login`. The saved session is reused across commands until it expires.
:::

---

## Access Keys

`b2c bm access-key` — manage WebDAV / OCAPI / Storefront access keys for SSO-managed (externally managed) Business Manager users. These keys let users authenticate to non-OAuth surfaces using their BM identity.

`[LOGIN]` is **optional** on every access-key command — when omitted, the CLI calls `bm whoami` first and operates on your own user.

### Scopes

| Scope | Used for |
|---|---|
| `WEBDAV_AND_STUDIO` (default) | WebDAV uploads (cartridge sync, IMPEX), Studio access |
| `AGENT_USER_AND_OCAPI` | Customer Service Center (CSC) and OCAPI Basic auth |
| `STOREFRONT` | Storefront diagnostic / agent login passwords |

### b2c bm access-key get

Get the current state of an access key.

```bash
b2c bm access-key get [<login>] [--scope <scope>]
```

| Argument | Description |
|----------|-------------|
| `[login]` | User login (email). Defaults to the currently authenticated user. |

| Flag | Description |
|------|-------------|
| `--scope` | One of `WEBDAV_AND_STUDIO` (default), `AGENT_USER_AND_OCAPI`, `STOREFRONT` |

```bash
b2c bm access-key get
b2c bm access-key get --scope STOREFRONT
b2c bm access-key get user@example.com --scope AGENT_USER_AND_OCAPI
```

### b2c bm access-key create

Create or rotate an access key. The secret value is returned **only once**, at creation — record it immediately.

```bash
b2c bm access-key create [<login>] [--scope <scope>]
```

```bash
b2c bm access-key create
b2c bm access-key create --scope STOREFRONT
b2c bm access-key create --json | jq -r '.access_key'
```

::: warning
The previous key for the same scope is removed automatically when a new one is created. The new `access_key` value is only returned in the response of `create` — subsequent `get` calls do not return it.
:::

### b2c bm access-key set

Enable or disable an existing access key.

```bash
b2c bm access-key set [<login>] [--scope <scope>] (--enabled | --no-enabled)
```

| Flag | Description |
|------|-------------|
| `--enabled` / `--no-enabled` | Enable or disable the key (required) |

```bash
b2c bm access-key set --enabled
b2c bm access-key set --no-enabled
b2c bm access-key set user@example.com --scope STOREFRONT --enabled
```

### b2c bm access-key delete

Delete an access key. Prompts for confirmation by default.

```bash
b2c bm access-key delete [<login>] [--scope <scope>] [--force]
```

| Flag | Description |
|------|-------------|
| `--force` | Skip the confirmation prompt |

```bash
b2c bm access-key delete
b2c bm access-key delete --scope STOREFRONT --force
b2c bm access-key delete user@example.com --scope WEBDAV_AND_STUDIO
```

---

## Common Workflows

### Rotate my own WebDAV password

```bash
b2c bm access-key create
# record the printed access_key — use it as the new password for WebDAV/IMPEX
```

### Audit role assignments

```bash
b2c bm roles get Administrator --expand users --json | jq '.users[].login'
```

### Find inactive users

```bash
b2c bm users search --sort-by last_login_date --sort-order asc --json
```

### Provision a custom role and assign one user

```bash
b2c bm roles create MyEditor --description "Content editors"
b2c bm roles permissions get MyEditor --output role.json
# ...edit role.json...
b2c bm roles permissions set MyEditor --file role.json
b2c bm roles grant editor@example.com --role MyEditor
```

### Cycle access keys for a user (admin)

```bash
# disable temporarily
b2c bm access-key set user@example.com --scope WEBDAV_AND_STUDIO --no-enabled

# rotate
b2c bm access-key create user@example.com --scope WEBDAV_AND_STUDIO
```
