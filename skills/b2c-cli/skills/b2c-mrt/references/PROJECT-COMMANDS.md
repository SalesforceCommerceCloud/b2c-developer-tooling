# MRT Project Commands Reference

Detailed reference for MRT project, member, and notification commands.

> **`storefront` alias:** `mrt storefront` is an alias for `mrt project` (including `member` and `notification` subtopics), and `--storefront` / `-s` are aliases for `--project` / `-p` on every command that accepts it — all four are interchangeable. The `MRT_STOREFRONT` / `SFCC_MRT_STOREFRONT` environment variables work as fallbacks for `MRT_PROJECT` / `SFCC_MRT_PROJECT`. The alias matches SCAPI MRT API terminology; the `project` forms continue to work unchanged. Examples below use `project`, but `storefront` is interchangeable. On `mrt project create`, this flag sets the new project's slug (auto-generated from the name if omitted).

## Project Management

> **Backend-aware:** `mrt project list` / `create` / `get` / `update` / `delete` honor `--mrt-backend` (`auto` | `legacy` | `scapi`). An MRT project **is** a SCAPI storefront, so over SCAPI they map to the Storefront Storefronts API (scopes `sfcc.storefront.storefronts` / `.rw`); the storefront ID is the project slug and the organization is fixed by `--tenant-id`. Some flags are legacy-only and some are SCAPI-only (see below); a flag is validated only against the backend that will run. `member` and `notification` are legacy-only — `--mrt-backend scapi` on those errors with an actionable message. Under `--json`, each command returns the serving backend's native shape.

### List Projects

`--organization` / `-o` filters the legacy backend only.

```bash
b2c mrt project list
b2c mrt project list --limit 10 --offset 0
b2c mrt project list --mrt-backend scapi
b2c mrt project list --json
```

### Create Project

The positional argument is the project **name**.

- **Legacy:** `--organization` / `-o` is required. Choose the new project's slug with `--project` / `--storefront` (`-p` / `-s`); when omitted, MRT auto-generates it from the name. `--url` and `--region` / `-r` are legacy-only.
- **SCAPI:** at least one `--site` (repeatable) is required; `--type` picks the storefront type (default `storefront_next`). `--organization`/`--url`/`--region`/slug do not apply (the storefront ID is server-generated). Returns `202` and provisions asynchronously — poll `project get` for `setupStatus`.

```bash
# Legacy
b2c mrt project create "My Storefront" --organization my-org
b2c mrt project create "My Storefront" -o my-org -s my-storefront --region us-east-1
# SCAPI
b2c mrt project create "My Storefront" --site RefArch --mrt-backend scapi
```

> **Slug as positional or flag:** `get`, `update`, and `delete` accept the project slug (= SCAPI storefront ID) **either** as a positional argument **or** via `-p` / `-s` / `--project` / `--storefront` (or `MRT_PROJECT` / `dw.json`). An explicit positional wins if both are given; at least one source must resolve.

### Get Project Details

```bash
b2c mrt project get my-storefront            # positional
b2c mrt project get --project my-storefront  # flag
b2c mrt project get -p my-storefront --mrt-backend scapi --json
```

### Update Project

At least one updatable field must be supplied.

- **Legacy:** `--name` / `-n`, `--url`, `--region` / `-r`.
- **SCAPI:** cannot rename (no `--name`/`--url`). Honors `--region` / `-r`, `--ssr-architecture` (`x86` | `arm64`), `--allow-cookies` / `--no-allow-cookies`, `--preserve-proxy-user-agent` / `--no-preserve-proxy-user-agent`, and `--site` (repeatable). **`--site` fully replaces the assigned-sites set** — pass the complete desired set, not a delta.

```bash
# Legacy
b2c mrt project update my-storefront --name "Updated Name"
# SCAPI — replaces the full assigned-sites set with exactly these two
b2c mrt project update --project my-storefront --site RefArch --site OtherSite --mrt-backend scapi
```

### Delete Project

Over SCAPI, deletion returns `202` and completes asynchronously.

```bash
b2c mrt project delete my-storefront
b2c mrt project delete --project my-storefront
b2c mrt project delete -p my-storefront --force  # skip confirmation
b2c mrt project delete my-storefront --mrt-backend scapi --force
```

## Member Management

> `member` commands are legacy-only; they do not support `--mrt-backend scapi`.

Members can have one of three roles: `admin`, `developer`, or `viewer`.

### List Members

```bash
b2c mrt project member list --project my-storefront
b2c mrt project member list -p my-storefront --json
```

### Add Member

```bash
b2c mrt project member add user@example.com --project my-storefront --role admin
b2c mrt project member add user@example.com -p my-storefront --role developer
b2c mrt project member add user@example.com -p my-storefront --role viewer
```

### Get Member Details

```bash
b2c mrt project member get user@example.com --project my-storefront
```

### Update Member Role

```bash
b2c mrt project member update user@example.com --project my-storefront --role viewer
```

### Remove Member

```bash
b2c mrt project member remove user@example.com --project my-storefront
b2c mrt project member remove user@example.com -p my-storefront --force
```

## Deployment Notifications

Configure email notifications for deployment events (start, success, failure).

### List Notifications

```bash
b2c mrt project notification list --project my-storefront
b2c mrt project notification list -p my-storefront --json
```

### Create Notification

```bash
# Notify on deployment failures only
b2c mrt project notification create -p my-storefront \
  --target staging --target production \
  --recipient ops@example.com \
  --on-failed

# Notify on all deployment events
b2c mrt project notification create -p my-storefront \
  --target production \
  --recipient team@example.com \
  --on-start --on-success --on-failed

# Multiple recipients
b2c mrt project notification create -p my-storefront \
  --target production \
  --recipient dev@example.com --recipient ops@example.com \
  --on-failed
```

**Flags:**
| Flag | Description |
|------|-------------|
| `--target`, `-t` | Target environment (can specify multiple). Aliases: `--environment`, `-e`. |
| `--recipient`, `-r` | Email recipient (can specify multiple) |
| `--on-start` | Notify when deployment starts |
| `--on-success` | Notify when deployment succeeds |
| `--on-failed` | Notify when deployment fails |

### Get Notification Details

```bash
b2c mrt project notification get abc-123 --project my-storefront
b2c mrt project notification get abc-123 -p my-storefront --json
```

### Update Notification

```bash
# Change notification events
b2c mrt project notification update abc-123 -p my-storefront --on-start --no-on-failed

# Update recipients
b2c mrt project notification update abc-123 -p my-storefront --recipient new-team@example.com
```

### Delete Notification

```bash
b2c mrt project notification delete abc-123 --project my-storefront
b2c mrt project notification delete abc-123 -p my-storefront --force
```
