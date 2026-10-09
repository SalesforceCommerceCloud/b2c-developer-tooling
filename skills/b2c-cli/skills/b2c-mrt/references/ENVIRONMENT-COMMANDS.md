# MRT Environment Commands Reference

Detailed reference for MRT environment, variable, redirect, and access control commands.

## Environment Management

### List Environments

```bash
b2c mrt env list --project my-storefront
b2c mrt env list -p my-storefront --json
```

### Create Environment

```bash
# Basic staging environment
b2c mrt env create staging --project my-storefront --name "Staging Environment"

# Production environment in specific region
b2c mrt env create production -p my-storefront --name "Production" \
  --production --region eu-west-1

# With external hostname configuration
b2c mrt env create prod -p my-storefront --name "Production" \
  --production \
  --external-hostname www.example.com \
  --external-domain example.com

# With cookie forwarding and source maps
b2c mrt env create dev -p my-storefront --name "Development" \
  --allow-cookies --enable-source-maps

# The new environment's slug may be given as the positional OR via --environment / -e
b2c mrt env create -p my-storefront -e staging --name "Staging Environment"
```

> **Slug as positional or flag:** the environment slug can be supplied as the positional argument **or** via `-e` / `--environment` (also honoring `MRT_ENVIRONMENT` / `dw.json`). An explicit positional wins if both are given.

**Flags:**
| Flag | Description |
|------|-------------|
| `--name`, `-n` | Display name (required) |
| `--region`, `-r` | AWS region for SSR deployment |
| `--production` | Mark as production environment |
| `--hostname` | Hostname pattern for V8 Tag loading |
| `--external-hostname` | Full external hostname (e.g., www.example.com) |
| `--external-domain` | External domain for Universal PWA SSR |
| `--allow-cookies` | Forward HTTP cookies to origin |
| `--enable-source-maps` | Enable source map support |

### Get Environment Details

```bash
b2c mrt env get --project my-storefront --environment staging
b2c mrt env get -p my-storefront -e production --json
```

### Update Environment

```bash
b2c mrt env update -p my-storefront -e staging --name "Updated Staging"
b2c mrt env update -p my-storefront -e production --allow-cookies
b2c mrt env update -p my-storefront -e dev --no-enable-source-maps
```

### Delete Environment

```bash
b2c mrt env delete staging --project my-storefront
b2c mrt env delete old-env -p my-storefront --force

# The env slug may be given as the positional OR via --environment / -e
b2c mrt env delete -p my-storefront -e old-env --force
```

> **Slug as positional or flag:** the environment slug can be supplied as the positional argument **or** via `-e` / `--environment` (also honoring `MRT_ENVIRONMENT` / `dw.json`). An explicit positional wins if both are given.

### Invalidate Cache

Invalidate CDN cached content for an environment.

```bash
# Invalidate all cached content
b2c mrt env invalidate -p my-storefront -e production

# Invalidate specific paths
b2c mrt env invalidate -p my-storefront -e production \
  --path "/products/*" --path "/categories/*"
```

### Set Primary Environment

Promote an environment to the storefront's primary environment. **SCAPI backend only** — the legacy MRT Cloud API has no primary-environment concept, so this rejects `--mrt-backend legacy`. The environment must be `ready` (or `build_failed`); promoting the already-primary environment is a no-op success.

```bash
b2c mrt env set-primary production --project my-storefront --mrt-backend scapi
b2c mrt env set-primary -p my-storefront -e production --mrt-backend scapi
```

### B2C Commerce Connection

Get or set B2C Commerce instance connection for an environment.

```bash
# Get current configuration
b2c mrt env b2c -p my-storefront -e production

# Set B2C instance
b2c mrt env b2c -p my-storefront -e production --instance-id aaaa_prd

# Set B2C instance with specific sites
b2c mrt env b2c -p my-storefront -e production \
  --instance-id aaaa_prd --sites RefArch,SiteGenesis

# Clear sites list
b2c mrt env b2c -p my-storefront -e production --clear-sites
```

## Environment Variables

