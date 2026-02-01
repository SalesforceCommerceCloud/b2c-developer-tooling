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
```

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
```

### Invalidate Cache

Invalidate CDN cached content for an environment.

```bash
# Invalidate all cached content
b2c mrt env invalidate -p my-storefront -e production

# Invalidate specific paths
b2c mrt env invalidate -p my-storefront -e production \
  --path "/products/*" --path "/categories/*"
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

### List Variables

```bash
b2c mrt env var list --project my-storefront --environment production
b2c mrt env var list -p my-storefront -e staging --json
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

# Using environment variables for auth
export SFCC_MRT_API_KEY=your-api-key
export SFCC_MRT_PROJECT=my-storefront
export SFCC_MRT_ENVIRONMENT=staging
b2c mrt env var set MY_VAR=value
```

### Delete Variable

```bash
b2c mrt env var delete MY_VAR -p my-storefront -e production
```

## URL Redirects

### List Redirects

```bash
b2c mrt env redirect list -p my-storefront -e production
b2c mrt env redirect list -p my-storefront -e production --limit 50
b2c mrt env redirect list -p my-storefront -e production --json
```

### Create Redirect

```bash
# Basic redirect
b2c mrt env redirect create -p my-storefront -e production \
  --from "/old-path" --to "/new-path"

# Permanent redirect (301)
b2c mrt env redirect create -p my-storefront -e production \
  --from "/legacy/*" --to "/modern/$1" --permanent

# Temporary redirect (302, default)
b2c mrt env redirect create -p my-storefront -e production \
  --from "/promo" --to "/sale"
```

### Delete Redirect

```bash
b2c mrt env redirect delete abc-123 -p my-storefront -e production
b2c mrt env redirect delete abc-123 -p my-storefront -e production --force
```

### Clone Redirects

Copy redirects from one environment to another.

```bash
b2c mrt env redirect clone -p my-storefront \
  --source staging --target production
```

## Access Control Headers

### List Access Control Headers

```bash
b2c mrt env access-control list -p my-storefront -e staging
b2c mrt env access-control list -p my-storefront -e production --json
```
