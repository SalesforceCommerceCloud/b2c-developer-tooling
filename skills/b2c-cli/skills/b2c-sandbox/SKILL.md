---
name: b2c-sandbox
description: Create and manage (B2C/SFCC/Demandware) on-demand sandboxes (ODS) with the b2c cli. Use when provisioning development instances, starting/stopping sandboxes, checking sandbox status, or managing sandbox lifecycle.
---

# B2C Sandbox Skill

Only create or delete sandboxes when explicitly requested. Always confirm destructive actions.

Use the `b2c` CLI plugin to manage Salesforce B2C Commerce On-demand sandboxes (ODS). Only create or delete a sandbox if explicitly asked as this may be a billable or destructible action.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli sandbox list`).

> **Alias:** The `ods` prefix is still supported as a backward-compatible alias (e.g., `b2c ods list` works the same as `b2c sandbox list`).

## Sandbox ID Formats

Commands that operate on a specific sandbox accept two ID formats:

- **UUID**: The full sandbox UUID (e.g., `abc12345-1234-1234-1234-abc123456789`)
- **Realm-instance**: The realm-instance format (e.g., `zzzv-123` or `zzzv_123`)

The realm-instance format uses the 4-character realm code followed by a dash or underscore and the instance number. When using a realm-instance format, the CLI will automatically look up the corresponding UUID.

## Examples

### List Sandboxes

```bash
b2c sandbox list

# for realm zzpq with JSON output
b2c sandbox list --realm zzpq --json

# filter by status and those created by a specific user, only print the columns id,state,hostname
b2c sandbox list --filter-params 'state=started,creating&createdBy=clavery@salesforce.com' --realm zzpq --columns id,state,hostname
```

### Create Sandbox

Only create a sandbox if explicitly asked as this may be a billable action.

```bash
# create in realm zzpq with 4 hour TTL (0 = infinite); json output and wait for completion (this may take 5-10 minutes; timeout is 10 minutes)
b2c sandbox create --realm zzpq --ttl 4 --json --wait

# create in realm zzpq with large profile (medium is default)
b2c sandbox create --realm zzpq --profile large

# create without automatic OCAPI/WebDAV permissions
b2c sandbox create --realm zzpq --no-set-permissions

# use a different client ID for default permissions
b2c sandbox create --realm zzpq --permissions-client-id my-other-client

# custom OCAPI settings (replaces defaults)
b2c sandbox create --realm zzpq --ocapi-settings '[{"client_id":"my-client","resources":[{"resource_id":"/code_versions","methods":["get"]}]}]'

# with start/stop scheduler
b2c sandbox create --realm zzpq --start-scheduler '{"weekdays":["MONDAY","TUESDAY"],"time":"08:00:00Z"}' --stop-scheduler '{"weekdays":["MONDAY","TUESDAY"],"time":"19:00:00Z"}'

# get full log trace output to debug
b2c sandbox create --realm zzpq --log-level trace
```

### Get/Start/Stop/Restart/Delete Sandbox

Commands that operate on a specific sandbox support both UUID and realm-instance formats:

```bash
# Using UUID
b2c sandbox get abc12345-1234-1234-1234-abc123456789
b2c sandbox start abc12345-1234-1234-1234-abc123456789
b2c sandbox stop abc12345-1234-1234-1234-abc123456789

# Using realm-instance format
b2c sandbox get zzzv-123
b2c sandbox start zzzv_123
b2c sandbox stop zzzv-123
b2c sandbox restart zzzv-123
b2c sandbox delete zzzv-123 --force
```

### More Commands

See `b2c sandbox --help` for a full list of available commands and options in the `sandbox` topic.
