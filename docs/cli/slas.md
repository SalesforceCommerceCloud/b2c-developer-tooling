---
description: Commands for managing Shopper Login and API Access Service (SLAS) tenants, clients, password action templates, identity providers, and shopper sessions.
---

# SLAS Commands

Commands for managing Shopper Login and API Access Service (SLAS) tenants, clients, password action templates, identity providers, and shopper sessions. For client types, user roles, and shopper authentication flows, see Salesforce's [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html).

::: tip
New to SLAS? The [SLAS guide](/guide/slas) walks through common tasks step by step.
:::

## Global SLAS Flags

These flags are available on all SLAS commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | (Required) SLAS tenant ID (organization ID) |

## Authentication

SLAS commands work without any API client configuration: you sign in with your Account Manager account in the browser.

For automation or CI/CD, provide your own API client credentials.

### Required Roles

| Auth Method | Role | Configured On |
|-------------|------|---------------|
| Built-in client (default) | `SLAS Organization Administrator` | Your user account |
| User Authentication | `SLAS Organization Administrator` | Your user account |
| Client Credentials | `Sandbox API User` | The API client |

The role must have a **tenant filter** configured for the organization you wish to manage.

### Configuration

```bash
# No configuration needed — opens browser for login
b2c slas client list --tenant-id abcd_123

# Or provide your own client ID
b2c slas client list --tenant-id abcd_123 --client-id xxx

# Client Credentials (for automation)
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c slas client list --tenant-id abcd_123
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#account-manager-api-client).

---

## b2c slas token

Get a SLAS shopper access token for testing APIs.

Shopper authorization, login, and token requests use the shared HTTP middleware.
Custom headers configured through `SFCC_EXTRA_HEADERS` (a JSON object) or
`--extra-headers` apply to every step of both guest and registered flows.
Use `--log-level debug` to include SLAS response correlation IDs when diagnosing failures.

### Usage

```bash
b2c slas token --tenant-id <TENANT_ID> --site-id <SITE_ID>
```

### Flags

| Flag | Environment Variable | Description | Required |
|------|---------------------|-------------|----------|
| `--tenant-id` | `SFCC_TENANT_ID` | SLAS tenant ID (organization ID) | Yes |
| `--site-id` | `SFCC_SITE_ID` | Site/channel ID | Yes* |
| `--slas-client-id` | `SFCC_SLAS_CLIENT_ID` | SLAS client ID (auto-discovered if omitted) | No |
| `--slas-client-secret` | `SFCC_SLAS_CLIENT_SECRET` | SLAS client secret (omit for public clients) | No |
| `--short-code` | `SFCC_SHORTCODE` | SCAPI short code | Yes |
| `--redirect-uri` | | Redirect URI | No |
| `--shopper-login` | | Registered customer login | No |
| `--shopper-password` | | Registered customer password (prompted interactively if omitted) | No |

\* `--site-id` can be auto-discovered from the SLAS client configuration when using auto-discovery.

### Flows

The command automatically selects the appropriate authentication flow based on whether `--shopper-login` and `--slas-client-secret` are provided:

| Scenario | Flow |
|----------|------|
| Guest, no `--slas-client-secret` | Public client guest PKCE (`authorization_code_pkce`) |
| Guest, with `--slas-client-secret` | Private client `client_credentials` |
| Registered (`--shopper-login`), no secret | Registered login + PKCE (`authorization_code_pkce`) |
| Registered (`--shopper-login`), with secret | Registered login + PKCE, plus client-secret Basic auth |
| No `--slas-client-id` | Auto-discovers first public client via SLAS Admin API |

::: tip Registered login uses PKCE on both public and private clients
The registered-customer flow is always PKCE-protected: the `/oauth2/login` step presents a `code_challenge`, so the token exchange always sends the matching `code_verifier`. A private SLAS client additionally authenticates with its secret (HTTP Basic). This is why the registered flow works against both public and private clients.
:::

### Examples

```bash
# Guest token with auto-discovery (finds first public SLAS client)
b2c slas token --tenant-id abcd_123 --site-id RefArch

# Guest token with explicit public client (PKCE flow)
b2c slas token --slas-client-id my-client \
  --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch

# Guest token with private client (client_credentials flow)
b2c slas token --slas-client-id my-client --slas-client-secret sk_xxx \
  --tenant-id abcd_123 --short-code kv7kzm78 --site-id RefArch

# Registered customer token
b2c slas token --tenant-id abcd_123 --site-id RefArch \
  --shopper-login user@example.com --shopper-password secret

# JSON output (includes refresh token, expiry, usid, etc.)
b2c slas token --tenant-id abcd_123 --site-id RefArch --json

# Use token in a subsequent API call
TOKEN=$(b2c slas token --tenant-id abcd_123 --site-id RefArch)
curl -H "Authorization: Bearer $TOKEN" \
  "https://kv7kzm78.api.commercecloud.salesforce.com/..."
```

### Output

- **Normal mode**: prints the raw access token to stdout (pipeable)
- **JSON mode** (`--json`): returns full token details:

```json
{
  "response": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 1800,
    "tokenType": "Bearer",
    "usid": "...",
    "customerId": "..."
  },
  "clientId": "...",
  "siteId": "RefArch",
  "isGuest": true
}
```

### Configuration

These values can also be set in `dw.json`:

```json
{
  "tenant-id": "abcd_123",
  "short-code": "kv7kzm78",
  "slas-client-id": "my-public-client",
  "site-id": "RefArch"
}
```

### Existing Client Selection

The `get`, `update`, `delete`, and `open` commands use the configured `slasClientId` when their positional `CLIENTID` is omitted. The value can come from `dw.json`, `SFCC_SLAS_CLIENT_ID`, `--slas-client-id`, the active instance, or a configuration plugin. A positional `CLIENTID` takes precedence over every configured source.

---

## b2c slas client list

List SLAS clients for a tenant.

### Usage

```bash
b2c slas client list --tenant-id <TENANT_ID>
```

### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--tenant-id` | SLAS tenant ID (organization ID) | Yes |

### Examples

```bash
# List all SLAS clients for a tenant
b2c slas client list --tenant-id abcd_123

# Output as JSON
b2c slas client list --tenant-id abcd_123 --json

# Using environment variables
export SFCC_TENANT_ID=abcd_123
b2c slas client list
```

### Output

Displays a list of SLAS clients with:

- Client ID
- Name
- Type (public/private)
- Channels

---

## b2c slas client create

Create or update a SLAS client.

### Usage

```bash
b2c slas client create [CLIENTID] --tenant-id <TENANT_ID> --channels <CHANNELS> --redirect-uri <URI>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID (generates UUID if omitted) | No |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--tenant-id` | SLAS tenant ID (organization ID) | Required |
| `--channels` | Site IDs/channels (comma-separated) | Required |
| `--redirect-uri` | Redirect URIs (comma-separated) | Required |
| `--name` | Display name for the client | Auto-generated |
| `--scopes` | OAuth scopes for the client (comma-separated) | |
| `--default-scopes` | Use default shopper scopes | `false` |
| `--callback-uri` | Callback URIs for passwordless login | |
| `--secret` | Client secret (generated if omitted) | Auto-generated |
| `--public` | Create a public client (default is private) | `false` |
| `--[no-]login-restricted` | Restrict shopper login endpoints to this client (`loginEpRestrict`) | `false` |
| `--[no-]six-digit-otp` | Use 6-digit instead of 8-digit one-time passwords for passwordless login | `false` |
| `--[no-]strict-client-auth` | Require client authentication on token requests (private clients only) | `false` |
| `--[no-]create-tenant` | Automatically create tenant if it doesn't exist | `true` |

### Examples

```bash
# Create a private client with specific scopes
b2c slas client create --tenant-id abcd_123 \
  --channels RefArch \
  --scopes sfcc.shopper-products,sfcc.shopper-search \
  --redirect-uri http://localhost:3000/callback

# Create a named client with custom ID
b2c slas client create my-client-id --tenant-id abcd_123 \
  --name "My Application" \
  --channels RefArch \
  --scopes sfcc.shopper-products \
  --redirect-uri http://localhost:3000/callback

# Create a public client
b2c slas client create --tenant-id abcd_123 \
  --channels RefArch \
  --default-scopes \
  --redirect-uri http://localhost:3000/callback \
  --public

# Output as JSON (useful for capturing the generated secret)
b2c slas client create --tenant-id abcd_123 \
  --channels RefArch \
  --default-scopes \
  --redirect-uri http://localhost:3000/callback \
  --json

# Restrict login endpoints and use 6-digit passwordless codes
b2c slas client create --tenant-id abcd_123 \
  --channels RefArch \
  --default-scopes \
  --redirect-uri http://localhost:3000/callback \
  --login-restricted --six-digit-otp
```