The `mrt env var` commands (`list` / `set` / `push` / `delete`) are backend-aware: they honor `--mrt-backend` (`auto` / `legacy` / `scapi`) and, over SCAPI, use the Storefront Environments API (scopes `sfcc.storefront.environments` for reads, `sfcc.storefront.environments.rw` for writes). See the [MRT Backends](../SKILL.md#mrt-backends-legacy-vs-scapi) section for backend selection. Values are always masked by both backends. `set` and `delete` apply a merge-PATCH — only the keys you pass change (`delete` sends the key with a `null` value); other variables are preserved. Under `--json`, each command returns the serving backend's native shape.

### List Variables

```bash
b2c mrt env var list --project my-storefront --environment production
b2c mrt env var list -p my-storefront -e staging --json

# Force the SCAPI backend
b2c mrt env var list -p my-storefront -e staging --mrt-backend scapi
```

### Set Variables

```bash
# Single variable
b2c mrt env var set MY_VAR=value -p my-storefront -e production

# Multiple variables
b2c mrt env var set API_KEY=secret DEBUG=true FEATURE_FLAG=enabled \
  -p my-storefront -e staging

# Value with spaces (use quotes)
b2c mrt env var set "MESSAGE=hello world" -p my-storefront -e production

# Force the SCAPI backend
b2c mrt env var set API_KEY=secret -p my-storefront -e staging --mrt-backend scapi

# Using environment variables for auth
export MRT_API_KEY=your-api-key
export MRT_PROJECT=my-storefront
export MRT_ENVIRONMENT=staging
b2c mrt env var set MY_VAR=value
```

### Push Variables from a .env File

Diff a local `.env` file against the remote environment and apply the additions/updates (remote-only variables are not deleted). `push` resolves the backend once from its initial read and pins every write to it; over SCAPI the changes are applied as a single merge-PATCH.

```bash
# Push ./.env, with confirmation prompt
b2c mrt env var push -p my-storefront -e production

# Push a custom file, skipping confirmation, over SCAPI
b2c mrt env var push -p my-storefront -e staging --file config/.env --yes --mrt-backend scapi
```

### Delete Variable

```bash
b2c mrt env var delete MY_VAR -p my-storefront -e production

# Force the SCAPI backend
b2c mrt env var delete MY_VAR -p my-storefront -e production --mrt-backend scapi
```

## URL Redirects

The `mrt env redirect` commands (`list` / `create` / `get` / `update` / `delete` / `clone`) are backend-aware: they honor `--mrt-backend` (`auto` / `legacy` / `scapi`) and, over SCAPI, use the Storefront Environments API (scopes `sfcc.storefront.environments` for reads, `sfcc.storefront.environments.rw` for writes). See the [MRT Backends](../SKILL.md#mrt-backends-legacy-vs-scapi) section for backend selection. The two backends identify a redirect differently — legacy keys on the source path (`from_path`), SCAPI keys on a redirect ID (UUID) — so `get` / `update` / `delete` take a neutral `identifier` positional (source path on legacy, UUID on SCAPI). Under `--json`, each command returns the serving backend's native shape.

### List Redirects

```bash
b2c mrt env redirect list -p my-storefront -e production
b2c mrt env redirect list -p my-storefront -e production --limit 50
b2c mrt env redirect list -p my-storefront -e production --json

# Force the SCAPI backend
b2c mrt env redirect list -p my-storefront -e production --mrt-backend scapi
```

### Create Redirect

Status defaults to `301` (permanent); pass `--status 302` for a temporary redirect. `--from` and `--to` also accept the SCAPI-aligned aliases `--source` and `--destination`.

```bash
# Permanent redirect (301, default)
b2c mrt env redirect create -p my-storefront -e production \
  --from "/old-path" --to "/new-path"

# Temporary redirect (302), forwarding the wildcard portion of the path
b2c mrt env redirect create -p my-storefront -e production \
  --from "/legacy/*" --to "/modern/$1" --status 302 --forward-wildcard

# Force the SCAPI backend
b2c mrt env redirect create -p my-storefront -e production \
  --from "/promo" --to "/sale" --mrt-backend scapi
```

### Get Redirect

Fetch a single redirect by its identifier — source path on legacy, redirect ID (UUID) on SCAPI.

```bash
b2c mrt env redirect get "/old-path" -p my-storefront -e production
b2c mrt env redirect get 3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d \
  -p my-storefront -e production --mrt-backend scapi
```

### Update Redirect

Partial update — only the fields you pass change; the source path cannot be changed.

```bash
# Change only the destination
b2c mrt env redirect update "/old-path" -p my-storefront -e production --to "/new-path"

# Change the status and disable query-string forwarding
b2c mrt env redirect update 3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d \
  -p my-storefront -e production --status 302 --no-forward-querystring --mrt-backend scapi
```

### Delete Redirect

```bash
b2c mrt env redirect delete "/old-path" -p my-storefront -e production
b2c mrt env redirect delete "/old-path" -p my-storefront -e production --force

# SCAPI — identify by redirect ID
b2c mrt env redirect delete 3f9b1c2d-4e5f-6a7b-8c9d-0e1f2a3b4c5d \
  -p my-storefront -e production --mrt-backend scapi
```

### Clone Redirects

Copy redirects from one environment to another within the same project. The source and target environments must differ.

```bash
b2c mrt env redirect clone -p my-storefront --from staging --to production
b2c mrt env redirect clone -p my-storefront --from staging --to production --force

# Force the SCAPI backend
b2c mrt env redirect clone -p my-storefront --from staging --to production --mrt-backend scapi
```

## Access Control Headers

The `mrt env access-control` commands (`list` / `create` / `get` / `delete`) are backend-aware: they honor `--mrt-backend` (`auto` / `legacy` / `scapi`) and, over SCAPI, use the Storefront Environments API (scopes `sfcc.storefront.environments` for reads, `sfcc.storefront.environments.rw` for writes). See the [MRT Backends](../SKILL.md#mrt-backends-legacy-vs-scapi) section for backend selection. Header values are always masked by both backends. Under `--json`, each command returns the serving backend's native shape.

### List Access Control Headers

```bash
b2c mrt env access-control list -p my-storefront -e staging
b2c mrt env access-control list -p my-storefront -e production --json

# Force the SCAPI backend
b2c mrt env access-control list -p my-storefront -e staging --mrt-backend scapi
```

### Create an Access Control Header

The header value is passed as a positional argument.

```bash
b2c mrt env access-control create my-secret-header-value -p my-storefront -e production

# Force the SCAPI backend
b2c mrt env access-control create my-secret-header-value -p my-storefront -e production --mrt-backend scapi
```

### Get an Access Control Header

Fetch a single header by its ID (UUID).

```bash
b2c mrt env access-control get ff832a9e-0e55-11ef-8f23-0242ac110002 -p my-storefront -e production
b2c mrt env access-control get ff832a9e-0e55-11ef-8f23-0242ac110002 -p my-storefront -e production --json
```

### Delete an Access Control Header

Delete a header by its ID (UUID).

```bash
b2c mrt env access-control delete ff832a9e-0e55-11ef-8f23-0242ac110002 -p my-storefront -e production

# Force the SCAPI backend
b2c mrt env access-control delete ff832a9e-0e55-11ef-8f23-0242ac110002 -p my-storefront -e production --mrt-backend scapi
```
