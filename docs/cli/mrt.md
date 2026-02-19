---
description: Commands for managing Managed Runtime projects, environments, bundles, and deployments.
---

# MRT Commands

Commands for managing Managed Runtime (MRT) projects, environments, and bundles for PWA Kit storefronts.

## Command Overview

| Topic | Commands | Description |
|-------|----------|-------------|
| `mrt org` | `list`, `b2c` | List organizations and B2C connections |
| `mrt project` | `list`, `create`, `get`, `update`, `delete` | Manage MRT projects |
| `mrt project member` | `list`, `add`, `get`, `update`, `remove` | Manage project members |
| `mrt project notification` | `list`, `create`, `get`, `update`, `delete` | Manage deployment notifications |
| `mrt env` | `list`, `create`, `get`, `update`, `delete`, `invalidate`, `b2c` | Manage environments |
| `mrt env var` | `list`, `set`, `delete` | Manage environment variables |
| `mrt env redirect` | `list`, `create`, `delete`, `clone` | Manage URL redirects |
| `mrt env access-control` | `list` | Manage access control headers |
| `mrt bundle` | `deploy`, `list`, `history`, `download` | Manage bundles and deployments |
| `mrt tail-logs` | | Tail real-time application logs |
| `mrt user` | `profile`, `api-key`, `email-prefs` | Manage user settings |

## Global MRT Flags

These flags are available on all MRT commands:

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--api-key` | `SFCC_MRT_API_KEY` | MRT API key |
| `--project`, `-p` | `SFCC_MRT_PROJECT` | MRT project slug |
| `--environment`, `-e` | `SFCC_MRT_ENVIRONMENT` | Target environment (e.g., staging, production) |

### Configuration Sources

MRT commands resolve configuration in the following order of precedence:

1. Command-line flags
2. Environment variables
3. `dw.json` file (`mrtProject`, `mrtEnvironment` fields)
4. `~/.mobify` config file (for `api_key`)

## Authentication

MRT commands use API key authentication. The API key is configured in the Managed Runtime dashboard.

### Getting an API Key

1. Log in to the [Managed Runtime dashboard](https://runtime.commercecloud.com/)
2. Navigate to **Account Settings** > **API Keys**
3. Copy your API key (or generate one if you haven't already)

### Configuration

Provide the API key via one of these methods:

1. **Command-line flag**: `--api-key your-api-key`
2. **Environment variable**: `export SFCC_MRT_API_KEY=your-api-key`
3. **Mobify config file**: `~/.mobify` with `api_key` field

```json
{
  "api_key": "your-mrt-api-key"
}
```

For complete setup instructions, see the [Authentication Guide](/guide/authentication#managed-runtime-api-key).

---

## Organization Commands

### b2c mrt org list

List organizations you have access to.

```bash
b2c mrt org list
b2c mrt org list --json
```

### b2c mrt org b2c

Get B2C Commerce instances connected to an organization.

```bash
b2c mrt org b2c my-organization
b2c mrt org b2c my-organization --json
```

---

## Project Commands

### b2c mrt project list

List MRT projects.

```bash
b2c mrt project list
b2c mrt project list --limit 10 --offset 0
b2c mrt project list --json
```

### b2c mrt project create

Create a new MRT project.

```bash
b2c mrt project create my-storefront --name "My Storefront"
b2c mrt project create my-storefront --name "My Storefront" --organization my-org
```

### b2c mrt project get

Get details of an MRT project.

```bash
b2c mrt project get --project my-storefront
b2c mrt project get -p my-storefront --json
```

### b2c mrt project update

Update an MRT project.

```bash
b2c mrt project update --project my-storefront --name "Updated Name"
```

### b2c mrt project delete

Delete an MRT project.

```bash
b2c mrt project delete --project my-storefront
b2c mrt project delete -p my-storefront --force
```

---

## Project Member Commands

### b2c mrt project member list

List members of an MRT project.

```bash
b2c mrt project member list --project my-storefront
b2c mrt project member list -p my-storefront --json
```

### b2c mrt project member add

Add a member to an MRT project.

```bash
b2c mrt project member add user@example.com --project my-storefront --role admin
b2c mrt project member add user@example.com -p my-storefront --role developer
```

**Roles:** `admin`, `developer`, `viewer`

### b2c mrt project member get

Get details of a project member.

```bash
b2c mrt project member get user@example.com --project my-storefront
```

### b2c mrt project member update

Update a project member's role.

```bash
b2c mrt project member update user@example.com --project my-storefront --role viewer
```

### b2c mrt project member remove

Remove a member from an MRT project.

```bash
b2c mrt project member remove user@example.com --project my-storefront
b2c mrt project member remove user@example.com -p my-storefront --force
```

---

## Project Notification Commands

Configure email notifications for deployment events.

### b2c mrt project notification list

List notifications for an MRT project.

```bash
b2c mrt project notification list --project my-storefront
```

### b2c mrt project notification create

Create a deployment notification.

```bash
# Notify on deployment failures
b2c mrt project notification create -p my-storefront \
  --target staging --target production \
  --recipient ops@example.com \
  --on-failed

