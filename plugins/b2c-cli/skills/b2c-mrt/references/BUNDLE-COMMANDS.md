# MRT Bundle Commands Reference

Detailed reference for MRT bundle deployment, listing, history, and download commands.

## Bundle Deploy

Push a local build or deploy an existing bundle to Managed Runtime.

### Push Local Build

```bash
# Push local build to project (no deployment)
b2c mrt bundle deploy --project my-storefront

# Push and deploy to staging
b2c mrt bundle deploy -p my-storefront -e staging

# Push and deploy to production with message
b2c mrt bundle deploy -p my-storefront -e production --message "Release v1.0.0"

# Push from custom build directory
b2c mrt bundle deploy -p my-storefront --build-dir ./dist

# Specify Node.js version
b2c mrt bundle deploy -p my-storefront --node-version 20.x

# Set SSR parameters
b2c mrt bundle deploy -p my-storefront --ssr-param SSRProxyPath=/api

# Multiple SSR parameters
b2c mrt bundle deploy -p my-storefront \
  --ssr-param SSRProxyPath=/api \
  --ssr-param SSRTimeout=30000
```

### Deploy Existing Bundle

```bash
# Deploy existing bundle by ID
b2c mrt bundle deploy 12345 -p my-storefront -e production

# Deploy with JSON output
b2c mrt bundle deploy 12345 -p my-storefront -e staging --json
```

**Flags:**
| Flag | Description | Default |
|------|-------------|---------|
| `--message`, `-m` | Bundle message/description | |
| `--build-dir`, `-b` | Path to build directory | `build` |
| `--ssr-only` | Server-only file patterns | `ssr.js,ssr.mjs,server/**/*` |
| `--ssr-shared` | Shared file patterns | `static/**/*,client/**/*` |
| `--node-version`, `-n` | Node.js version for SSR | `22.x` |
| `--ssr-param` | SSR parameters (key=value, can repeat) | |

## Bundle List

List bundles in a project.

```bash
b2c mrt bundle list --project my-storefront
b2c mrt bundle list -p my-storefront --limit 10
b2c mrt bundle list -p my-storefront --offset 20
b2c mrt bundle list -p my-storefront --json
```

**Output columns:** Bundle ID, Message, Status, Created

## Bundle History

View deployment history for an environment.

```bash
b2c mrt bundle history -p my-storefront -e production
b2c mrt bundle history -p my-storefront -e staging --limit 5
b2c mrt bundle history -p my-storefront -e production --json
```

**Output columns:** Bundle ID, Message, Status, Type, Created

## Bundle Download

Download a bundle artifact.

```bash
# Download to current directory (bundle-{id}.tgz)
b2c mrt bundle download 12345 -p my-storefront

# Download to specific path
b2c mrt bundle download 12345 -p my-storefront -o ./artifacts/bundle.tgz

# Get download URL only (for use in scripts)
b2c mrt bundle download 12345 -p my-storefront --url-only

# JSON output with download URL
b2c mrt bundle download 12345 -p my-storefront --json
```

## Common Workflows

### Development to Production Pipeline

```bash
# 1. Build your PWA Kit application
npm run build

# 2. Push to staging for testing
b2c mrt bundle deploy -p my-storefront -e staging -m "v1.0.0-rc1"

# 3. After testing, deploy same bundle to production
# First, find the bundle ID from the staging deployment
b2c mrt bundle list -p my-storefront --limit 1

# 4. Deploy that bundle to production
b2c mrt bundle deploy 12345 -p my-storefront -e production
```

### Rollback to Previous Bundle

```bash
# 1. View deployment history
b2c mrt bundle history -p my-storefront -e production

# 2. Deploy previous bundle
b2c mrt bundle deploy 12340 -p my-storefront -e production
```

### Download and Inspect Bundle

```bash
# Download the bundle
b2c mrt bundle download 12345 -p my-storefront -o bundle.tgz

# Extract and inspect
tar -xzf bundle.tgz
ls -la
```
