---
description: Commands for creating, managing, starting, stopping, and deleting On-Demand Sandboxes for development.
---

# Sandbox Commands

Commands for managing On-Demand Sandboxes.

::: tip Alias
These commands were previously available as `b2c ods <command>`. The `ods` prefix still works as a backward-compatible alias.
:::

## Sandbox ID Formats

Commands that operate on a specific sandbox (`get`, `start`, `stop`, `restart`, `delete`) accept two ID formats:

| Format | Example | Description |
|--------|---------|-------------|
| UUID | `abc12345-1234-1234-1234-abc123456789` | Full sandbox UUID |
| Realm-instance | `zzzv-123` or `zzzv_123` | Realm-instance format |

The realm-instance format uses the 4-character realm code followed by a dash (`-`) or underscore (`_`) and the instance identifier. When using the realm-instance format, the CLI automatically looks up the corresponding sandbox UUID.

```bash
# These are equivalent (assuming zzzv-123 resolves to the UUID)
b2c sandbox get abc12345-1234-1234-1234-abc123456789
b2c sandbox get zzzv-123
```

## Global Sandbox Flags

These flags are available on all sandbox commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--sandbox-api-host` | `SFCC_SANDBOX_API_HOST` | Sandbox API hostname (default: admin.dx.commercecloud.salesforce.com) |

## Authentication

Sandbox commands work out of the box using the CLI's built-in public client, which authenticates via browser login (implicit flow). No API client configuration is required for interactive use.

For automation or CI/CD, you can provide your own API client credentials.

### Required Roles

| Auth Method | Role | Configured On |
|-------------|------|---------------|
| Built-in client (default) | `Sandbox API User` | Your user account |
| User Authentication | `Sandbox API User` | Your user account |
| Client Credentials | `Sandbox API User` | The API client |

The `Sandbox API User` role must have a **tenant filter** configured for the realm(s) you wish to manage.

### Configuration

```bash
# No configuration needed — opens browser for login
b2c sandbox list

# Or provide your own client ID
b2c sandbox list --client-id xxx

# Client Credentials (for automation)
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c sandbox list
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#account-manager-api-client).

---

## b2c sandbox list

List all on-demand sandboxes accessible to your account.

### Usage

```bash
b2c sandbox list
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
b2c sandbox list

# Filter by realm
b2c sandbox list --realm abcd

# Filter by state and realm
b2c sandbox list --filter-params "realm=abcd&state=started"

# Show extended information
b2c sandbox list --extended

# Custom columns
b2c sandbox list --columns realm,instance,state,hostname

# Output as JSON
b2c sandbox list --json
```

### Output

```
Realm  Instance  State    Profile  Created     EOL
──────────────────────────────────────────────────────────────────────────
abcd   001       started  medium   2024-12-20  2024-12-21
abcd   002       stopped  large    2024-12-19  2024-12-20 22:30
```

The `EOL` column displays `YYYY-MM-DD` normally. When a sandbox expires within 24 hours (or is already expired), the time is also shown as `YYYY-MM-DD HH:mm` (UTC).

---

## b2c sandbox create

Create a new on-demand sandbox.

### Usage

```bash
b2c sandbox create --realm <REALM>
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
| `--set-permissions` / `--no-set-permissions` | Automatically set OCAPI and WebDAV permissions | `true` |
| `--permissions-client-id` | Client ID to use for default OCAPI/WebDAV permissions (defaults to auth client ID) | |
| `--ocapi-settings` | Custom OCAPI settings JSON array (replaces defaults) | |
| `--webdav-settings` | Custom WebDAV settings JSON array (replaces defaults) | |
| `--start-scheduler` | Start schedule JSON | |
| `--stop-scheduler` | Stop schedule JSON | |

### Examples

```bash
# Create a sandbox with default settings
b2c sandbox create --realm abcd

# Create with extended TTL
b2c sandbox create --realm abcd --ttl 48

# Create with larger resources
b2c sandbox create --realm abcd --profile large

# Create and wait for it to be ready
b2c sandbox create --realm abcd --wait

# Create with auto-scheduling enabled
b2c sandbox create --realm abcd --auto-scheduled

# Create without automatic permissions
b2c sandbox create --realm abcd --no-set-permissions

# Use a different client ID for permissions
b2c sandbox create --realm abcd --permissions-client-id my-other-client

# Custom OCAPI settings (replaces defaults)
b2c sandbox create --realm abcd --ocapi-settings '[{"client_id":"my-client","resources":[{"resource_id":"/code_versions","methods":["get"]}]}]'

