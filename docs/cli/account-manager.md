---
description: Commands for managing Account Manager resources including users, roles, organizations, and API clients.
---

# Account Manager Commands

Commands for managing Account Manager resources including users, roles, role assignments, organizations, and API clients.

## Global Flags

These flags are available on all Account Manager commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (e.g., `account.demandware.com`) |
| `--user-auth` | — | Use browser-based user authentication (implicit OAuth flow) |

## Authentication

Account Manager commands work out of the box using the CLI's built-in public client, which authenticates via browser login (implicit flow). No API client configuration is required for interactive use.

For automation or CI/CD, you can provide your own API client credentials. Use `--user-auth` to force browser-based authentication when you have client credentials configured but want to use your user account's roles instead.

### Required Roles by Subtopic

Different Account Manager operations require different roles depending on the authentication method:

| Subtopic | Client Credentials (roles on API client) | User Auth / built-in client (roles on user) |
|----------|------------------------------------------|---------------------------------------------|
| `users`, `roles` | User Administrator | Account Administrator or User Administrator |
| `orgs` | Not supported — use `--user-auth` | Account Administrator |
| `clients` | Not supported — use `--user-auth` | Account Administrator or API Administrator |

### Configuration

```bash
# No configuration needed — opens browser for login
b2c am users list

# Client Credentials (for automation)
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret
b2c am users list

# Force browser-based login even with client credentials configured
b2c am users list --user-auth
```

---

## User Management

Commands for managing users in Account Manager.

### b2c am users list

List users in Account Manager with pagination support.

#### Usage

```bash
b2c am users list [FLAGS]
```

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size` | Number of results per page (1-4000) | `20` |
| `--columns` | Comma-separated list of columns to display | Default columns |
| `--extended` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

#### Default Columns

- Email
- First Name
- Last Name
- State
- Password Expired
- 2FA Enabled
- Linked to SF
- Last Login

#### Extended Columns

- Roles
- Organizations

#### Examples

```bash
# List first page of users (default: 20 per page)
b2c am users list

# List users with custom page size
b2c am users list --size 50

# Get second page of results
b2c am users list --page 1 --size 25

# Show all columns including roles and organizations
b2c am users list --extended

# Show only specific columns
b2c am users list --columns mail,firstName,userState

# Output as JSON
b2c am users list --json
```

#### Notes

- Page size must be between 1 and 4000
- Page number must be a non-negative integer (0-based)
- If the requested page exceeds available data, an error is returned

---

### b2c am users get

Get detailed information about a specific user.

#### Usage

```bash
b2c am users get <LOGIN>
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--expand` | Comma-separated list of fields to expand. Valid values: `organizations`, `roles` |
| `--expand-all` | Expand both organizations and roles (equivalent to `--expand organizations,roles`) |
| `--json` | Output results as JSON |

#### Examples

```bash
# Get user details
b2c am users get user@example.com

# Get user with expanded organizations and roles
b2c am users get user@example.com --expand-all

# Get user with expanded organizations only
b2c am users get user@example.com --expand organizations

# Get user with expanded organizations and roles (comma-separated)
b2c am users get user@example.com --expand organizations,roles

# Output as JSON
b2c am users get user@example.com --json

# Output as JSON with expanded fields
b2c am users get user@example.com --expand-all --json
```

#### Output

When not using `--json`, displays formatted user information including:

- Basic Information: ID, Email, Name, State, Organization, etc.
- Organizations: List of organization IDs (or full organization objects if expanded)
- Roles: List of role IDs (or full role objects if expanded)
- Role Tenant Filters: Role-specific tenant scope mappings

When using `--expand` or `--expand-all`, the organizations and roles fields contain full objects instead of just IDs, providing additional details like organization names and role descriptions.

#### Notes

- User is identified by email address (login)
- If user is not found, an error is returned
- Use `--expand` or `--expand-all` to retrieve full organization and role objects instead of just IDs
- Invalid expand values will result in an error message listing the valid options

---

### b2c am users create

Create a new user in Account Manager.

#### Usage

```bash
b2c am users create --org <ORG_ID> --mail <EMAIL> [FLAGS]
```

#### Required Flags

| Flag | Description |
|------|-------------|
| `--org` | Organization ID where the user will be created |
| `--mail` | User email address (login) |

#### Optional Flags

| Flag | Description |
|------|-------------|
| `--first-name` | User's first name |
| `--last-name` | User's last name |
| `--display-name` | Display name |
| `--preferred-locale` | Preferred locale (e.g., `en_US`) |
| `--business-phone` | Business phone number |
| `--home-phone` | Home phone number |
| `--mobile-phone` | Mobile phone number |
| `--json` | Output results as JSON |

#### Examples

```bash
# Create a basic user
b2c am users create --org org-123 --mail user@example.com \
  --first-name John --last-name Doe