### Notes

- If `--secret` is not provided for a private client, one will be generated
- The generated secret is only shown once during creation
- Use `--default-scopes` for common shopper API access scopes
- By default, the tenant is automatically created if it doesn't exist. Use `--no-create-tenant` to disable this behavior if you prefer to manage tenants separately
- SLAS ignores `loginEpRestrict` when a client is created, so `--login-restricted` is applied with a second update right after creation
- `--strict-client-auth` has no effect on public clients

---

## b2c slas client get

Get details of a SLAS client.

### Usage

```bash
b2c slas client get [CLIENTID] --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to retrieve. Defaults to the configured `slasClientId` | No |

### Examples

```bash
# Get details for the configured SLAS client
b2c slas client get --tenant-id abcd_123

# Override the configured SLAS client ID
b2c slas client get my-client-id --tenant-id abcd_123

# Output as JSON
b2c slas client get my-client-id --tenant-id abcd_123 --json
```

### Output

Displays detailed information about the client including:

- Client ID and name
- Type (public/private)
- Channels
- Scopes
- Redirect URIs
- Callback URIs

---

## b2c slas client update

Update an existing SLAS client.

### Usage

```bash
b2c slas client update [CLIENTID] --tenant-id <TENANT_ID> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to update. Defaults to the configured `slasClientId` | No |

### Flags

| Flag | Description |
|------|-------------|
| `--tenant-id` | (Required) SLAS tenant ID |
| `--name` | Update display name |
| `--secret` | Rotate client secret |
| `--channels` | Update channels (comma-separated) |
| `--scopes` | Update scopes (comma-separated) |
| `--redirect-uri` | Update redirect URIs (comma-separated) |
| `--callback-uri` | Update callback URIs (comma-separated) |
| `--replace` | Replace list values instead of appending |
| `--private` | Make the client private (generates a secret unless `--secret` is given) |
| `--public` | Make the client public (removes its secret) |
| `--[no-]login-restricted` | Restrict shopper login endpoints to this client (`loginEpRestrict`) |
| `--[no-]six-digit-otp` | Use 6-digit instead of 8-digit one-time passwords for passwordless login |
| `--[no-]strict-client-auth` | Require client authentication on token requests (private clients only) |

### Examples

```bash
# Update the configured client name
b2c slas client update --tenant-id abcd_123 --name "New Name"

# Override the configured SLAS client ID
b2c slas client update my-client-id --tenant-id abcd_123 --name "New Name"

# Rotate client secret
b2c slas client update my-client-id --tenant-id abcd_123 --secret new-secret-value

# Add scopes (appends to existing)
b2c slas client update my-client-id --tenant-id abcd_123 --scopes sfcc.shopper-baskets

# Replace all scopes
b2c slas client update my-client-id --tenant-id abcd_123 \
  --scopes sfcc.shopper-products,sfcc.shopper-baskets \
  --replace

# Replace all channels
b2c slas client update my-client-id --tenant-id abcd_123 \
  --channels RefArch,SiteGenesis \
  --replace

# Restrict login endpoints and require strict client authentication
b2c slas client update my-client-id --tenant-id abcd_123 --login-restricted --strict-client-auth

# Convert a public client to private (prints the generated secret)
b2c slas client update my-client-id --tenant-id abcd_123 --private
```

### Notes

- By default, list values (channels, scopes, URIs) are appended to existing values
- Use `--replace` to replace all values instead of appending
- Secret rotation takes effect immediately
- Settings you don't pass (login restriction, OTP length, strict authentication) keep their current values
- Switching to `--public` removes the client secret; switching to `--private` generates one unless you pass `--secret`

---

## b2c slas client delete