# Custom start/stop scheduler
b2c sandbox create --realm abcd --start-scheduler '{"weekdays":["MONDAY","TUESDAY"],"time":"08:00:00Z"}' --stop-scheduler '{"weekdays":["MONDAY","TUESDAY"],"time":"19:00:00Z"}'

# Output as JSON
b2c sandbox create --realm abcd --json
```

### Notes

- Sandbox creation can take several minutes
- Use `--wait` to block until the sandbox is ready
- By default, OCAPI and WebDAV permissions are set for the auth client ID. Use `--permissions-client-id` to override the client ID, or `--ocapi-settings`/`--webdav-settings` to provide fully custom settings
- The `--start-scheduler` and `--stop-scheduler` flags accept JSON objects with `weekdays` and `time` fields

---

## b2c sandbox get

Get details of a specific sandbox.

### Usage

```bash
b2c sandbox get <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Get sandbox details using UUID
b2c sandbox get abc12345-1234-1234-1234-abc123456789

# Get sandbox details using realm-instance format
b2c sandbox get zzzv-123

# Output as JSON
b2c sandbox get zzzv_123 --json
```

### Output

Displays detailed information about the sandbox including:

- Sandbox ID and instance
- Realm and hostname
- State and resource profile
- Creation time and end-of-life
- Links to BM and storefront

---

## b2c sandbox info

Display sandbox user and system information.

### Usage

```bash
b2c sandbox info
```

### Examples

```bash
# Get sandbox info
b2c sandbox info

# Output as JSON
b2c sandbox info --json
```

### Output

Displays information about:

- Authenticated user
- Available realms
- System status and limits

---

## b2c sandbox start

Start a stopped on-demand sandbox.

### Usage

```bash
b2c sandbox start <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Start a sandbox using UUID
b2c sandbox start abc12345-1234-1234-1234-abc123456789

# Start a sandbox using realm-instance format
b2c sandbox start zzzv-123

# Output as JSON
b2c sandbox start zzzv_123 --json
```

---

## b2c sandbox stop

Stop a running on-demand sandbox.

### Usage

```bash
b2c sandbox stop <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Stop a sandbox using UUID
b2c sandbox stop abc12345-1234-1234-1234-abc123456789

# Stop a sandbox using realm-instance format
b2c sandbox stop zzzv-123

# Output as JSON
b2c sandbox stop zzzv_123 --json
```

---

## b2c sandbox restart

Restart an on-demand sandbox.

### Usage

```bash
b2c sandbox restart <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Examples

```bash
# Restart a sandbox using UUID
b2c sandbox restart abc12345-1234-1234-1234-abc123456789

# Restart a sandbox using realm-instance format
b2c sandbox restart zzzv-123

# Output as JSON
b2c sandbox restart zzzv_123 --json
```

---

## b2c sandbox delete

Delete an on-demand sandbox.

### Usage

```bash
b2c sandbox delete <SANDBOXID>
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
b2c sandbox delete abc12345-1234-1234-1234-abc123456789

# Delete a sandbox using realm-instance format
b2c sandbox delete zzzv-123

# Delete without confirmation
b2c sandbox delete zzzv_123 --force
```

### Notes

- The command will prompt for confirmation unless `--force` is used
- Deleted sandboxes cannot be recovered

---

## b2c sandbox reset

Reset an on-demand sandbox to a clean state. This clears **all data and code** in the sandbox but preserves its configuration (realm, profile, schedulers, etc.).

### Usage

```bash
b2c sandbox reset <SANDBOXID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--wait`, `-w` | Wait for the sandbox to reach `started` state after reset | `false` |
| `--poll-interval` | Polling interval in seconds when using `--wait` | `10` |
| `--timeout` | Maximum time to wait in seconds when using `--wait` (`0` for no timeout) | `600` |
| `--force`, `-f` | Skip confirmation prompt | `false` |

### Examples

```bash
# Trigger a reset and return immediately
b2c sandbox reset zzzv-123

# Reset and wait for the sandbox to return to started state
b2c sandbox reset zzzv-123 --wait

# Reset with a custom polling interval and timeout
b2c sandbox reset zzzv-123 --wait --poll-interval 15 --timeout 900

# Reset without confirmation
b2c sandbox reset zzzv-123 --force

# Output operation details as JSON
b2c sandbox reset zzzv-123 --json
```

### Notes

- Reset is **destructive**: it permanently removes all data and code in the sandbox.
- When `--wait` is used, the command periodically polls the sandbox and logs state transitions as `[<elapsed>s] State: <state>` until it reaches `started` or the timeout is hit.

