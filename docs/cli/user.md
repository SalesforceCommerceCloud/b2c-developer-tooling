---
description: Commands for managing Account Manager users including listing, creating, updating, and deleting users.
---

# User Management Commands

Commands for managing users in Account Manager.

## Global User Flags

These flags are available on all user commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (e.g., `account.demandware.com`) |

## Authentication

User commands require an Account Manager API Client with OAuth authentication.

### Required Configuration

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID for Account Manager |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret for Account Manager |

### Required Roles

The API client must have the following role:
- `sfcc.accountmanager.user.manage` - Required for all user management operations

### Configuration

```bash
# Set Account Manager host
export SFCC_ACCOUNT_MANAGER_HOST=account.demandware.com

# Set OAuth credentials
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret

# List users
b2c user list
```

---

## b2c user list

List users in Account Manager with pagination support.

### Usage

```bash
b2c user list [FLAGS]
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--page` | Page number (0-based) | `0` |
| `--size` | Number of results per page (1-4000) | `20` |
| `--columns` | Comma-separated list of columns to display | Default columns |
| `--extended` | Show all available columns | `false` |
| `--json` | Output results as JSON | `false` |

### Default Columns

- Email
- First Name
- Last Name
- State
- Password Expired
- 2FA Enabled
- Linked to SF
- Last Login

### Extended Columns

- Roles
- Organizations

### Examples

```bash
# List first page of users (default: 20 per page)
b2c user list

# List users with custom page size
b2c user list --size 50

# Get second page of results
b2c user list --page 1 --size 25

# Show all columns including roles and organizations
b2c user list --extended

# Show only specific columns
b2c user list --columns mail,firstName,userState

# Output as JSON
b2c user list --json

# Using environment variables
export SFCC_ACCOUNT_MANAGER_HOST=account.demandware.com
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-client-secret
b2c user list
```

### Output

Displays a table of users with the selected columns. If more pages are available, an info message is displayed at the end.

### Notes

- Page size must be between 1 and 4000
- Page number must be a non-negative integer (0-based)
- If the requested page exceeds available data, an error is returned

---

## b2c user get

Get detailed information about a specific user.

### Usage

```bash
b2c user get <LOGIN>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |

### Examples

```bash
# Get user details
b2c user get user@example.com

# Output as JSON
b2c user get user@example.com --json
```

### Output

When not using `--json`, displays formatted user information including:

- Basic Information: ID, Email, Name, State, Organization, etc.
- Organizations: List of organization IDs
- Roles: List of role IDs
- Role Tenant Filters: Role-specific tenant scope mappings

### Notes

- User is identified by email address (login)
- If user is not found, an error is returned

---

## b2c user create

Create a new user in Account Manager.

### Usage

```bash
b2c user create --org <ORG_ID> --mail <EMAIL> [FLAGS]
```

### Required Flags

| Flag | Description |
|------|-------------|
| `--org` | Organization ID where the user will be created |
| `--mail` | User email address (login) |

### Optional Flags

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

### Examples

```bash
# Create a basic user
b2c user create --org org-123 --mail user@example.com \
  --first-name John --last-name Doe

# Create a user with additional details
b2c user create --org org-123 --mail user@example.com \
  --first-name John --last-name Doe \
  --display-name "John Doe" \
  --preferred-locale en_US \
  --business-phone "+1-555-123-4567"

# Output as JSON
b2c user create --org org-123 --mail user@example.com \
  --first-name John --last-name Doe --json
```

### Notes

- User will be created in INITIAL state
- User must be assigned roles separately using `b2c role grant`
- The user's primary organization is set to the specified `--org`

---

## b2c user update

Update an existing user's information.

### Usage

```bash
b2c user update <LOGIN> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

### Flags

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

### Examples

```bash
# Update user's first name
b2c user update user@example.com --first-name Jane

# Update multiple fields
b2c user update user@example.com \
  --first-name Jane \
  --last-name Smith \
  --display-name "Jane Smith"

# Output as JSON
b2c user update user@example.com --first-name Jane --json
```

### Notes

- At least one field must be provided to update
- Only specified fields will be updated; other fields remain unchanged
- If user is not found, an error is returned

---

## b2c user reset

Reset a user to INITIAL state, clearing password expiration and allowing password reset.

### Usage

```bash
b2c user reset <LOGIN>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

### Examples

```bash
# Reset user to INITIAL state
b2c user reset user@example.com
```

### Notes

- Resets the user's state to INITIAL
- Clears password expiration timestamp
- User will need to set a new password on next login

---

## b2c user delete

Delete (disable) a user in Account Manager.

### Usage

```bash
b2c user delete <LOGIN> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `LOGIN` | User email address | Yes |

### Flags

| Flag | Description |
|------|-------------|
| `--purge` | Permanently delete the user (hard delete). User must be in DELETED state first. |

### Examples

```bash
# Soft delete (disable) a user
b2c user delete user@example.com

# Permanently delete a user (must be in DELETED state first)
b2c user delete user@example.com --purge
```

### Notes

- By default, this performs a soft delete (disables the user)
- Soft delete sets the user state to DELETED
- Use `--purge` for permanent deletion (hard delete)
- Purging requires the user to already be in DELETED state
- Deletion is permanent and cannot be undone
