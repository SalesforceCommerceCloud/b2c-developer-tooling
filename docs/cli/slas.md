# SLAS Commands

Commands for managing Shopper Login and API Security (SLAS) clients.

## Global SLAS Flags

These flags are available on all SLAS commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | (Required) SLAS tenant ID (organization ID) |

## Authentication

SLAS commands require an Account Manager API Client.

### Required Roles

| Auth Method | Role | Configured On |
|-------------|------|---------------|
| User Authentication | `SLAS Organization Administrator` | Your user account |
| Client Credentials | `Sandbox API User` | The API client |

**User Authentication**: Used when only `--client-id` is provided. Opens a browser for login. Roles must be assigned to your user account in Account Manager.

**Client Credentials**: Used when both `--client-id` and `--client-secret` are provided. Roles must be assigned to the API client.

### Tenant Scope

The API client must have tenant scope configured for the organization you wish to manage. This is configured in Account Manager under the API client's **Organizations** section.

### Configuration

```bash
# User Authentication (opens browser)
b2c slas client list --tenant-id abcd_123 --client-id xxx

# Client Credentials
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c slas client list --tenant-id abcd_123
```

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

Create a new SLAS client.

### Usage

```bash
b2c slas client create [CLIENTID] --tenant-id <TENANT_ID> --channels <CHANNELS> --redirect-uri <URI>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID (generates UUID if omitted) | No |

### Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--tenant-id` | SLAS tenant ID (organization ID) | Yes |
| `--channels` | Site IDs/channels (comma-separated) | Yes |
| `--redirect-uri` | Redirect URIs (comma-separated) | Yes |
| `--name` | Display name for the client | No |
| `--scopes` | OAuth scopes for the client (comma-separated) | No |
| `--default-scopes` | Use default shopper scopes | No |
| `--callback-uri` | Callback URIs for passwordless login | No |
| `--secret` | Client secret (generated if omitted) | No |
| `--public` | Create a public client (default is private) | No |

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
```

### Notes

- If `--secret` is not provided for a private client, one will be generated
- The generated secret is only shown once during creation
- Use `--default-scopes` for common shopper API access scopes

---

## b2c slas client get

Get details of a SLAS client.

### Usage

```bash
b2c slas client get <CLIENTID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to retrieve | Yes |

### Examples

```bash
# Get client details
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
b2c slas client update <CLIENTID> --tenant-id <TENANT_ID> [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to update | Yes |

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

### Examples

```bash
# Update client name
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
```

### Notes

- By default, list values (channels, scopes, URIs) are appended to existing values
- Use `--replace` to replace all values instead of appending
- Secret rotation takes effect immediately

---

## b2c slas client delete

Delete a SLAS client.

### Usage

```bash
b2c slas client delete <CLIENTID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `CLIENTID` | SLAS client ID to delete | Yes |

### Examples

```bash
# Delete a client
b2c slas client delete my-client-id --tenant-id abcd_123

# Output as JSON
b2c slas client delete my-client-id --tenant-id abcd_123 --json
```

### Notes

- Deletion is permanent and cannot be undone
- Active sessions using this client will be invalidated