# Create a user with additional details
b2c am users create --org org-123 --mail user@example.com \
  --first-name John --last-name Doe \
  --display-name "John Doe" \
  --preferred-locale en_US \
  --business-phone "+1-555-123-4567"

# Output as JSON
b2c am users create --org org-123 --mail user@example.com \
  --first-name John --last-name Doe --json
```

#### Notes

- User will be created in INITIAL state
- User must be assigned roles separately using `b2c am roles grant`
- The user's primary organization is set to the specified `--org`

---

### b2c am users update

Update an existing user's information.

#### Usage

```bash
b2c am users update <LOGIN> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--first-name` | Update first name |
| `--last-name` | Update last name |
| `--display-name` | Update display name |
| `--preferred-locale` | Update preferred locale |
| `--business-phone` | Update business phone |
| `--home-phone` | Update home phone |
| `--mobile-phone` | Update mobile phone |
| `--json` | Output results as JSON |

#### Examples

```bash
# Update user's first name
b2c am users update user@example.com --first-name Jane

# Update multiple fields
b2c am users update user@example.com \
  --first-name Jane \
  --last-name Smith \
  --display-name "Jane Smith"

# Output as JSON
b2c am users update user@example.com --first-name Jane --json
```

#### Notes

- At least one field must be provided to update
- Only specified fields will be updated; other fields remain unchanged
- If user is not found, an error is returned

---

### b2c am users reset

Reset a user to INITIAL state, clearing password expiration and allowing password reset.

#### Usage

```bash
b2c am users reset <LOGIN>
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

#### Examples

```bash
# Reset user to INITIAL state
b2c am users reset user@example.com
```

#### Notes

- Resets the user's state to INITIAL
- Clears password expiration timestamp
- User will need to set a new password on next login

---

### b2c am users delete

Delete (disable) a user in Account Manager.

#### Usage

```bash
b2c am users delete <LOGIN> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--purge` | Permanently delete the user (hard delete). User must be in DELETED state first. |

#### Examples

```bash
# Soft delete (disable) a user
b2c am users delete user@example.com

# Permanently delete a user (must be in DELETED state first)
b2c am users delete user@example.com --purge
```

#### Notes

- By default, this performs a soft delete (disables the user)
- Soft delete sets the user state to DELETED
- Use `--purge` for permanent deletion (hard delete)
- Purging requires the user to already be in DELETED state
- Deletion is permanent and cannot be undone

---

## Role Management

Commands for managing roles and role assignments in Account Manager.

### b2c am roles list

List roles in Account Manager with pagination support.

#### Usage

```bash
b2c am roles list [FLAGS]
```

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size` | Number of results per page (1-4000) | `20` |
| `--target-type` | Filter by target type (`User` or `ApiClient`) | All types |
| `--columns` | Comma-separated list of columns to display | Default columns |
| `--extended` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

#### Default Columns

- ID
- Description
- Scope
- Internal Role

#### Extended Columns

- Target Type

#### Examples

```bash
# List first page of roles (default: 20 per page)
b2c am roles list

# List roles with custom page size
b2c am roles list --size 50

# Get second page of results
b2c am roles list --page 1 --size 25

# Filter roles by target type
b2c am roles list --target-type User

# Show all columns
b2c am roles list --extended

# Show only specific columns
b2c am roles list --columns id,description

# Output as JSON
b2c am roles list --json
```

#### Notes

- Page size must be between 1 and 4000
- Page number must be a non-negative integer (0-based)
- If the requested page exceeds available data, an error is returned
- Target type filter accepts `User` or `ApiClient`

---

### b2c am roles get

Get detailed information about a specific role.

#### Usage

```bash
b2c am roles get <ROLE_ID>
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `ROLE_ID` | Role identifier (e.g., `bm-admin`, `SLAS_ORGANIZATION_ADMIN`) | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |

#### Examples

```bash
# Get role details
b2c am roles get bm-admin

# Get internal role details
b2c am roles get SLAS_ORGANIZATION_ADMIN

# Output as JSON
b2c am roles get bm-admin --json
```

#### Output

When not using `--json`, displays formatted role information including:

- Basic Information: ID, Description, Scope, Target Type
- Internal Role: Whether this is an internal role

#### Notes

- Role ID can be either the external role name (e.g., `bm-admin`) or internal role enum name (e.g., `ECOM_ADMIN`)
- If role is not found, an error is returned

---

### b2c am roles grant

Grant a role to a user, optionally with tenant scope.

#### Usage

```bash
b2c am roles grant <LOGIN> --role <ROLE_ID> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

#### Required Flags

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to grant (e.g., `bm-admin`) | Yes |

#### Optional Flags

| Flag | Description |
|------|-------------|
| `--scope`, `-s` | Tenant scope (comma-separated list of tenant IDs). If not provided, grants role without scope restrictions. |
| `--json` | Output results as JSON |

#### Examples

```bash
# Grant a role without scope
b2c am roles grant user@example.com --role bm-admin

# Grant a role with single tenant scope
b2c am roles grant user@example.com --role bm-admin --scope tenant1

# Grant a role with multiple tenant scopes
b2c am roles grant user@example.com --role bm-admin --scope "tenant1,tenant2"

# Using short flags
b2c am roles grant user@example.com -r bm-admin -s tenant1

# Output as JSON
b2c am roles grant user@example.com --role bm-admin --scope tenant1 --json
```

#### Notes

- If the user already has the role, the scope will be updated if `--scope` is provided
- If `--scope` is not provided, the role is granted without tenant restrictions
- If `--scope` is provided, it replaces any existing scope for that role
- Multiple scopes can be specified as a comma-separated list
- If user is not found, an error is returned

---

### b2c am roles revoke

Revoke a role from a user, optionally removing specific tenant scope.

#### Usage

```bash
b2c am roles revoke <LOGIN> --role <ROLE_ID> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

#### Required Flags

| Flag | Description |
|------|-------------|
| `--role`, `-r` | Role ID to revoke (e.g., `bm-admin`) | Yes |

#### Optional Flags

| Flag | Description |
|------|-------------|
| `--scope`, `-s` | Tenant scope to remove (comma-separated). If not provided, removes the entire role. |
| `--json` | Output results as JSON |

#### Examples

```bash
# Revoke entire role
b2c am roles revoke user@example.com --role bm-admin

# Revoke specific tenant scope (keeps role for other tenants)
b2c am roles revoke user@example.com --role bm-admin --scope tenant1

# Revoke multiple tenant scopes
b2c am roles revoke user@example.com --role bm-admin --scope "tenant1,tenant2"

# Using short flags
b2c am roles revoke user@example.com -r bm-admin -s tenant1

# Output as JSON
b2c am roles revoke user@example.com --role bm-admin --scope tenant1 --json
```

#### Notes

- If `--scope` is not provided, the entire role is removed from the user
- If `--scope` is provided, only the specified tenant scopes are removed
- If all scopes are removed, the role itself is removed
- Multiple scopes can be specified as a comma-separated list
- If user is not found, an error is returned

---

## Organization Management

Commands for managing organizations in Account Manager.

### b2c am orgs list

List organizations in Account Manager with pagination support.

#### Usage

```bash
b2c am orgs list [FLAGS]
```

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size`, `-s` | Number of results per page (1-5000) | `25` |
| `--all`, `-a` | Return all organizations (uses max page size of 5000) | `false` |
| `--columns` | Comma-separated list of columns to display | Default columns |
| `--extended`, `-x` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

#### Default Columns

- ID
- Name
- Realms
- Email Domains
- 2FA Enabled
- VaaS Enabled
- SF Identity
- Min Password Length

#### Extended Columns

- 2FA Roles
- Verifier Types

#### Examples

```bash
# List first page of organizations (default: 25 per page)
b2c am orgs list

# List organizations with custom page size
b2c am orgs list --size 50

# Get second page of results
b2c am orgs list --page 1 --size 25

# Get all organizations (uses max page size of 5000)
b2c am orgs list --all

# Show all columns
b2c am orgs list --extended

# Show only specific columns
b2c am orgs list --columns id,name,twoFAEnabled

# Output as JSON
b2c am orgs list --json
```

#### Notes

- Page size must be between 1 and 5000
- Page number must be a non-negative integer (0-based)
- If the requested page exceeds available data, an error is returned
- The `--all` flag uses a page size of 5000 to fetch all organizations in a single request

---

### b2c am orgs get

Get detailed information about a specific organization.

#### Usage

```bash
b2c am orgs get <ORG>
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `ORG` | Organization ID or name | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |

#### Examples

```bash
# Get organization details by ID
b2c am orgs get org-123

# Get organization details by name
b2c am orgs get "My Organization"

# Output as JSON
b2c am orgs get org-123 --json
```

#### Output

When not using `--json`, displays formatted organization information including:

- **Organization Details**: ID, Name, 2FA Enabled, VaaS Enabled, SF Identity
- **Contact Users**: List of contact user IDs
- **Allowed Verifier Types**: List of allowed verifier types
- **Account Ids**: List of Salesforce account IDs
- **Password Policy**: Minimum Password Length, Length of Password History, Days Until Password Expires
- **Realms**: Comma-separated list of realm names
- **Email Domains**: List of allowed email domains
- **2FA Roles**: List of roles that require 2FA

#### Notes

- Organization can be identified by ID or name
- If organization is not found, an error is returned
- Name matching is case-sensitive and requires an exact match

---

### b2c am orgs audit

Get audit logs for an Account Manager organization.

#### Usage

```bash
b2c am orgs audit <ORG> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `ORG` | Organization ID or name | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--columns` | Comma-separated list of columns to display |
| `--extended`, `-x` | Show all available columns |
| `--json` | Output results as JSON |

#### Default Columns

- Timestamp
- Author
- Email
- Event Type
- Message

#### Examples

```bash
# Get audit logs for an organization by ID
b2c am orgs audit org-123

# Get audit logs for an organization by name
b2c am orgs audit "My Organization"

# Show all columns
b2c am orgs audit org-123 --extended

# Show only specific columns
b2c am orgs audit org-123 --columns timestamp,eventType,eventMessage

# Output as JSON
b2c am orgs audit org-123 --json
```

#### Output

Displays a table of audit log records with the selected columns. Timestamps are formatted as `MM/DD/YYYY HH:MM:SS` for readability.

#### Notes

- Organization can be identified by ID or name
- If organization is not found, an error is returned
- If no audit records are found, a message is displayed
- Timestamps are displayed in a human-readable format with zero-padding for consistent spacing

---

## API Client Management

Commands for managing Account Manager API clients (service accounts for programmatic access). API clients can be assigned roles and organizations, support client credentials or JWT authentication, and are created inactive by default. They must be disabled for at least 7 days before they can be deleted.

### b2c am clients list

List Account Manager API clients with pagination.

#### Usage

