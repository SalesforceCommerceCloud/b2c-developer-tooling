---
description: Commands for creating, managing, starting, stopping, and deleting On-Demand Sandboxes (ODS) for development.
---

# ODS Commands

Commands for managing On-Demand Sandboxes (ODS).

## Sandbox ID Formats

Commands that operate on a specific sandbox (`get`, `start`, `stop`, `restart`, `delete`) accept two ID formats:

| Format | Example | Description |
|--------|---------|-------------|
| UUID | `abc12345-1234-1234-1234-abc123456789` | Full sandbox UUID |
| Friendly ID | `zzzv-123` or `zzzv_123` | Realm-instance format |

The friendly ID format uses the 4-character realm code followed by a dash (`-`) or underscore (`_`) and the instance identifier. When using a friendly ID, the CLI automatically looks up the corresponding sandbox UUID.

```bash
# These are equivalent (assuming zzzv-123 resolves to the UUID)
b2c ods get abc12345-1234-1234-1234-abc123456789
b2c ods get zzzv-123
```

## Global ODS Flags

These flags are available on all ODS commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--sandbox-api-host` | `SFCC_SANDBOX_API_HOST` | ODS API hostname (default: admin.dx.commercecloud.salesforce.com) |

## Authentication

ODS commands require an Account Manager API Client.

### Required Roles

| Auth Method | Role | Configured On |
|-------------|------|---------------|
| User Authentication | `Sandbox API User` | Your user account |
| Client Credentials | `Sandbox API User` | The API client |

**User Authentication**: Used when only `--client-id` is provided. Opens a browser for login. The `Sandbox API User` role must be assigned to your user account in Account Manager.

**Client Credentials**: Used when both `--client-id` and `--client-secret` are provided. The `Sandbox API User` role must be assigned to the API client.

### Tenant Filter

The API client's roles must have a tenant filter configured for the realm(s) you wish to manage. In Account Manager, under each role (e.g., `Sandbox API User`), add the realm IDs you need to access to the **Tenant Filter**.

### Configuration

```bash
# User Authentication (opens browser)
b2c ods list --client-id xxx

# Client Credentials
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c ods list
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#account-manager-api-client).

---

## b2c ods list

List all on-demand sandboxes accessible to your account.

### Usage

```bash
b2c ods list
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--realm`, `-r` | Filter by realm ID (four-letter ID) | |
| `--filter-params` | Raw filter parameters (e.g., "realm=abcd&state=started") | |
| `--show-deleted` | Include deleted sandboxes in the list | `false` |
| `--columns`, `-c` | Columns to display (comma-separated) | |
| `--extended`, `-x` | Show all columns including extended fields | `false` |

### Available Columns

`realm`, `instance`, `state`, `profile`, `created`, `eol`, `id`, `hostname`, `createdBy`, `autoScheduled`

### Examples

```bash
# List all sandboxes
b2c ods list

# Filter by realm
b2c ods list --realm abcd

# Filter by state and realm
b2c ods list --filter-params "realm=abcd&state=started"

# Show extended information
b2c ods list --extended

# Custom columns
b2c ods list --columns realm,instance,state,hostname

# Output as JSON
b2c ods list --json
```

### Output

```
Realm  Instance  State    Profile  Created              EOL
──────────────────────────────────────────────────────────────────────────
abcd   001       started  medium   12/20/2024, 10:00 AM 12/21/2024, 10:00 AM
abcd   002       stopped  large    12/19/2024, 2:30 PM  12/20/2024, 2:30 PM
```

---

## b2c ods create

Create a new on-demand sandbox.

### Usage

```bash
b2c ods create --realm <REALM>
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--realm`, `-r` | (Required) Realm ID (four-letter ID) | |
| `--ttl` | Time to live in hours (0 for infinite) | `24` |
| `--profile` | Resource profile (medium, large, xlarge, xxlarge) | `medium` |
| `--auto-scheduled` | Enable automatic start/stop scheduling | `false` |
| `--wait`, `-w` | Wait for sandbox to reach started or failed state | `false` |
| `--poll-interval` | Polling interval in seconds when using --wait | `10` |
| `--timeout` | Maximum wait time in seconds (0 for no timeout) | `600` |
| `--set-permissions` | Automatically set OCAPI and WebDAV permissions | |

### Examples

```bash
# Create a sandbox with default settings
b2c ods create --realm abcd

# Create with extended TTL
b2c ods create --realm abcd --ttl 48

# Create with larger resources
b2c ods create --realm abcd --profile large

# Create and wait for it to be ready
b2c ods create --realm abcd --wait

# Create with auto-scheduling enabled
b2c ods create --realm abcd --auto-scheduled

# Create and automatically set permissions for the client
b2c ods create --realm abcd --set-permissions

# Output as JSON
b2c ods create --realm abcd --json
```

### Notes

- Sandbox creation can take several minutes
- Use `--wait` to block until the sandbox is ready
- The `--set-permissions` flag configures OCAPI and WebDAV access for the client ID used to create the sandbox

---

## b2c ods get

Get details of a specific sandbox.

### Usage

```bash
b2c ods get <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Get sandbox details using UUID
b2c ods get abc12345-1234-1234-1234-abc123456789

# Get sandbox details using friendly ID
b2c ods get zzzv-123

# Output as JSON
b2c ods get zzzv_123 --json
```

### Output

Displays detailed information about the sandbox including:

- Sandbox ID and instance
- Realm and hostname
- State and resource profile
- Creation time and end-of-life
- Links to BM and storefront

---

## b2c ods info

Display ODS user and system information.

### Usage

```bash
b2c ods info
```

### Examples

```bash
# Get ODS info
b2c ods info

# Output as JSON
b2c ods info --json
```

### Output

Displays information about:

- Authenticated user
- Available realms
- System status and limits

---

## b2c ods start

Start a stopped on-demand sandbox.

### Usage

```bash
b2c ods start <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Start a sandbox using UUID
b2c ods start abc12345-1234-1234-1234-abc123456789

# Start a sandbox using friendly ID
b2c ods start zzzv-123

# Output as JSON
b2c ods start zzzv_123 --json
```

---

## b2c ods stop

Stop a running on-demand sandbox.

### Usage

```bash
b2c ods stop <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Stop a sandbox using UUID
b2c ods stop abc12345-1234-1234-1234-abc123456789

# Stop a sandbox using friendly ID
b2c ods stop zzzv-123

# Output as JSON
b2c ods stop zzzv_123 --json
```

---

## b2c ods restart

Restart an on-demand sandbox.

### Usage

```bash
b2c ods restart <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Restart a sandbox using UUID
b2c ods restart abc12345-1234-1234-1234-abc123456789

# Restart a sandbox using friendly ID
b2c ods restart zzzv-123

# Output as JSON
b2c ods restart zzzv_123 --json
```

---

## b2c ods delete

Delete an on-demand sandbox.

### Usage

```bash
b2c ods delete <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--force`, `-f` | Skip confirmation prompt | `false` |

### Examples

```bash
# Delete a sandbox using UUID (with confirmation prompt)
b2c ods delete abc12345-1234-1234-1234-abc123456789

# Delete a sandbox using friendly ID
b2c ods delete zzzv-123

# Delete without confirmation
b2c ods delete zzzv_123 --force
```

### Notes

- The command will prompt for confirmation unless `--force` is used
- Deleted sandboxes cannot be recovered