# Notify on all deployment events
b2c mrt project notification create -p my-storefront \
  --target production \
  --recipient team@example.com \
  --on-start --on-success --on-failed
```

### b2c mrt project notification get

Get details of a notification.

```bash
b2c mrt project notification get abc-123 --project my-storefront
```

### b2c mrt project notification update

Update a notification.

```bash
b2c mrt project notification update abc-123 -p my-storefront --on-start --no-on-failed
```

### b2c mrt project notification delete

Delete a notification.

```bash
b2c mrt project notification delete abc-123 --project my-storefront
b2c mrt project notification delete abc-123 -p my-storefront --force
```

---

## Environment Commands

### b2c mrt env list

List environments in an MRT project.

```bash
b2c mrt env list --project my-storefront
b2c mrt env list -p my-storefront --json
```

### b2c mrt env create

Create a new environment.

```bash
# Create a staging environment
b2c mrt env create staging --project my-storefront --name "Staging Environment"

# Create a production environment in a specific region
b2c mrt env create production -p my-storefront --name "Production" \
  --production --region eu-west-1

# Create with external hostname
b2c mrt env create prod -p my-storefront --name "Production" \
  --production \
  --external-hostname www.example.com \
  --external-domain example.com
```

**Flags:**
| Flag | Description |
|------|-------------|
| `--name`, `-n` | Display name (required) |
| `--region`, `-r` | AWS region for SSR |
| `--production` | Mark as production |
| `--hostname` | Hostname pattern for V8 Tag |
| `--external-hostname` | Full external hostname |
| `--external-domain` | External domain for SSR |
| `--allow-cookies` | Forward HTTP cookies |
| `--enable-source-maps` | Enable source maps |
| `--proxy` | Proxy configuration in format `path=host` (repeatable) |
| `--wait`, `-w` | Wait for the environment to be ready before returning |

### b2c mrt env get

Get environment details.

```bash
b2c mrt env get --project my-storefront --environment staging
b2c mrt env get -p my-storefront -e production --json
```

### b2c mrt env update

Update an environment.

```bash
b2c mrt env update -p my-storefront -e staging --name "Updated Staging"
b2c mrt env update -p my-storefront -e production --allow-cookies
```

### b2c mrt env delete

Delete an environment.

```bash
b2c mrt env delete staging --project my-storefront
b2c mrt env delete old-env -p my-storefront --force
```

### b2c mrt env invalidate

Invalidate CDN cache for an environment.

```bash
# Invalidate all cached content
b2c mrt env invalidate -p my-storefront -e production

# Invalidate specific paths
b2c mrt env invalidate -p my-storefront -e production --path "/products/*" --path "/categories/*"
```

### b2c mrt env b2c

Get or update B2C Commerce connection for an environment.

```bash
# Get current B2C configuration
b2c mrt env b2c -p my-storefront -e production

# Set B2C instance connection
b2c mrt env b2c -p my-storefront -e production --instance-id aaaa_prd

# Set B2C instance with specific sites
b2c mrt env b2c -p my-storefront -e production --instance-id aaaa_prd --sites RefArch,SiteGenesis
```

---

## Environment Variable Commands

### b2c mrt env var list

List environment variables.

```bash
b2c mrt env var list --project my-storefront --environment production
b2c mrt env var list -p my-storefront -e staging --json
```

### b2c mrt env var set

Set environment variables.

```bash
# Set a single variable
b2c mrt env var set MY_VAR=value -p my-storefront -e production

# Set multiple variables
b2c mrt env var set API_KEY=secret DEBUG=true -p my-storefront -e staging

# Set value with spaces
b2c mrt env var set "MESSAGE=hello world" -p my-storefront -e production
```

### b2c mrt env var delete

Delete an environment variable.

```bash
b2c mrt env var delete MY_VAR -p my-storefront -e production
```

---

## URL Redirect Commands

### b2c mrt env redirect list

List URL redirects for an environment.

```bash
b2c mrt env redirect list -p my-storefront -e production
b2c mrt env redirect list -p my-storefront -e production --limit 50
```

### b2c mrt env redirect create

Create a URL redirect.

```bash
b2c mrt env redirect create -p my-storefront -e production \
  --from "/old-path" --to "/new-path"

# Permanent redirect (301)
b2c mrt env redirect create -p my-storefront -e production \
  --from "/legacy/*" --to "/modern/$1" --permanent
