---
description: Commands for reading, updating, and searching custom global and site preferences.
---

# Preferences

Commands for managing custom global and site preferences via the [Configuration Preferences API](https://developer.salesforce.com/docs/commerce/commerce-api/references/preferences).

The CLI exposes two command groups:

- `b2c preferences global` — read and update custom preferences at the **organization** (global) level.
- `b2c preferences site` — read, update, and search custom preferences at the **site** level, including a `preference` subgroup for operating on a single attribute.

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
b2c preferences global list --client-id xxx --client-secret xxx --tenant-id zzxy_prd
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#scapi-authentication).

## Instance Type

Read and update commands accept an `--instance-type` flag (alias `-I`) that targets a specific environment within the organization. The default is `development` — a real tier valid for both reads and writes:

| Value | Meaning |
|-------|---------|
| `development` | Development instance (**default**) |
| `staging` | Staging instance |
| `sandbox` | Sandbox instance |
| `production` | Production instance |
| `current` | The instance handling the request (resolved server-side, **read-only**) |

::: warning
`current` is accepted on read commands (`list`, `get`, `search`) but the SCAPI Preferences API rejects it on writes (`update`). Use a concrete tier such as `development`, `staging`, `sandbox`, or `production` when writing.
:::

::: info
The OpenAPI schema enum lists only `staging`, `development`, `sandbox`, and `production`. The string `current` is documented in the SCAPI operation descriptions and is accepted by the service for reads, but it is not part of the formal enum — strict OAS validators may reject it.
:::

## Custom Attributes

Custom preference attributes use the `c_` prefix (for example `c_myAttr`). When supplying request bodies via `--file` or `--body`, include the `c_` prefix on each attribute key.

## Assignment Grammar (write commands)

The `update` commands accept a compact `KEY=value` syntax for the common case of setting one or two attributes. The Preferences API does **not** coerce types — sending `"5"` to an `int` attribute is rejected — so the grammar uses different operators to distinguish strings from raw JSON.

| Form | Meaning | Use for |
|------|---------|---------|
| `key=value`   | string value                            | `string`, `text`, `email`, `password`, `date`, `datetime`, `enum-of-string` |
| `key:=json`   | raw JSON (number, bool, array, object)  | `int`, `double`, `boolean`, `enum-of-int`, all `set-of-*`, structured types (`html`, `image`) |
| `key=@file`   | file contents as a string value         | long text, an HTML source blob |
| `key:=@file`  | file contents parsed as JSON            | a `set-of-*` array or a structured object from a file |
| `key=`        | null (clears/unsets the attribute)      | clearing a value |

The `:=` operator is the workhorse: any non-string type must go through `:=` so the CLI sends real JSON. Examples: `c_count:=5`, `c_on:=true`, `c_tags:='["a","b"]'`, `c_banner:='{"source":"<b>hi</b>"}'`.

The same grammar applies to the repeatable `--site-value SITE=val` flag on `preferences site preference update`.

---

## b2c preferences global list {#list-global}

List custom preferences for the organization (global level).

### Usage

```bash
b2c preferences global list --tenant-id <TENANT_ID>
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
b2c preferences global list --tenant-id zzxy_prd

# Page through results
b2c preferences global list --tenant-id zzxy_prd --limit 50 --offset 100

# Include the group ID column
b2c preferences global list --tenant-id zzxy_prd --extended

# JSON output
b2c preferences global list --tenant-id zzxy_prd --json
```

---

## b2c preferences global get {#get-global}

Read all custom preferences inside a global preference group for a given instance type.

### Usage

```bash
b2c preferences global get <GROUP_ID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--instance-type` / `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` (reads only) | `development` |
| `--mask-passwords` / `--no-mask-passwords` | Mask values of type password | `false` |
| `--expand` | Set to `sites` to also return site-specific values | |
| `--json` | Output as JSON | `false` |

### Examples

```bash
# Read a global preference group from the current instance (default)
b2c preferences global get CustomGroupId --tenant-id zzxy_prd

# Read a global preference group from the staging instance
b2c preferences global get CustomGroupId --instance-type staging --tenant-id zzxy_prd

# Expand site-specific values
b2c preferences global get CustomGroupId --tenant-id zzxy_prd --expand sites
```

---

## b2c preferences global update {#update-global}

Update custom preferences inside a global preference group for a given instance type.

### Usage

```bash
b2c preferences global update <GROUP_ID> [KEY=value KEY:=json ...] [--file <PATH> | --body <JSON>] --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `KEY=value ...` | Variadic attribute assignments. See [Assignment Grammar](#assignment-grammar-write-commands). | One of: assignments, `--file`, `--body` |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--instance-type` | `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` (default `development`; `current` is reads-only) |
| `--file` | `-f` | JSON file with preferences body. Mutually exclusive with `--body` and assignments. |
| `--body` | | Inline JSON body with preferences. Mutually exclusive with `--file` and assignments. |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password in the response (default `false`) |
| `--json` | | Output as JSON |

Provide either `KEY=value` assignments or `--file`/`--body`. Custom attributes use the `c_` prefix.

### Body Shape

```json
{
  "c_myAttr": "value",
  "c_anotherAttr": 42
}
```

### Examples

```bash
# Set typed attributes (defaults to --instance-type development)
b2c preferences global update CustomGroupId c_name=hello c_count:=5 c_on:=true --tenant-id zzxy_prd

# Target a different tier explicitly
b2c preferences global update CustomGroupId -I staging c_count:=5 --tenant-id zzxy_prd

# Clear an attribute
b2c preferences global update CustomGroupId c_temp= --tenant-id zzxy_prd

# Bulk / nested edits via JSON file
b2c preferences global update CustomGroupId --file prefs.json --tenant-id zzxy_prd

# Inline JSON body, targeting staging
b2c preferences global update CustomGroupId --instance-type staging \
  --body '{"c_attr": "value"}' --tenant-id zzxy_prd
```

---

## b2c preferences site list {#list-site}

List custom preferences for a single site.

### Usage

```bash
b2c preferences site list --site-id <SITE_ID> --tenant-id <TENANT_ID>
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
b2c preferences site list --site-id RefArch --tenant-id zzxy_prd

# Limit results
b2c preferences site list --site-id RefArch --limit 50 --tenant-id zzxy_prd

# Include the group ID column
b2c preferences site list --site-id RefArch --tenant-id zzxy_prd --extended
```

---

## b2c preferences site get {#get-site}

Read all custom preferences inside a site preference group for a given instance type.

### Usage

```bash
b2c preferences site get <GROUP_ID> --site-id <SITE_ID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--instance-type` | `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` (reads only; default `development`) |
| `--site-id` | `-s` | (Required) Site ID |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password (default `false`) |
| `--json` | | Output as JSON |

### Examples

```bash
b2c preferences site get CustomGroupId --instance-type staging --site-id RefArch --tenant-id zzxy_prd
```

---

## b2c preferences site update {#update-site}

Update custom preferences inside a site preference group for a given instance type. The API accepts a single `siteId` per call, so `--site-id` is required and not repeatable.

### Usage

```bash
b2c preferences site update <GROUP_ID> --site-id <SITE_ID> \
  [KEY=value KEY:=json ...] [--file <PATH> | --body <JSON>] --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `KEY=value ...` | Variadic attribute assignments. See [Assignment Grammar](#assignment-grammar-write-commands). | One of: assignments, `--file`, `--body` |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--instance-type` | `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` (default `development`; `current` is reads-only) |
| `--site-id` | `-s` | (Required) Site ID |
| `--file` | `-f` | JSON file with preferences body. Mutually exclusive with `--body` and assignments. |
| `--body` | | Inline JSON body with preferences. Mutually exclusive with `--file` and assignments. |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password in the response (default `false`) |
| `--json` | | Output as JSON |

Provide either `KEY=value` assignments or `--file`/`--body`. Custom attributes use the `c_` prefix.

### Examples

```bash
# Read an HTML file into a string value (development tier by default)
b2c preferences site update CustomGroupId --site-id RefArch c_banner=@banner.html --tenant-id zzxy_prd

# Structured html via raw JSON, on staging
b2c preferences site update CustomGroupId -I staging --site-id RefArch \
  c_banner:='{"source":"<b>hi</b>"}' --tenant-id zzxy_prd

# Bulk update via JSON file
b2c preferences site update CustomGroupId --instance-type staging --site-id RefArch \
  --file prefs.json --tenant-id zzxy_prd

# Inline JSON body
b2c preferences site update CustomGroupId --instance-type staging --site-id RefArch \
  --body '{"c_attr":"value"}' --tenant-id zzxy_prd
```

---

## b2c preferences site search {#search-site}

Search preferences across sites in a site preference group for a given instance type.

This command supports a free-text search via convenience flags or a fully custom query body. The convenience flags map to the standard SCAPI [Query DSL](https://developer.salesforce.com/docs/commerce/commerce-api/references/about-commerce-api/search-and-query.html).

### Usage

```bash
b2c preferences site search <GROUP_ID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--instance-type` | `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` | `development` |
| `--search-phrase` | | Free-text phrase searched across `id`, `displayName`, `description` | |
| `--value-type` | | Filter by `valueType` (combined with `--search-phrase` via AND) | |
| `--query` | | Inline JSON `Query` body (overrides convenience flags) | |
| `--query-file` | | JSON file containing a `Query` body (overrides convenience flags) | |
| `--sort-by` | | Sort field. One of `id`, `displayName`, `description`, `valueType` (only searchable attributes can be sorted) | |
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
b2c preferences site search CustomGroupId --tenant-id zzxy_prd

# Free-text search on the staging instance
b2c preferences site search CustomGroupId --instance-type staging \
  --search-phrase Wapi --tenant-id zzxy_prd

# Filter by value type and sort
b2c preferences site search CustomGroupId \
  --value-type string --sort-by id --tenant-id zzxy_prd

# Custom query from a file
b2c preferences site search CustomGroupId \
  --query-file query.json --tenant-id zzxy_prd

# Custom query inline, expand value definitions
b2c preferences site search CustomGroupId \
  --query '{"matchAllQuery":{}}' --expand value --tenant-id zzxy_prd
```

---

## b2c preferences site preference get {#get-site-preference}

Read a single preference value across sites in a site preference group.

### Usage

```bash
b2c preferences site preference get <GROUP_ID> <PREFERENCE_ID> --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `PREFERENCE_ID` | Preference attribute ID (e.g. `c_myAttr`) | Yes |

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--instance-type` / `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` (reads only) | `development` |
| `--mask-passwords` / `--no-mask-passwords` | Mask values of type password | `false` |
| `--json` | Output as JSON | `false` |

### Examples

```bash
b2c preferences site preference get CustomGroupId WapiStringAttr --instance-type staging --tenant-id zzxy_prd
```

---

## b2c preferences site preference update {#update-site-preference}

Update a single preference value across sites in a site preference group. The body is a `PreferenceValue` object containing a `siteValues` map keyed by site ID. The repeatable `--site-value SITE=val` flag maps 1:1 onto that map and accepts the [assignment grammar](#assignment-grammar-write-commands).

### Usage

```bash
b2c preferences site preference update <GROUP_ID> <PREFERENCE_ID> \
  (--site-value SITE=val ... | --file <PATH> | --body <JSON>) --tenant-id <TENANT_ID>
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `GROUP_ID` | Preference group ID | Yes |
| `PREFERENCE_ID` | Preference attribute ID (e.g. `c_myAttr`) | Yes |

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--instance-type` | `-I` | One of `development`, `staging`, `sandbox`, `production`, or `current` (default `development`; `current` is reads-only) |
| `--site-value` | | Per-site assignment `SITE=val` (repeatable). Operators: `=`, `:=`, `=@file`, `:=@file`, `=` (null). Mutually exclusive with `--file`/`--body`. |
| `--file` | `-f` | JSON file with `PreferenceValue` body. Mutually exclusive with `--body` and `--site-value`. |
| `--body` | | Inline JSON `PreferenceValue` body. Mutually exclusive with `--file` and `--site-value`. |
| `--mask-passwords` / `--no-mask-passwords` | | Mask values of type password in the response (default `false`) |
| `--json` | | Output as JSON |

Provide either `--site-value` flags or `--file`/`--body`.

### Body Shape

`PreferenceValue` declares `id` as required in the OpenAPI schema. When the body is built from `--site-value` flags, the CLI populates `id` from `PREFERENCE_ID` automatically. When using `--file`/`--body`, include `id`:

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
# Single attribute across multiple sites (maps to the siteValues map)
b2c preferences site preference update CustomGroupId c_name \
  --site-value RefArch=hello --site-value RefArchGlobal:=42 --tenant-id zzxy_prd

# Update via JSON file
b2c preferences site preference update CustomGroupId WapiStringAttr \
  --file pref.json --tenant-id zzxy_prd

# Update via inline JSON, targeting staging
b2c preferences site preference update CustomGroupId WapiStringAttr --instance-type staging \
  --body '{"id":"WapiStringAttr","siteValues":{"RefArch":"new"}}' --tenant-id zzxy_prd
```
