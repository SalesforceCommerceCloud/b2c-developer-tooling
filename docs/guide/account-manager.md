---
description: Manage Account Manager users, roles, organizations, and API clients with the B2C CLI, including authentication options, CI/CD automation, and common workflows.
---

# Account Manager Guide

The B2C CLI provides commands for managing Account Manager resources&mdash;users, roles, organizations, and API clients&mdash;directly from the terminal. This guide covers authentication setup, common workflows, and CI/CD automation.

::: tip
For the full command reference with all flags and options, see [Account Manager Commands](/cli/account-manager).
:::

## Authentication

Account Manager commands work without any configuration: you sign in with your Account Manager account in the browser. For automation, provide your own API client credentials.

### Zero-Config (Default)

Run the commands; you're asked to sign in when needed.

```bash
# Asks you to sign in the first time
b2c am users list
b2c am orgs list
```

Your user account's roles determine what operations you can perform (see [Role Requirements](#role-requirements)).

### User Authentication (`--user-auth`)

When you have client credentials configured but want to sign in with your account instead, use `--user-auth`:

```bash
# Sign in with your account even with SFCC_CLIENT_SECRET set
b2c am users list --user-auth

# Manage organizations (requires user auth)
b2c am orgs list --user-auth
```

### Client Credentials

Uses the API client's secret for non-interactive authentication. This option is best for CI/CD pipelines, scripts, and automation.

```bash
# List users with client credentials
b2c am users list --client-id $SFCC_CLIENT_ID --client-secret $SFCC_CLIENT_SECRET
```

Requirements:
- A `--client-id` and `--client-secret`
- The API client must have the appropriate roles assigned (see [Role Requirements](#role-requirements))

### Authentication Order

With a client secret, the CLI uses client credentials; otherwise you sign in with your account (using your configured `--client-id`, if any). Pass `--user-auth` to sign in even when a secret is configured.

### Role Requirements

Different operations require different roles, and the required roles depend on how you authenticate.

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

No setup required. You're asked to sign in when needed.

```bash
b2c am users list
```

If you need to use your own API client for specific scopes or organization restrictions:

1. In [Account Manager](https://account.demandware.com), find or create an API client.
2. Under **Redirect URLs**, add `http://localhost:8080`.
3. Under **Allowed Scopes**, add: `mail roles tenantFilter openid`.
4. Set **Default Scopes** to: `mail roles tenantFilter openid`.

```bash
export SFCC_CLIENT_ID=your-client-id
b2c am users list --user-auth
```

### For CI/CD and Automation

1. In [Account Manager](https://account.demandware.com), create a dedicated API client.
2. Set a strong password (client secret) and save it securely.
3. Under **Roles**, add **User Administrator** (for user/role management).
4. Under **Allowed Scopes**, add: `mail roles tenantFilter openid`.
5. Set **Default Scopes** to: `mail roles tenantFilter openid`.

Then configure your CI/CD environment:

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret
```

::: tip
Store the client secret in your CI/CD system's secrets manager&mdash;never commit it to source control.
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

Review users, roles, and organization details:

```bash
# List all users
b2c am users list --extended

# Get user details with expanded roles and organizations
b2c am users get developer@example.com --expand-all
```

### API Client Provisioning

Jobs, sites, Storefront Next storefronts, and other API commands need an API client. If you don't have one, create it with your own sign-in. You need the API Administrator or Account Administrator role in Account Manager.

```bash
# Find your organization ID
b2c am orgs list --user-auth

# Create the client; the command shows its details and asks before creating it
b2c am clients create --user-auth \
  --name "CI/CD Pipeline" \
  --orgs $ORG_ID \
  --password "$CLIENT_SECRET" \
  --roles SALESFORCE_COMMERCE_API \
  --role-tenant-filter "SALESFORCE_COMMERCE_API:abcd_prd" \
  --scopes "mail,roles,tenantFilter,openid,sfcc.jobs.rw,sfcc.sites" \
  --default-scopes "mail,roles,tenantFilter,openid,sfcc.jobs.rw,sfcc.sites" \
  --active

# Save it for your instance
b2c setup instance create staging --hostname staging-abcd-example.demandware.net \
  --client-id $CLIENT_ID --client-secret "$CLIENT_SECRET" \
  --short-code kv7kzm78 --tenant-id abcd_prd
```

Grant only the tenants and scopes the client needs; [Scopes by Command](./authentication#scopes-by-command) lists them. Clients are inactive unless you pass `--active`; activate one later with `b2c am clients update $CLIENT_ID --active`. A client can be deleted only after it has been disabled for 7 days. For commands that use OCAPI, also add the client ID to [Open Commerce API Settings](./authentication#ocapi-configuration).

When an AI assistant creates a client for you, the agent skills tell it to show you every detail and wait for your approval first.

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

The CLI couldn't find credentials for any allowed auth method:

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
