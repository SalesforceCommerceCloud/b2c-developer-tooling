---
description: Commands for reading, updating, and searching SCAPI custom global and site preferences.
---

# Preferences

Commands for managing SCAPI custom global and site preferences via the [Configuration Preferences API](https://developer.salesforce.com/docs/commerce/commerce-api/references/preferences).

The CLI exposes two command groups:

- `b2c scapi preferences global` — read and update custom preferences at the **organization** (global) level.
- `b2c scapi preferences site` — read, update, and search custom preferences at the **site** level, including a `preference` subgroup for operating on a single attribute.

## Global Preferences Flags

These flags are available on every preferences command:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--tenant-id` | `SFCC_TENANT_ID` | (Required) Organization/tenant ID. The CLI accepts the bare ID (e.g. `zzxy_prd`), the prefixed form (`f_ecom_zzxy_prd`), the dashed variant, or a hostname; it normalizes input before sending to SCAPI. |
| `--short-code` | `SFCC_SHORTCODE` | (Required) SCAPI short code |

::: tip Flag naming: `--mask-password` vs `--mask-passwords`
This is intentional and follows the SCAPI Preferences OpenAPI spec, which uses two different parameter names:
- **`--mask-password`** (singular) — on `preferences global list` and `preferences site list` (maps to the `maskPassword` query parameter)
- **`--mask-passwords`** (plural) — on every other preferences command (maps to `maskPasswords`)
:::

## Authentication

Preferences commands require an Account Manager API Client with OAuth credentials.

### Required Scopes

The CLI automatically requests the appropriate scopes per operation:

| Scope | When requested |
|-------|----------------|
| `sfcc.preferences` | Read operations (`list`, `get`, `search`) |
| `sfcc.preferences.rw` | Write operations (`update`) |
| `SALESFORCE_COMMERCE_API:<tenant_id>` | Always (tenant-specific access) |

### Configuration

```bash
# Set credentials via environment variables
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# Or provide via flags
b2c scapi preferences global list --client-id xxx --client-secret xxx --tenant-id zzxy_prd
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#scapi-authentication).

## Instance Type

Read and update commands take an `instance-type` argument that targets a specific environment within the organization:

| Value | Meaning |
|-------|---------|
| `staging` | Staging instance |
| `development` | Development instance |
| `sandbox` | Sandbox instance |
| `production` | Production instance |
| `current` | The instance handling the request (resolved server-side) |

::: info
The OpenAPI schema enum lists only `staging`, `development`, `sandbox`, and `production`. The string `current` is documented in the SCAPI operation descriptions and is accepted by the service, but it is not part of the formal enum — strict OAS validators may reject it.
:::

## Custom Attributes

Custom preference attributes use the `c_` prefix (for example `c_myAttr`). When supplying request bodies via `--file` or `--body`, include the `c_` prefix on each attribute key.

---

## b2c scapi preferences global list {#list-global}

List custom preferences for the organization (global level).

### Usage

```bash
b2c scapi preferences global list --tenant-id <TENANT_ID>
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--limit` | `-l` | Maximum number of results (1–200) | `200` |
| `--offset` | `-o` | Result offset for pagination | `0` |
| `--mask-password` / `--no-mask-password` | | Mask values of type password | `false` |
| `--columns` | `-c` | Columns to display (comma-separated: `id`, `value`, `groupId`) | `id,value` |
| `--extended` | `-x` | Show all columns including extended fields (`groupId`) | `false` |
| `--json` | | Output as JSON | `false` |

### Examples

```bash
# List global custom preferences
b2c scapi preferences global list --tenant-id zzxy_prd

# Page through results
b2c scapi preferences global list --tenant-id zzxy_prd --limit 50 --offset 100

# Include the group ID column
b2c scapi preferences global list --tenant-id zzxy_prd --extended

# JSON output
b2c scapi preferences global list --tenant-id zzxy_prd --json
```

---

## b2c scapi preferences global get {#get-global}

Read all custom preferences inside a global preference group for a given instance type.

### Usage

```bash
b2c scapi preferences global get <GROUP_ID> <INSTANCE_TYPE> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--mask-passwords` / `--no-mask-passwords` | Mask values of type password | `false` |
| `--expand` | Set to `sites` to also return site-specific values | |
| `--json` | Output as JSON | `false` |

### Examples

```bash
# Read a global preference group from the staging instance
b2c scapi preferences global get CustomGroupId staging --tenant-id zzxy_prd

# Use the current instance and expand site-specific values
b2c scapi preferences global get CustomGroupId current --tenant-id zzxy_prd --expand sites
```

---

## b2c scapi preferences global update {#update-global}

Update custom preferences inside a global preference group for a given instance type.

### Usage

```bash
b2c scapi preferences global update <GROUP_ID> <INSTANCE_TYPE> (--file <PATH> | --body <JSON>) --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--file` | `-f` | JSON file with preferences body. Mutually exclusive with `--body`. |
| `--body` | | Inline JSON body with preferences. Mutually exclusive with `--file`. |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password in the response (default `false`) |
| `--json` | | Output as JSON |

Either `--file` or `--body` is required. Custom attributes use the `c_` prefix.

### Body Shape

```json
{
  "c_myAttr": "value",
  "c_anotherAttr": 42
}
```

### Examples

```bash
# Update via JSON file
b2c scapi preferences global update CustomGroupId staging --file prefs.json --tenant-id zzxy_prd

# Update via inline JSON
b2c scapi preferences global update CustomGroupId staging \
  --body '{"c_attr": "value"}' --tenant-id zzxy_prd
```

---

## b2c scapi preferences site list {#list-site}

List custom preferences for a single site.

### Usage

```bash
b2c scapi preferences site list --site-id <SITE_ID> --tenant-id <TENANT_ID>
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--site-id` | `-s` | (Required) Site ID to list preferences for | |
| `--limit` | `-l` | Maximum number of results (1–200) | `200` |
| `--offset` | `-o` | Result offset for pagination | `0` |
| `--mask-password` / `--no-mask-password` | | Mask values of type password | `false` |
| `--columns` | `-c` | Columns to display (comma-separated: `id`, `value`, `groupId`) | `id,value` |
| `--extended` | `-x` | Show all columns including extended fields (`groupId`) | `false` |
| `--json` | | Output as JSON | `false` |

### Examples

```bash
# List preferences for a site
b2c scapi preferences site list --site-id RefArch --tenant-id zzxy_prd

# Limit results
b2c scapi preferences site list --site-id RefArch --limit 50 --tenant-id zzxy_prd

# Include the group ID column
b2c scapi preferences site list --site-id RefArch --tenant-id zzxy_prd --extended
```

---

## b2c scapi preferences site get {#get-site}

Read all custom preferences inside a site preference group for a given instance type.

### Usage

```bash
b2c scapi preferences site get <GROUP_ID> <INSTANCE_TYPE> --site-id <SITE_ID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id` | `-s` | (Required) Site ID |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password (default `false`) |
| `--json` | | Output as JSON |

### Examples

```bash
b2c scapi preferences site get CustomGroupId staging --site-id RefArch --tenant-id zzxy_prd
```

---

## b2c scapi preferences site update {#update-site}

Update custom preferences inside a site preference group for a given instance type.

### Usage

```bash
b2c scapi preferences site update <GROUP_ID> <INSTANCE_TYPE> --site-id <SITE_ID> \
  (--file <PATH> | --body <JSON>) --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--site-id` | `-s` | (Required) Site ID |
| `--file` | `-f` | JSON file with preferences body. Mutually exclusive with `--body`. |
| `--body` | | Inline JSON body with preferences. Mutually exclusive with `--file`. |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password in the response (default `false`) |
| `--json` | | Output as JSON |

Either `--file` or `--body` is required. Custom attributes use the `c_` prefix.

### Examples

```bash
# Update via JSON file
b2c scapi preferences site update CustomGroupId staging --site-id RefArch \
  --file prefs.json --tenant-id zzxy_prd

# Update via inline JSON
b2c scapi preferences site update CustomGroupId staging --site-id RefArch \
  --body '{"c_attr":"value"}' --tenant-id zzxy_prd
```

---

## b2c scapi preferences site search {#search-site}

Search preferences across sites in a site preference group for a given instance type.

This command supports a free-text search via convenience flags or a fully custom query body. The convenience flags map to the standard SCAPI [Query DSL](https://developer.salesforce.com/docs/commerce/commerce-api/references/about-commerce-api/search-and-query.html).

### Usage

```bash
b2c scapi preferences site search <GROUP_ID> <INSTANCE_TYPE> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--search-phrase` | | Free-text phrase searched across `id`, `displayName`, `description` | |
| `--value-type` | | Filter by `valueType` (combined with `--search-phrase` via AND) | |
| `--query` | | Inline JSON `Query` body (overrides convenience flags) | |
| `--query-file` | | JSON file containing a `Query` body (overrides convenience flags) | |
| `--sort-by` | | Sort field. SCAPI searchable fields are `id`, `displayName`, `description`, and `valueType` — only searchable attributes can be sorted. | |
| `--sort-order` | | `asc` or `desc` | `asc` |
| `--limit` | `-l` | Maximum number of results returned by the CLI (1–200). The search endpoint does not declare a default in the OpenAPI spec; this default is a CLI choice. | `25` |
| `--offset` | `-o` | Result offset for pagination | `0` |
| `--expand` | | Set to `value` to include attribute value definitions | |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password | `false` |
| `--columns` | | Columns to display (`id`, `valueType`, `displayName`, `siteValues`) | `id,valueType,displayName` |
| `--json` | | Output as JSON | `false` |

The `--query` and `--query-file` flags are mutually exclusive with `--search-phrase` and `--value-type`.

### Examples

```bash
# Match-all (default when no query/phrase provided)
b2c scapi preferences site search CustomGroupId staging --tenant-id zzxy_prd

# Free-text search
b2c scapi preferences site search CustomGroupId staging \
  --search-phrase Wapi --tenant-id zzxy_prd

# Filter by value type and sort
b2c scapi preferences site search CustomGroupId staging \
  --value-type string --sort-by id --tenant-id zzxy_prd

# Custom query from a file
b2c scapi preferences site search CustomGroupId staging \
  --query-file query.json --tenant-id zzxy_prd

# Custom query inline, expand value definitions
b2c scapi preferences site search CustomGroupId staging \
  --query '{"matchAllQuery":{}}' --expand value --tenant-id zzxy_prd
```

---

## b2c scapi preferences site preference get {#get-site-preference}

Read a single preference value across sites in a site preference group.

### Usage

```bash
b2c scapi preferences site preference get <GROUP_ID> <INSTANCE_TYPE> <PREFERENCE_ID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |
| `PREFERENCE_ID` | Preference attribute ID (e.g. `c_myAttr`) | Yes |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--mask-passwords` / `--no-mask-passwords` | Mask values of type password | `false` |
| `--json` | Output as JSON | `false` |

### Examples

```bash
b2c scapi preferences site preference get CustomGroupId staging WapiStringAttr --tenant-id zzxy_prd
```

---

## b2c scapi preferences site preference update {#update-site-preference}

Update a single preference value across sites in a site preference group. The body is a `PreferenceValue` object containing a `siteValues` map keyed by site ID.

### Usage

```bash
b2c scapi preferences site preference update <GROUP_ID> <INSTANCE_TYPE> <PREFERENCE_ID> \
  (--file <PATH> | --body <JSON>) --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `INSTANCE_TYPE` | One of `staging`, `development`, `sandbox`, `production`, or `current` | Yes |
| `PREFERENCE_ID` | Preference attribute ID (e.g. `c_myAttr`) | Yes |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--file` | `-f` | JSON file with `PreferenceValue` body. Mutually exclusive with `--body`. |
| `--body` | | Inline JSON `PreferenceValue` body. Mutually exclusive with `--file`. |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password in the response (default `false`) |
| `--json` | | Output as JSON |

Either `--file` or `--body` is required.

### Body Shape

`PreferenceValue` declares `id` as required in the OpenAPI schema. The path already carries `PREFERENCE_ID`; for spec compliance, include `id` in the body matching the path argument:

```json
{
  "id": "WapiStringAttr",
  "siteValues": {
    "RefArch": "new value",
    "SiteGenesis": "another value"
  }
}
```

### Examples

```bash
# Update via JSON file
b2c scapi preferences site preference update CustomGroupId staging WapiStringAttr \
  --file pref.json --tenant-id zzxy_prd

# Update via inline JSON
b2c scapi preferences site preference update CustomGroupId staging WapiStringAttr \
  --body '{"id":"WapiStringAttr","siteValues":{"RefArch":"new"}}' --tenant-id zzxy_prd
```