Delete a SLAS client.

### Usage

```bash
b2c slas client delete [CLIENTID] --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to delete. Defaults to the configured `slasClientId` | No |

### Examples

```bash
# Delete the configured client
b2c slas client delete --tenant-id abcd_123

# Override the configured SLAS client ID
b2c slas client delete my-client-id --tenant-id abcd_123

# Output as JSON
b2c slas client delete my-client-id --tenant-id abcd_123 --json
```

### Notes

- Deletion is permanent and cannot be undone
- Active sessions using this client will be invalidated

---

## b2c slas client open

Open the SLAS Admin UI for a client in your browser.

### Usage

```bash
b2c slas client open [CLIENTID] --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to open in the admin UI. Defaults to the configured `slasClientId` | No |

### Flags

| Flag | Environment Variable | Description | Required |
|------|---------------------|-------------|----------|
| `--tenant-id` | `SFCC_TENANT_ID` | SLAS tenant ID (organization ID) | Yes |
| `--short-code` | `SFCC_SHORTCODE` | SCAPI short code | Yes* |
| `--slas-client-id` | `SFCC_SLAS_CLIENT_ID` | Configured SLAS client ID | No |

\* `--short-code` can be set via `SFCC_SHORTCODE` environment variable or `short-code` in `dw.json`.

### Examples

```bash
# Open the SLAS Admin UI for the configured client
b2c slas client open --tenant-id abcd_123

# Override the configured SLAS client ID
b2c slas client open my-client-id --tenant-id abcd_123

# With explicit short code
b2c slas client open my-client-id --tenant-id abcd_123 --short-code kv7kzm78
```

### Notes

- Opens the SLAS Admin UI in your default browser
- The URL is also printed to the console if the browser fails to open

---

## b2c slas client template list

List the password action templates of a SLAS client for a site. Templates define the email or SMS message SLAS sends for passwordless login, password reset, and WebAuthn flows.

### Usage

```bash
b2c slas client template list [CLIENTID] --tenant-id <TENANT_ID> --site-id <SITE_ID>
```

### Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | (Required) SLAS tenant ID |
| `--site-id` | `SFCC_SITE_ID` | (Required) Site ID. Alias: `--channel-id` |
| `--slas-client-id` | `SFCC_SLAS_CLIENT_ID` | Client ID when the argument is omitted |
| `--action-type` | | Only list one action type |
| `--template-type` | | Only list `EMAIL` or `SMS` templates |
| `--columns`, `--extended` | | Choose table columns |

Action types:

| Action Type | Used For |
|-------------|----------|
| `PWDLESS_LOGIN` | Passwordless login |
| `PWD_RESET_ACTION` | Password reset |
| `PWD_RESET_CROSS_DEVICE_ACTION` | Cross-device password reset |
| `WEBAUTHN_AUTHORIZE_USER` | WebAuthn user authorization |

### Examples

```bash
# List all templates of a client for a site
b2c slas client template list my-client-id --tenant-id abcd_123 --site-id RefArch

# Only passwordless login templates
b2c slas client template list my-client-id --tenant-id abcd_123 --site-id RefArch --action-type PWDLESS_LOGIN
```

---

## b2c slas client template get

Show one password action template.

### Usage

```bash
b2c slas client template get [CLIENTID] --tenant-id <TENANT_ID> --site-id <SITE_ID> \
  --action-type <TYPE> --template-type <EMAIL|SMS> --locale <LOCALE>
```

### Examples

```bash
b2c slas client template get my-client-id --tenant-id abcd_123 --site-id RefArch \
  --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us
```

---

## b2c slas client template set

Create or update a password action template. A template is identified by site, action type, template type, and locale. When the template exists, only the fields you pass change.

### Usage

```bash
b2c slas client template set [CLIENTID] --tenant-id <TENANT_ID> --site-id <SITE_ID> \
  --action-type <TYPE> --template-type <EMAIL|SMS> --locale <LOCALE> [FLAGS]
```

### Flags