```

### b2c mrt env redirect delete

Delete a URL redirect.

```bash
b2c mrt env redirect delete abc-123 -p my-storefront -e production
```

### b2c mrt env redirect clone

Clone redirects from one environment to another.

```bash
b2c mrt env redirect clone -p my-storefront \
  --source staging --target production
```

---

## Access Control Commands

### b2c mrt env access-control list

List access control headers for an environment.

```bash
b2c mrt env access-control list -p my-storefront -e staging
b2c mrt env access-control list -p my-storefront -e staging --json
```

---

## Bundle Commands

### b2c mrt bundle deploy

Push a local build or deploy an existing bundle.

```bash
# Push local build to project
b2c mrt bundle deploy --project my-storefront

# Push and deploy to staging
b2c mrt bundle deploy -p my-storefront -e staging

# Push with release message
b2c mrt bundle deploy -p my-storefront -e production --message "Release v1.0.0"

# Push from custom build directory
b2c mrt bundle deploy -p my-storefront --build-dir ./dist

# Deploy existing bundle by ID
b2c mrt bundle deploy 12345 -p my-storefront -e production
```

**Flags:**
| Flag | Description | Default |
|------|-------------|---------|
| `--message`, `-m` | Bundle message/description | |
| `--build-dir`, `-b` | Path to build directory | `build` |
| `--ssr-only` | Server-only file patterns | `ssr.js,ssr.mjs,server/**/*` |
| `--ssr-shared` | Shared file patterns | `static/**/*,client/**/*` |
| `--node-version`, `-n` | Node.js version for SSR | `22.x` |
| `--ssr-param` | SSR parameters (key=value) | |

### b2c mrt bundle list

List bundles in a project.

```bash
b2c mrt bundle list --project my-storefront
b2c mrt bundle list -p my-storefront --limit 10
b2c mrt bundle list -p my-storefront --json
```

### b2c mrt bundle history

View deployment history for an environment.

```bash
b2c mrt bundle history -p my-storefront -e production
b2c mrt bundle history -p my-storefront -e staging --limit 5
```

### b2c mrt bundle download

Download a bundle artifact.

```bash
# Download to current directory
b2c mrt bundle download 12345 -p my-storefront

# Download to specific path
b2c mrt bundle download 12345 -p my-storefront -o ./artifacts/bundle.tgz

# Get download URL only
b2c mrt bundle download 12345 -p my-storefront --url-only
```

---

## Tail Logs

### b2c mrt tail-logs

Tail application logs from a Managed Runtime environment in real time. Connects via WebSocket and streams log entries until interrupted with Ctrl+C.

```bash
# Tail all logs
b2c mrt tail-logs -p my-storefront -e staging

# Filter by log level
b2c mrt tail-logs -p my-storefront -e production --level ERROR --level WARN

# Search with regex pattern
b2c mrt tail-logs -p my-storefront -e staging --search "timeout"

# Search with OR pattern
b2c mrt tail-logs -p my-storefront -e staging --search "GET|POST"

# Output as JSON
b2c mrt tail-logs -p my-storefront -e staging --json
```

**Flags:**
| Flag | Description |
|------|-------------|
| `--level` | Filter by log level (ERROR, WARN, INFO, DEBUG, etc.). Repeatable for multiple levels. |
| `--search`, `-g` | Filter entries matching a regex pattern (case-insensitive) |
| `--no-color` | Disable colored output |

---

## User Commands

### b2c mrt user profile

View your MRT user profile.

```bash
b2c mrt user profile
b2c mrt user profile --json
```

### b2c mrt user api-key

Reset your MRT API key.

```bash
b2c mrt user api-key --reset
```

### b2c mrt user email-prefs

View or update email preferences.

```bash
# View current preferences
b2c mrt user email-prefs

# Update preferences
b2c mrt user email-prefs --marketing --no-notifications
```

---

## Common Workflows

### Deploy to Production

```bash
# 1. Push and deploy to staging for testing
b2c mrt bundle deploy -p my-storefront -e staging -m "v1.0.0-rc1"

# 2. After testing, deploy to production
b2c mrt bundle deploy -p my-storefront -e production -m "v1.0.0"

# 3. Or deploy an existing bundle
b2c mrt bundle deploy 12345 -p my-storefront -e production
```

### Set Up a New Environment

```bash
# 1. Create the environment
b2c mrt env create qa -p my-storefront --name "QA Environment" --region us-east-1

# 2. Configure environment variables
b2c mrt env var set API_URL=https://api.qa.example.com -p my-storefront -e qa

# 3. Deploy a bundle
b2c mrt bundle deploy -p my-storefront -e qa
```

### Invalidate Cache After Content Update

```bash
# Invalidate specific paths
b2c mrt env invalidate -p my-storefront -e production \
  --path "/products/*" --path "/categories/*"
```