```bash
b2c am clients list [FLAGS]
```

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size`, `-s` | Number of results per page (1-4000) | `20` |
| `--columns`, `-c` | Comma-separated list of columns to display | Default columns |
| `--extended`, `-x` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

#### Default Columns

- ID
- Name
- Description
- Active
- Auth Method
- Created

#### Extended Columns

- Last Auth
- Disabled

#### Examples

```bash
b2c am clients list
b2c am clients list --size 50 --page 1
b2c am clients list --extended --json
```

#### Notes

- Created and Disabled dates are formatted as `MM/DD/YYYY HH:MM:SS` with zero-padding for equal column width (e.g. `09/10/2020 14:30:00`)
- Page size must be between 1 and 4000
- Page number must be a non-negative integer (0-based)

---

### b2c am clients get

Get details of a single Account Manager API client by ID.

#### Usage

```bash
b2c am clients get <API-CLIENT-ID> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `API-CLIENT-ID` | API client UUID | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--expand` | Comma-separated fields to expand. Valid values: `organizations`, `roles` |
| `--json` | Output results as JSON |

#### Examples

```bash
b2c am clients get <api-client-id>
b2c am clients get <api-client-id> --expand organizations,roles --json
```

#### Output

When not using `--json`, displays formatted API client information including:

- **API Client Details**: ID, Name, Description, Active, Auth Method, Password Modified, Created, Disabled
- **Redirect URLs**: List of allowed redirect URLs (if present)
- **Scopes**: OAuth scopes (if present)
- **Default Scopes**: Default OAuth scopes (if present)
- **Organizations**: Organization IDs or full objects (if expanded)
- **Roles**: Role IDs or full objects (if expanded)
- **Role Tenant Filters**: Role-to-tenant mappings (if present)
- **Version Control**: Version control identifiers (if present)

#### Notes

- Invalid `--expand` values return an error listing the valid options (`organizations`, `roles`)
- If the API client is not found, an error is returned

---

### b2c am clients create

Create a new Account Manager API client. Clients are created inactive by default and must be explicitly activated (e.g. via update).

#### Usage

```bash
b2c am clients create [FLAGS]
```

#### Required Flags

| Flag | Description |
|------|-------------|
| `--name`, `-n` | API client name (max 200 characters) |
| `--organizations`, `-o` | Comma-separated organization IDs |
| `--password`, `-p` | Password (12–128 characters) |

#### Optional Flags

| Flag | Description |
|------|-------------|
| `--description`, `-d` | Description (max 256 characters) |
| `--roles`, `-r` | Comma-separated role IDs (e.g. SALESFORCE_COMMERCE_API) |
| `--role-tenant-filter` | Role tenant filter (format: ROLE:realm_instance,realm_instance;ROLE2:... e.g. SALESFORCE_COMMERCE_API:abcd_prd) |
| `--active` | Create as active (default: false) |
| `--redirect-urls` | Comma-separated list of allowed redirect URLs for OAuth flows |
| `--scopes` | Comma-separated OAuth scopes |
| `--default-scopes` | Comma-separated default OAuth scopes |
| `--version-control` | Comma-separated version control system identifiers |
| `--token-endpoint-auth-method` | Token endpoint auth method: `private_key_jwt`, `client_secret_post`, `client_secret_basic`, or `none` |
| `--jwt-public-key` | Public key for JWT authentication (PEM or inline) |
| `--json` | Output results as JSON |

#### Examples

```bash
b2c am clients create --name my-client --organizations org-id-1 --password "SecureP@ss123"
b2c am clients create -n my-client -o org-id-1 -p "SecureP@ss123" -r SALESFORCE_COMMERCE_API
b2c am clients create -n my-client -o org-id-1 -p "SecureP@ss123" --scopes "mail,openid" --default-scopes "mail"
```

#### Notes

- Name must be non-empty and at most 200 characters; description at most 256 characters
- Password must be 12–128 characters
- Role tenant filter must match pattern: `ROLE:realm_instance(,realm_instance)*(;ROLE:...)*` (e.g. SALESFORCE_COMMERCE_API:abcd_prd)
- At least one organization ID is required

---

### b2c am clients update

Update an existing Account Manager API client. Only provided fields are updated; omitted fields keep their current values.

#### Usage

```bash
b2c am clients update <API-CLIENT-ID> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `API-CLIENT-ID` | API client UUID | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--name`, `-n` | API client name (max 200 characters) |
| `--description`, `-d` | Description (max 256 characters) |
| `--organizations`, `-o` | Comma-separated organization IDs |
| `--roles`, `-r` | Comma-separated role IDs |
| `--role-tenant-filter` | Role tenant filter (format: ROLE:realm_instance,realm_instance;ROLE2:... e.g. SALESFORCE_COMMERCE_API:abcd_prd) |
| `--active` | Set active (true/false) |
| `--redirect-urls` | Comma-separated list of allowed redirect URLs for OAuth flows |
| `--scopes` | Comma-separated OAuth scopes |
| `--default-scopes` | Comma-separated default OAuth scopes |
| `--version-control` | Comma-separated version control system identifiers |
| `--token-endpoint-auth-method` | Token endpoint auth method: `private_key_jwt`, `client_secret_post`, `client_secret_basic`, or `none` |
| `--jwt-public-key` | Public key for JWT authentication (PEM or inline) |
| `--json` | Output results as JSON |

#### Examples

```bash
b2c am clients update <api-client-id> --name new-name
b2c am clients update <api-client-id> --active
b2c am clients update <api-client-id> --scopes "mail,openid" --default-scopes "mail"
```

#### Notes

- At least one flag must be provided
- Name at most 200 characters; description at most 256 characters
- Role tenant filter must match pattern: `ROLE:realm_instance(,realm_instance)*(;ROLE:...)*`

---

### b2c am clients delete

Delete an Account Manager API client. The client must have been disabled for at least 7 days before it can be deleted.

#### Usage

```bash
b2c am clients delete <API-CLIENT-ID>
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `API-CLIENT-ID` | API client UUID | Yes |

#### Examples

```bash
b2c am clients delete <api-client-id>
```

---

### b2c am clients password

Change the password for an Account Manager API client.

#### Usage

```bash
b2c am clients password <API-CLIENT-ID> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `API-CLIENT-ID` | API client UUID | Yes |

#### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--current`, `-c` | Current password | Yes |
| `--new`, `-n` | New password (12–128 characters) | Yes |

#### Examples

```bash
b2c am clients password <api-client-id> --current "OldP@ss" --new "NewP@ss123"
```

#### Notes

- New password must be 12–128 characters