| Flag | Description |
|------|-------------|
| `--action-type` | (Required) Action type (see [template list](#b2c-slas-client-template-list)) |
| `--template-type` | (Required) `EMAIL` or `SMS` |
| `--locale` | (Required) Template locale, for example `en-us` (stored in lowercase) |
| `--name` | Template name |
| `--subject` | Message subject |
| `--link` | Link sent to the shopper; can include `${token}` |
| `--template` | Message body |
| `--template-file` | Read the message body from a file (`-` for stdin) |
| `--file` | JSON file with the template fields (`channelId`, `actionType`, `templateType`, `locale`, `name`, `subject`, `link`, `template`); flags override it |

A new template needs `--name`, `--subject`, `--link`, and a body.

### Examples

```bash
# Create an email template for passwordless login
b2c slas client template set my-client-id --tenant-id abcd_123 --site-id RefArch \
  --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us \
  --name "Login code" --subject "Your login code" \
  --link 'https://example.com/login?token=${token}' \
  --template-file login-email.html

# Change only the subject
b2c slas client template set my-client-id --tenant-id abcd_123 --site-id RefArch \
  --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us \
  --subject "Sign in to your account"
```

---

## b2c slas client template delete

Delete a password action template. Prompts for confirmation unless `--force` is given.

### Usage

```bash
b2c slas client template delete [CLIENTID] --tenant-id <TENANT_ID> --site-id <SITE_ID> \
  --action-type <TYPE> --template-type <EMAIL|SMS> --locale <LOCALE> [--force]
```

### Examples

```bash
b2c slas client template delete my-client-id --tenant-id abcd_123 --site-id RefArch \
  --action-type PWDLESS_LOGIN --template-type EMAIL --locale en-us --force
```

---

## b2c slas tenant get

Show the SLAS registration of a tenant.

### Usage

```bash
b2c slas tenant get --tenant-id <TENANT_ID>
```

### Examples

```bash
b2c slas tenant get --tenant-id abcd_123
b2c slas tenant get --tenant-id abcd_123 --json
```

---

## b2c slas tenant set

Register a SLAS tenant, or update its merchant and contact details. Fields you don't pass keep their current values. When the tenant is not registered yet, placeholder values are used for any field you omit.

### Usage

```bash
b2c slas tenant set --tenant-id <TENANT_ID> [FLAGS]
```

### Flags

| Flag | Description |
|------|-------------|
| `--merchant-name` | Merchant name |
| `--description` | Tenant description |
| `--contact` | Contact name |
| `--email` | Contact email address |
| `--phone` | Contact phone number |

### Examples

```bash
# Register a tenant
b2c slas tenant set --tenant-id abcd_123 --merchant-name "Example Store" --contact "Ops Team" --email ops@example.com

# Update the contact email
b2c slas tenant set --tenant-id abcd_123 --email support@example.com
```

### Notes

- SLAS has no API to delete or list tenants. `b2c slas client create` registers the tenant automatically unless you pass `--no-create-tenant`

---

## b2c slas idp list

List the identity providers configured for a SLAS tenant.

### Usage

```bash
b2c slas idp list --tenant-id <TENANT_ID>
```

### Flags

| Flag | Description |
|------|-------------|
| `--show-secret` | Include IDP client secrets in the output (masked by default) |
| `--columns`, `--extended` | Choose table columns |

---

## b2c slas idp get

Show one identity provider.

### Usage

```bash
b2c slas idp get <NAME> --tenant-id <TENANT_ID> [--show-secret]
```

---

## b2c slas idp set

Create or update an identity provider for social or third-party shopper login. When the provider exists, only the fields you pass change.

The name must be a supported provider (`adfs`, `apple`, `auth0`, `azure`, `azure_adb2c`, `cognito`, `facebook`, `forgerock`, `gigya`, `gigya_social`, `google`, `line`, `okta`, `ping`, `salesforce`), or `default` for any other OpenID Connect provider, optionally followed by `-<suffix>`, for example `google-staging`. A `default` provider needs `--claim-mapper` to tell SLAS which claims hold the shopper's details.

### Usage

```bash
b2c slas idp set <NAME> --tenant-id <TENANT_ID> [FLAGS]
```

### Flags

| Flag | Description |
|------|-------------|
| `--idp-client-id` | Client ID registered with the identity provider |
| `--idp-client-secret` | Client secret registered with the identity provider |
| `--auth-url` | Authorization endpoint |
| `--token-url` | Token endpoint |
| `--token-info-url` | Token info (introspection) endpoint |
| `--user-info-url` | User info endpoint |
| `--well-known-url` | OpenID Connect discovery URL |
| `--redirect-url` | SLAS callback URL. Defaults to `https://<short-code>.api.commercecloud.salesforce.com/shopper/auth/v1/idp/callback/<name>` for new providers |
| `--scopes` | Scopes (comma-separated) |
| `--login-merge-claims` | Claims used to merge logins (comma-separated) |
| `--claim-mapper` | OIDC claim mappings (comma-separated) |
| `--[no-]preferred` | Mark as the preferred provider |
| `--[no-]client-creds-body` | Send client credentials in the request body instead of a header |
| `--[no-]use-well-known` | Read endpoints from the well-known URL |
| `--team-id`, `--key-id` | Apple Sign In team and key IDs |
| `--file` | JSON file with provider fields; flags override it |
| `--show-secret` | Include the client secret in the output |

A new provider needs the client ID and secret, the authorization, token, token info, user info, and well-known URLs, and scopes.

### Examples

```bash
# Create a Google provider
b2c slas idp set google --tenant-id abcd_123 \
  --idp-client-id 1234.apps.googleusercontent.com --idp-client-secret xxx \
  --well-known-url https://accounts.google.com/.well-known/openid-configuration \
  --auth-url https://accounts.google.com/o/oauth2/v2/auth \
  --token-url https://oauth2.googleapis.com/token \
  --token-info-url https://oauth2.googleapis.com/tokeninfo \
  --user-info-url https://www.googleapis.com/oauth2/v3/userinfo \
  --scopes openid,email,profile

# Change scopes only
b2c slas idp set google --tenant-id abcd_123 --scopes openid,email

# Copy a provider definition between tenants
b2c slas idp get google --tenant-id abcd_123 --show-secret --json > google.json
b2c slas idp set google --tenant-id efgh_456 --file google.json
```

### Notes

- `--idp-client-id` and `--idp-client-secret` are the provider's credentials. `--client-id` and `--client-secret` remain the Account Manager credentials used to call the SLAS Admin API

---

## b2c slas idp delete

Delete an identity provider. Shoppers can no longer log in through it. Prompts for confirmation unless `--force` is given.

### Usage

```bash
b2c slas idp delete <NAME> --tenant-id <TENANT_ID> [--force]
```

---

## b2c slas shopper logout

Log shoppers out of every session. SLAS revokes their refresh tokens and invalidates their access tokens. Shoppers keep their passwords and must log in again. Prompts for confirmation unless `--force` is given.

### Usage

```bash
b2c slas shopper logout --tenant-id <TENANT_ID> --site-id <SITE_ID> --login-id <LOGIN_ID>[,...] [--force]
```

### Flags

| Flag | Description |
|------|-------------|
| `--site-id` | (Required) Site ID. Alias: `--channel-id`. Env: `SFCC_SITE_ID` |
| `--login-id` | Login IDs (comma-separated or repeatable) |
| `--file` | File with one login ID per line (`-` for stdin) |
| `--force`, `-f` | Skip the confirmation prompt |

### Examples

```bash
b2c slas shopper logout --tenant-id abcd_123 --site-id RefArch --login-id shopper@example.com
b2c slas shopper logout --tenant-id abcd_123 --site-id RefArch --file compromised.txt --force --json
```

### Notes

- Login IDs are sent in batches of 50
- The command exits with status 1 when any logout fails, for example when the login ID is unknown
- Blocked under the `NO_UPDATE` safety level

---

## b2c slas shopper delete

Delete all SLAS records of a shopper, for example to fulfill a GDPR data deletion request. This deletes SLAS data only; delete the customer profile in B2C Commerce separately. Prompts for confirmation unless `--force` is given.

### Usage

```bash
b2c slas shopper delete <CUSTOMERID> --tenant-id <TENANT_ID> [--email <EMAIL>] [--force]
```

Pass `--email` to also match records by the shopper's email address.

### Examples

```bash
b2c slas shopper delete abcdKZmKZm1234567890abcd --tenant-id abcd_123 --email shopper@example.com --force
```

