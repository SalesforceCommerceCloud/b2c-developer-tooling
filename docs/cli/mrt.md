# MRT Commands

Commands for managing Managed Runtime (MRT) projects, environments, and bundles.

## Global MRT Flags

These flags are available on all MRT commands:

| Flag | Short | Environment Variable | Description |
|------|-------|---------------------|-------------|
| `--api-key` | | `SFCC_MRT_API_KEY` | MRT API key |
| `--project` | `-p` | `SFCC_MRT_PROJECT` | MRT project slug |
| `--environment` | `-e` | `SFCC_MRT_ENVIRONMENT` | Target environment (e.g., staging, production) |

### Configuration Sources

MRT commands resolve configuration in the following order of precedence:

1. Command-line flags
2. Environment variables
3. `dw.json` file (`mrtProject`, `mrtEnvironment` fields)
4. `~/.mobify` config file (for `api_key`)

---

## b2c mrt push

Push a bundle to Managed Runtime.

Creates a bundle from the build directory and uploads it to the specified MRT project. Optionally deploys the bundle to a target environment.

### Usage

```bash
b2c mrt push [FLAGS]
```

### Flags

In addition to [global MRT flags](#global-mrt-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--message` | `-m` | Bundle message/description | |
| `--build-dir` | `-b` | Path to the build directory | `build` |
| `--ssr-only` | | Glob patterns for server-only files (comma-separated) | `ssr.js,server/**/*` |
| `--ssr-shared` | | Glob patterns for shared files (comma-separated) | `static/**/*,client/**/*` |
| `--node-version` | `-n` | Node.js version for SSR runtime | `20.x` |
| `--ssr-param` | | SSR parameter in key=value format (can be specified multiple times) | |
| `--json` | | Output result as JSON | |

### Examples

```bash
# Push a bundle to a project
b2c mrt push --project my-storefront

# Push and deploy to staging
b2c mrt push --project my-storefront --environment staging

# Push with a release message
b2c mrt push --project my-storefront --environment production --message "Release v1.0.0"

# Push from a custom build directory
b2c mrt push --project my-storefront --build-dir ./dist

# Specify Node.js version for SSR
b2c mrt push --project my-storefront --node-version 20.x

# Set SSR parameters
b2c mrt push --project my-storefront --ssr-param SSRProxyPath=/api

# Using environment variables
export SFCC_MRT_API_KEY=your-api-key
export SFCC_MRT_PROJECT=my-storefront
export SFCC_MRT_ENVIRONMENT=staging
b2c mrt push
```

### Output

On success, the command displays the bundle ID, project, and deployment status:

```
Pushing bundle to my-storefront...
Bundle will be deployed to staging
Bundle #42 pushed to my-storefront and deployed to staging (Release v1.0.0)
```

---

## b2c mrt env create

Create a new environment (target) in a Managed Runtime project.

### Usage

```bash
b2c mrt env create SLUG [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SLUG` | Environment slug/identifier (e.g., staging, production) | Yes |

### Flags

In addition to [global MRT flags](#global-mrt-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--name` | `-n` | Display name for the environment | **Required** |
| `--region` | `-r` | AWS region for SSR deployment | |
| `--production` | | Mark as a production environment | `false` |
| `--hostname` | | Hostname pattern for V8 Tag loading | |
| `--external-hostname` | | Full external hostname (e.g., www.example.com) | |
| `--external-domain` | | External domain for Universal PWA SSR (e.g., example.com) | |
| `--allow-cookies` | | Forward HTTP cookies to origin | `false` |
| `--no-allow-cookies` | | Disable cookie forwarding | |
| `--enable-source-maps` | | Enable source map support in the environment | `false` |
| `--no-enable-source-maps` | | Disable source map support | |
| `--json` | | Output result as JSON | |

### Supported Regions

Available AWS regions: `us-east-1`, `us-east-2`, `us-west-1`, `us-west-2`, `ap-south-1`, `ap-south-2`, `ap-northeast-1`, `ap-northeast-2`, `ap-northeast-3`, `ap-southeast-1`, `ap-southeast-2`, `ap-southeast-3`, `ca-central-1`, `eu-central-1`, `eu-central-2`, `eu-west-1`, `eu-west-2`, `eu-west-3`, `eu-north-1`, `eu-south-1`, `il-central-1`, `me-central-1`, `sa-east-1`

### Examples

```bash
# Create a staging environment
b2c mrt env create staging --project my-storefront --name "Staging Environment"

# Create a production environment
b2c mrt env create production --project my-storefront --name "Production" --production

# Create an environment in a specific region
b2c mrt env create feature-test -p my-storefront -n "Feature Test" --region eu-west-1

# Create with external hostname configuration
b2c mrt env create prod -p my-storefront -n "Production" --production \
  --external-hostname www.example.com \
  --external-domain example.com

# Output as JSON
b2c mrt env create staging -p my-storefront -n "Staging" --json
```

### Output

On success, displays the created environment details:

```
Creating environment "staging" in my-storefront...
Environment created successfully.

Slug:              staging
Name:              Staging Environment
Project:           my-storefront
State:             created
Production:        No
Region:            us-east-1
Hostname:          staging-my-storefront.mobify-storefront.com
```

---

## b2c mrt env delete

Delete an environment (target) from a Managed Runtime project.

### Usage

```bash
b2c mrt env delete SLUG [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `SLUG` | Environment slug/identifier to delete | Yes |

### Flags

In addition to [global MRT flags](#global-mrt-flags):

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--force` | `-f` | Skip confirmation prompt | `false` |
| `--json` | | Output result as JSON | |

### Examples

```bash
# Delete an environment (with confirmation prompt)
b2c mrt env delete feature-test --project my-storefront

# Delete without confirmation
b2c mrt env delete old-staging -p my-storefront --force
```

### Notes

- The command will prompt for confirmation unless `--force` is used
- Be cautious when deleting production environments

---

## b2c mrt env var list

List environment variables on a Managed Runtime environment.

### Usage

```bash
b2c mrt env var list [FLAGS]
```

### Flags

Uses [global MRT flags](#global-mrt-flags). Both `--project` and `--environment` are required.

| Flag | Description |
|------|-------------|
| `--json` | Output result as JSON |

### Examples

```bash
# List environment variables
b2c mrt env var list --project acme-storefront --environment production

# Short form
b2c mrt env var list -p my-project -e staging

# Output as JSON
b2c mrt env var list -p my-project -e production --json
```

### Output

Displays a table of environment variables:

```
Listing env vars for my-project/production...
Name              Value                    Status      Updated
─────────────────────────────────────────────────────────────────────
API_KEY           sk-xxx...xxx             Published   12/10/2024, 2:30:00 PM
DEBUG             false                    Published   12/9/2024, 10:15:00 AM
FEATURE_FLAG      enabled                  Pending     12/10/2024, 3:00:00 PM
```

---

## b2c mrt env var set

Set environment variables on a Managed Runtime environment.

### Usage

```bash
b2c mrt env var set KEY=value [KEY=value...] [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `KEY=value` | Environment variable(s) in KEY=value format | Yes |

### Flags

Uses [global MRT flags](#global-mrt-flags). Both `--project` and `--environment` are required.

| Flag | Description |
|------|-------------|
| `--json` | Output result as JSON |

### Examples

```bash
# Set a single environment variable
b2c mrt env var set MY_VAR=value --project acme-storefront --environment production

# Set multiple environment variables
b2c mrt env var set API_KEY=secret DEBUG=true -p my-project -e staging

# Set a value with spaces (use quotes)
b2c mrt env var set "MESSAGE=hello world" -p my-project -e production

# Using environment variables for auth
export SFCC_MRT_API_KEY=your-api-key
export SFCC_MRT_PROJECT=my-project
export SFCC_MRT_ENVIRONMENT=staging
b2c mrt env var set MY_VAR=value
```

### Notes

- Variable values are set immediately but may take time to propagate
- Use quotes around values containing spaces
- Multiple variables can be set in a single command

---

## b2c mrt env var delete

Delete an environment variable from a Managed Runtime environment.

### Usage

```bash
b2c mrt env var delete KEY [FLAGS]
```

### Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `KEY` | Environment variable name to delete | Yes |

### Flags

Uses [global MRT flags](#global-mrt-flags). Both `--project` and `--environment` are required.

| Flag | Description |
|------|-------------|
| `--json` | Output result as JSON |

### Examples

```bash
# Delete an environment variable
b2c mrt env var delete MY_VAR --project acme-storefront --environment production

# Short form
b2c mrt env var delete OLD_API_KEY -p my-project -e staging
```

---

## Authentication

All MRT commands use API key authentication. You can provide credentials in several ways:

1. **Command-line flag**: `--api-key your-api-key`
2. **Environment variable**: `export SFCC_MRT_API_KEY=your-api-key`
3. **Mobify config file**: `~/.mobify` with `api_key` field

### Getting an API Key

Obtain your MRT API key from the Managed Runtime dashboard in your Salesforce Commerce Cloud account.

### Example ~/.mobify File

```json
{
  "api_key": "your-mrt-api-key"
}
```