---

## b2c sandbox usage

Show usage information for a specific sandbox over a date range.

### Usage

```bash
b2c sandbox usage <SANDBOXID> [--from <DATE>] [--to <DATE>]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

### Flags

| Flag | Description |
|------|-------------|
| `--from` | Start date for usage data (ISO 8601, e.g., `2024-01-01`) |
| `--to` | End date for usage data (ISO 8601, e.g., `2024-01-31`) |

If `--from` / `--to` are omitted, the API will use its own defaults (typically a recent window).

### Examples

```bash
# Show recent usage for a sandbox
b2c sandbox usage zzzz-001

# Show usage for a specific period
b2c sandbox usage zzzz-001 --from 2024-01-01 --to 2024-01-31

# Get raw usage response as JSON (includes detailed fields)
b2c sandbox usage zzzz-001 --from 2024-01-01 --to 2024-01-31 --json
```

### Output

When not using `--json`, the command prints a concise summary:

- Total sandbox seconds
- Minutes up / minutes down
- Minutes up by profile (if available)

If detailed usage data is present (granular history, profiles, etc.), the command prints a hint to re-run with `--json` to inspect the full structure. If no usage data is returned for the requested period, it prints a friendly message instead of failing.

---

## Sandbox Aliases

Sandbox aliases let you access a sandbox via a custom hostname instead of the default instance hostname.

Alias commands are available both under the `sandbox` topic and the legacy `ods` aliases:

- `b2c sandbox alias create` (`b2c ods alias:create`)
- `b2c sandbox alias list` (`b2c ods alias:list`)
- `b2c sandbox alias delete` (`b2c ods alias:delete`)

### b2c sandbox alias create

Create a hostname alias for a sandbox.

#### Usage

```bash
b2c sandbox alias create <SANDBOXID> <HOSTNAME> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |
| `HOSTNAME` | Hostname alias to register (e.g., `my-store.example.com`) | Yes |

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--unique`, `-u` | Make the alias unique (required for Let’s Encrypt certificates) | `false` |
| `--letsencrypt` | Request a Let’s Encrypt certificate (requires `--unique`) | `false` |
| `--no-open` | Do not open the registration URL in a browser for non‑unique aliases | `false` |

#### Examples

```bash
# Simple alias
b2c sandbox alias create zzzv-123 my-store.example.com

# Unique alias (suitable for TLS)
b2c sandbox alias create zzzv-123 secure-store.example.com --unique

# Unique alias with Let’s Encrypt certificate
b2c sandbox alias create zzzv-123 secure-store.example.com --unique --letsencrypt

# Create alias but handle registration manually
b2c sandbox alias create zzzv-123 my-store.example.com --no-open

# Output alias details as JSON
b2c sandbox alias create zzzv-123 my-store.example.com --json
```

#### Behavior

- For **unique** aliases, the API may return a DNS TXT record that must be added to your DNS provider before the alias becomes active.
- For **non‑unique** aliases, the API returns a registration URL; the CLI opens this URL in a browser by default (unless `--no-open` is set) to complete registration.

### b2c sandbox alias list

List or inspect aliases for a sandbox.

#### Usage

```bash
b2c sandbox alias list <SANDBOXID> [--alias-id <ALIASID>]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--alias-id` | Specific alias ID to retrieve; if omitted, lists all aliases |

#### Examples

```bash
# List all aliases for a sandbox
b2c sandbox alias list zzzv-123

# Get details for a single alias
b2c sandbox alias list zzzv-123 --alias-id some-alias-uuid

# Output as JSON
b2c sandbox alias list zzzv-123 --json
```

When listing multiple aliases without `--json`, the command prints a table with:

- Alias ID
- Hostname
- Status
- Whether the alias is unique
- DNS verification record (if any)

### b2c sandbox alias delete

Delete a sandbox alias.

#### Usage

```bash
b2c sandbox alias delete <SANDBOXID> <ALIASID> [--force]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SANDBOXID` | Sandbox ID (UUID or realm-instance, e.g., `zzzv-123`) | Yes |
| `ALIASID` | Alias ID to delete | Yes |

#### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--force`, `-f` | Skip confirmation prompt | `false` |

#### Examples

```bash
# Delete an alias with confirmation
b2c sandbox alias delete zzzv-123 alias-uuid-here

# Delete an alias without confirmation
b2c sandbox alias delete zzzv-123 alias-uuid-here --force

# Delete and get structured result
b2c sandbox alias delete zzzv-123 alias-uuid-here --json
```

