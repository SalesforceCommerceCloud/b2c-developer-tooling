---
description: Commands for managing Account Manager organizations including listing, viewing details, and accessing audit logs.
---

# Organization Management Commands

Commands for managing organizations in Account Manager.

## Global Org Flags

These flags are available on all org commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (e.g., `account.demandware.com`) |

## Authentication

Org commands require an Account Manager API Client with OAuth authentication.

### Required Configuration

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID for Account Manager |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret for Account Manager |

### Required Roles

The API client must have the following role:
- `sfcc.accountmanager.user.manage` - Required for organization management operations

### Configuration

```bash
# Set Account Manager host
export SFCC_ACCOUNT_MANAGER_HOST=account.demandware.com

# Set OAuth credentials
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret

# List organizations
b2c org list
```

---

## b2c org list

List organizations in Account Manager with pagination support.

### Usage

```bash
b2c org list [FLAGS]
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size`, `-s` | Number of results per page (1-5000) | `25` |
| `--all`, `-a` | Return all organizations (uses max page size of 5000) | `false` |
| `--columns` | Comma-separated list of columns to display | Default columns |
| `--extended`, `-x` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

### Default Columns

- ID
- Name
- Realms
- Email Domains
- 2FA Enabled
- VaaS Enabled
- SF Identity
- Min Password Length

### Extended Columns

- 2FA Roles
- Verifier Types

### Examples

```bash
# List first page of organizations (default: 25 per page)
b2c org list

# List organizations with custom page size
b2c org list --size 50

# Get second page of results
b2c org list --page 1 --size 25

# Get all organizations (uses max page size of 5000)
b2c org list --all

# Show all columns
b2c org list --extended

# Show only specific columns
b2c org list --columns id,name,twoFAEnabled

# Output as JSON
b2c org list --json

# Using environment variables
export SFCC_ACCOUNT_MANAGER_HOST=account.demandware.com
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret
b2c org list
```

### Output

Displays a table of organizations with the selected columns. If more pages are available, an info message is displayed at the end.

### Notes

- Page size must be between 1 and 5000
- Page number must be a non-negative integer (0-based)
- If the requested page exceeds available data, an error is returned
- The `--all` flag uses a page size of 5000 to fetch all organizations in a single request

---

## b2c org get

Get detailed information about a specific organization.

### Usage

```bash
b2c org get <ORG>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `ORG` | Organization ID or name | Yes |

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |

### Examples

```bash
# Get organization details by ID
b2c org get org-123

# Get organization details by name
b2c org get "My Organization"

# Output as JSON
b2c org get org-123 --json
```

### Output

When not using `--json`, displays formatted organization information including:

- **Organization Details**: ID, Name, 2FA Enabled, VaaS Enabled, SF Identity
- **Contact Users**: List of contact user IDs
- **Allowed Verifier Types**: List of allowed verifier types
- **Account Ids**: List of Salesforce account IDs
- **Password Policy**: Minimum Password Length, Length of Password History, Days Until Password Expires
- **Realms**: Comma-separated list of realm names
- **Email Domains**: List of allowed email domains
- **2FA Roles**: List of roles that require 2FA

### Notes

- Organization can be identified by ID or name
- If organization is not found, an error is returned
- Name matching is case-sensitive and requires an exact match

---

## b2c org audit

Get audit logs for an Account Manager organization.

### Usage

```bash
b2c org audit <ORG> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `ORG` | Organization ID or name | Yes |

### Flags

| Flag | Description |
|------|-------------|
| `--columns` | Comma-separated list of columns to display |
| `--extended`, `-x` | Show all available columns |
| `--json` | Output results as JSON |

### Default Columns

- Timestamp
- Author
- Email
- Event Type
- Message

### Examples

```bash
# Get audit logs for an organization by ID
b2c org audit org-123

# Get audit logs for an organization by name
b2c org audit "My Organization"

# Show all columns
b2c org audit org-123 --extended

# Show only specific columns
b2c org audit org-123 --columns timestamp,eventType,eventMessage

# Output as JSON
b2c org audit org-123 --json
```

### Output

Displays a table of audit log records with the selected columns. Timestamps are formatted as `MM/DD/YYYY HH:MM:SS` for readability.

### Notes

- Organization can be identified by ID or name
- If organization is not found, an error is returned
- If no audit records are found, a message is displayed
- Timestamps are displayed in a human-readable format with zero-padding for consistent spacing
