---
description: Managing Account Manager users, roles, organizations, and API clients with the B2C CLI — including authentication options, CI/CD automation, and common workflows.
---

# Account Manager Guide

The B2C CLI provides commands for managing Account Manager resources — users, roles, organizations, and API clients — directly from the terminal. This guide covers authentication setup, common workflows, and CI/CD automation.

::: tip
For the full command reference with all flags and options, see [Account Manager Commands](/cli/account-manager).
:::

## Authentication

Account Manager commands support two authentication methods. The right choice depends on whether you're working interactively or automating operations.

### User Authentication (`--user-auth`)

Opens a browser for interactive login. Uses roles assigned to your **user account** in Account Manager. Best for development and manual operations.

```bash
# List users with browser-based login
b2c am users list --client-id $SFCC_CLIENT_ID --user-auth

# Manage organizations (requires user auth)
b2c am orgs list --client-id $SFCC_CLIENT_ID --user-auth
```

Requirements:
- A `--client-id` with `http://localhost:8080` in its redirect URLs
- Your user account must have the appropriate Account Manager roles (see [Role Requirements](#role-requirements))

### Client Credentials

Uses the API client's secret for non-interactive authentication. Best for CI/CD pipelines, scripts, and automation.

```bash
# List users with client credentials
b2c am users list --client-id $SFCC_CLIENT_ID --client-secret $SFCC_CLIENT_SECRET
```

Requirements:
- A `--client-id` and `--client-secret`
- The API client must have the appropriate roles assigned (see [Role Requirements](#role-requirements))

### Authentication Order

By default, the CLI tries client credentials first (if `--client-secret` is provided), then falls back to user authentication. To force browser-based login, pass `--user-auth`.

### Role Requirements

Different operations require different roles, and the required roles depend on how you authenticate:

| Operations | Client Credentials (roles on API client) | User Auth (roles on user account) |
|---|---|---|
| Users & Roles | User Administrator | Account Administrator or User Administrator |
| Organizations | Not supported — use `--user-auth` | Account Administrator |
| API Clients | Not supported — use `--user-auth` | Account Administrator or API Administrator |

::: warning
Organization and API client management are **only available with user authentication**. Client credentials do not support these operations regardless of the roles assigned.
:::

If authentication fails, the CLI provides contextual error messages recommending the specific roles or `--user-auth` flag needed for the operation you attempted.

## Setting Up Credentials

### For Interactive Use

1. In [Account Manager](https://account.demandware.com), find or create an API client
2. Under **Redirect URLs**, add `http://localhost:8080`
3. Under **Allowed Scopes**, add: `mail roles tenantFilter openid`
4. Set **Default Scopes** to: `mail roles tenantFilter openid`

Then use it with `--user-auth`:

```bash
export SFCC_CLIENT_ID=your-client-id
b2c am users list --user-auth
```

### For CI/CD and Automation

1. In [Account Manager](https://account.demandware.com), create a dedicated API client
2. Set a strong password (client secret) and save it securely
3. Set **Token Endpoint Auth Method** to `client_secret_post`
4. Under **Roles**, add **User Administrator** (for user/role management)
5. Under **Allowed Scopes**, add: `mail roles tenantFilter openid`
6. Set **Default Scopes** to: `mail roles tenantFilter openid`

Then configure your CI/CD environment:

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
```

::: tip
Store the client secret in your CI/CD system's secrets manager — never commit it to source control.
:::

## Common Workflows

### User Onboarding

Create a user, then grant them the necessary roles:

```bash
# Create the user
b2c am users create --org $ORG_ID --mail developer@example.com \
  --first-name Alex --last-name Developer

# Grant Business Manager Admin role scoped to a specific tenant
b2c am roles grant developer@example.com \
  --role bm-admin --scope zzxy_prd
```

### User Offboarding

Revoke roles and disable the user:

```bash
# Revoke all roles
b2c am roles revoke developer@example.com --role bm-admin

# Soft delete (disable) the user
b2c am users delete developer@example.com

# Permanent deletion (user must be in DELETED state first)
b2c am users delete developer@example.com --purge
```

### Auditing

Review users, roles, and organization activity:

```bash
# List all users
b2c am users list --extended

# Get user details with expanded roles and organizations
b2c am users get developer@example.com --expand-all

# View organization audit logs
b2c am orgs audit $ORG_ID
```

### API Client Provisioning

Create and configure API clients for your team or automation:

```bash
# Create an API client
b2c am clients create \
  --name "CI/CD Pipeline" \
  --organizations $ORG_ID \
  --password "SecureP@ssword123" \
  --roles SALESFORCE_COMMERCE_API \
  --role-tenant-filter "SALESFORCE_COMMERCE_API:zzxy_prd"

# Activate the client
b2c am clients update $CLIENT_ID --active
```

### Bulk Operations with JSON Output

Use `--json` output for scripting and integration with other tools:

```bash
# Export all users as JSON
b2c am users list --size 4000 --json

# Export all organizations
b2c am orgs list --all --json

# Pipe to jq for filtering
b2c am users list --json | jq '.[] | select(.userState == "ACTIVE")'
```

## CI/CD Examples

### GitHub Actions

```yaml
jobs:
  manage-users:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install -g @salesforce/b2c-cli
      - run: b2c am users list --json
        env:
          SFCC_CLIENT_ID: ${{ secrets.SFCC_CLIENT_ID }}
          SFCC_CLIENT_SECRET: ${{ secrets.SFCC_CLIENT_SECRET }}
```

### Shell Script Automation

```bash
#!/bin/bash
# Ensure a user has the required roles

USER_EMAIL="developer@example.com"
REQUIRED_ROLES=("bm-admin" "SALESFORCE_COMMERCE_API")
TENANT="zzxy_prd"

for role in "${REQUIRED_ROLES[@]}"; do
  echo "Granting $role to $USER_EMAIL..."
  b2c am roles grant "$USER_EMAIL" --role "$role" --scope "$TENANT" --json
done
```

## Troubleshooting

### "operation forbidden" or "authentication invalid"

The CLI will suggest the specific role or auth method needed. Common fixes:

- **For user/role operations with client credentials**: Add the **User Administrator** role to your API client, or switch to `--user-auth`
- **For organization operations**: Use `--user-auth` — org management requires user authentication
- **For API client operations**: Use `--user-auth` with a user that has the **Account Administrator** or **API Administrator** role

### "No valid auth method available"

The CLI could not find credentials for any allowed auth method:

- Verify `--client-id` is set (or `SFCC_CLIENT_ID` environment variable)
- For client credentials, verify `--client-secret` is set
- For `--user-auth`, only `--client-id` is required

### Redirect URL errors with `--user-auth`

If the browser login fails with a redirect error:

- In Account Manager, verify `http://localhost:8080` is in the API client's **Redirect URLs**
- Ensure port 8080 is not in use by another application

## Next Steps

- [Account Manager Commands](/cli/account-manager) — Full command reference
- [Authentication Setup](/guide/authentication) — General authentication configuration
- [Configuration](/guide/configuration) — Environment variables and config files