---

## Realm-Level Commands

Realm commands operate at the **realm** level rather than on an individual sandbox. They are available as both `realm` topic commands and as `sandbox realm` subcommands:

- `b2c realm list` (`b2c sandbox realm list`)
- `b2c realm get` (`b2c sandbox realm get`)
- `b2c realm update` (`b2c sandbox realm update`)
- `b2c realm usage` (`b2c sandbox realm usage`)

### Required Access for Realm Commands

To run `b2c realm` commands, your user or API client must have **realm‑level access** in Account Manager (typically a role ending in `_sbx` for sandbox management).

### b2c realm list

List realms eligible for sandbox management.

#### Usage

```bash
b2c realm list [REALM]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `REALM` | Specific realm ID (four-letter ID) to get details for | No |

#### Examples

```bash
# List all realms you can manage
b2c realm list

# List a single realm
b2c realm list zzzz

# JSON output
b2c realm list --json
```

When `REALM` is omitted, the command discovers realms from the `/me` endpoint and then fetches configuration for each.

### b2c realm get

Get detailed information about a specific realm, including configuration.

#### Usage

```bash
b2c realm get <REALM>
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `REALM` | Realm ID (four-letter ID) | Yes |

#### Examples

```bash
# Get realm details
b2c realm get zzzz

# JSON output (includes configuration and account details when available)
b2c realm get zzzz --json
```

#### Output

The command prints:

- Realm ID, name, and enabled status
- Realm configuration, including:
  - Notification emails (if configured)
  - Whether limits are enabled
  - Total number of sandboxes
  - Max sandbox TTL (displays `0` when TTL is effectively unlimited)
  - Default sandbox TTL
  - Whether local users are allowed
  - Start/stop scheduler definitions (as JSON) when present

### b2c realm update

Update realm‑level sandbox configuration for TTL and start/stop schedulers.

#### Usage

```bash
b2c realm update <REALM> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `REALM` | Realm ID (four-letter ID) to update | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--max-sandbox-ttl` | Maximum sandbox TTL in hours (`0` for unlimited, subject to quotas) |
| `--default-sandbox-ttl` | Default sandbox TTL in hours when no TTL is specified at creation |
| `--start-scheduler` | Start schedule JSON for sandboxes in this realm (use `"null"` to remove) |
| `--stop-scheduler` | Stop schedule JSON for sandboxes in this realm (use `"null"` to remove) |

The scheduler flags expect a JSON value or the literal string `"null"`:

```bash
--start-scheduler '{"weekdays":["MONDAY"],"time":"08:00:00Z"}'
--stop-scheduler "null"    # remove existing stop scheduler
```

#### Examples

```bash
# Set max TTL to unlimited and default TTL to 24 hours
b2c realm update zzzz --max-sandbox-ttl 0 --default-sandbox-ttl 24

# Configure weekday start/stop schedules
b2c realm update zzzz \
  --start-scheduler '{"weekdays":["MONDAY","TUESDAY"],"time":"08:00:00Z"}' \
  --stop-scheduler '{"weekdays":["MONDAY","TUESDAY"],"time":"19:00:00Z"}'

# Remove an existing stop scheduler
b2c realm update zzzz --stop-scheduler "null"
```

If no update flags are provided, the command fails with a helpful error explaining which flags can be used.

### b2c realm usage

Show usage information for a realm across all sandboxes in that realm.

#### Usage

```bash
b2c realm usage <REALM> [FLAGS]
```

#### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `REALM` | Realm ID (four-letter ID) | Yes |

#### Flags

| Flag | Description |
|------|-------------|
| `--from` | Earliest date to include in usage (ISO 8601; API defaults to ~30 days ago if omitted) |
| `--to` | Latest date to include in usage (ISO 8601; API defaults to today if omitted) |
| `--granularity` | Data granularity (`daily`, `weekly`, or `monthly`) |
| `--detailed-report` | Include detailed usage information in the response |

#### Examples

```bash
# Realm usage for a recent window
b2c realm usage zzzz

# Realm usage for a specific range
b2c realm usage zzzz --from 2024-01-01 --to 2024-01-31

# Daily granularity with full JSON response
b2c realm usage zzzz --granularity daily --detailed-report --json
```

When not using `--json`, the command prints a summary including:

- Active / created / deleted sandbox counts
- Minutes up / minutes down
- Sandbox seconds
- Minutes up by profile (if present)

If detailed usage is available, it prints a hint to re-run with `--json` for the full structure. If no usage data is returned for the requested period, it prints a friendly message instead of failing.

