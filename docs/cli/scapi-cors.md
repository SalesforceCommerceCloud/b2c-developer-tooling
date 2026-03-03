# SCAPI CORS Commands

Commands for managing Cross-Origin Resource Sharing (CORS) preferences for B2C Commerce sites.

CORS preferences define which domains are permitted to access a site's APIs, creating exceptions to the same-origin policy that browsers enforce.

## Global SCAPI CORS Flags

These flags are available on all SCAPI CORS commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | (Required) Organization/tenant ID |
| `--short-code` | `SFCC_SHORTCODE` | SCAPI short code |
| `--site-id`, `-s` | `SFCC_SITE_ID` | (Required) Site ID to manage CORS for |

## Authentication

SCAPI CORS commands require an Account Manager API Client with OAuth credentials. The same client ID used for OAuth authentication is also the subject of the CORS configuration — per the CORS Preferences API spec, you configure CORS origins for the client you authenticate with.

### Required Scopes

The following scopes are automatically requested by the CLI:

| Scope | Description | Commands |
|-------|-------------|---------|
| `sfcc.cors-preferences.rw` | Read-write access to CORS Preferences API | `get`, `set`, `delete` |
| `SALESFORCE_COMMERCE_API:<tenant_id>` | Tenant-specific access scope | all |

### Configuration

```bash
# Set credentials via environment variables
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78
export SFCC_SITE_ID=RefArch

# Or provide via flags
b2c scapi cors get --client-id my-client-id --client-secret my-secret --tenant-id zzxy_prd --site-id RefArch
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#scapi-authentication).

---

## b2c scapi cors get

Get all CORS preferences configured for a site.

### Usage

```bash
b2c scapi cors get --tenant-id <TENANT_ID> --site-id <SITE_ID>
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--tenant-id` | | (Required) Organization/tenant ID | |
| `--site-id` | `-s` | (Required) Site ID (1–32 characters) | `SFCC_SITE_ID` |
| `--json` | | Output results as JSON | `false` |

### Examples

```bash
# Get CORS preferences for a site
b2c scapi cors get --tenant-id zzxy_prd --site-id RefArch

# Output as JSON
b2c scapi cors get --tenant-id zzxy_prd --site-id RefArch --json
```

### Output

Default table output:

```
Found 1 client configuration(s) for site RefArch:

Client ID                              Allowed Origins
──────────────────────────────────────────────────────────────────
abc123-0a37-4edb-a8e6-77f0aa72706d    http://foo.com, https://bar.com
```

If no CORS preferences are configured:

```
No CORS preferences configured for site RefArch.
```

JSON output (`--json`):

```json
{
  "siteId": "RefArch",
  "corsClientPreferences": [
    {
      "clientId": "abc123-0a37-4edb-a8e6-77f0aa72706d",
      "origins": ["http://foo.com", "https://bar.com"]
    }
  ]
}
```

---

## b2c scapi cors set

Create or replace all CORS preferences for a site. This is a full replacement — all existing preferences for the site are overwritten with the provided configuration.

### Usage

```bash
b2c scapi cors set --tenant-id <TENANT_ID> --site-id <SITE_ID> --client-id <CLIENT_ID> [--origins <ORIGINS>]
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--tenant-id` | | (Required) Organization/tenant ID | |
| `--site-id` | `-s` | (Required) Site ID (1–32 characters) | `SFCC_SITE_ID` |
| `--client-id` | | (Required) Account Manager client ID to configure CORS for | `SFCC_CLIENT_ID` |
| `--origins` | | Comma-separated list of allowed origins | `""` (known domains only) |
| `--json` | | Output results as JSON | `false` |

### Origin Format

Origins must follow the format `<scheme>://<domain>.<tld>` — no port numbers or paths are allowed:

| Origin | Valid |
|--------|-------|
| `http://foo.com` | ✅ |
| `https://bar.baz.com` | ✅ |
| `myapp://example.com` | ✅ |
| `http://foo.com:8080` | ❌ Port not allowed |
| `http://foo.com/path` | ❌ Path not allowed |
| `http://localhost` | ❌ Bare hostname (no TLD) |

An empty `--origins ""` enables CORS for the client without custom origins — all known domain names and aliases for the site are automatically included.

### Examples

```bash
# Set CORS with specific allowed origins
b2c scapi cors set --tenant-id zzxy_prd --site-id RefArch --client-id my-client-id --origins http://foo.com,https://bar.com

# Enable CORS for known domains only (no custom origins)
b2c scapi cors set --tenant-id zzxy_prd --site-id RefArch --client-id my-client-id --origins ""

# Output result as JSON
b2c scapi cors set --tenant-id zzxy_prd --site-id RefArch --client-id my-client-id --origins http://foo.com --json
```

### Output

```
CORS preferences for site RefArch updated successfully.
```

JSON output (`--json`):

```json
{
  "siteId": "RefArch",
  "corsClientPreferences": [
    {
      "clientId": "my-client-id",
      "origins": ["http://foo.com", "https://bar.com"]
    }
  ]
}
```

---

## b2c scapi cors delete

Delete all CORS preferences for a site. After deletion, CORS will not be active for the site until new preferences are configured.

### Usage

```bash
b2c scapi cors delete --tenant-id <TENANT_ID> --site-id <SITE_ID>
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--tenant-id` | | (Required) Organization/tenant ID | |
| `--site-id` | `-s` | (Required) Site ID (1–32 characters) | `SFCC_SITE_ID` |
| `--json` | | Output results as JSON | `false` |

### Examples

```bash
# Delete all CORS preferences for a site
b2c scapi cors delete --tenant-id zzxy_prd --site-id RefArch

# Output as JSON
b2c scapi cors delete --tenant-id zzxy_prd --site-id RefArch --json
```

### Output

```
CORS preferences for site RefArch deleted successfully.
```

JSON output (`--json`):

```json
{
  "siteId": "RefArch",
  "deleted": true
}
```
