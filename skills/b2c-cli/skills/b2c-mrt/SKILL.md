---
name: b2c-mrt
description: Deploy and manage Managed Runtime (MRT) storefronts using the b2c CLI. Use this skill whenever the user needs to deploy a PWA Kit bundle, manage MRT environments and projects, set environment variables, configure URL redirects, or manage organization connections — even if they just say "deploy my PWA" or "set up a staging environment".
---

# B2C MRT Skill

Use the `b2c` CLI to manage Managed Runtime (MRT) projects, environments, bundles, and deployments for PWA Kit storefronts.

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli mrt bundle deploy`).

## Configuration & Authentication

The CLI auto-discovers the MRT API key from `SFCC_MRT_API_KEY`, `~/.mobify`, `dw.json`, `package.json`, and configuration plugins. Project and environment defaults can come from `dw.json` (`mrtProject`, `mrtEnvironment`) or env vars. **Flags like `--api-key`, `-p`, and `-e` are usually unnecessary** when defaults are configured — only pass them to override.

Run `b2c setup inspect` to see the resolved configuration and which source provided each value (use `--json` for scripting, `--unmask` to reveal secrets). For precedence rules and troubleshooting, see the `b2c-cli:b2c-config` skill.

### MRT Backends (legacy vs SCAPI)

Most MRT commands run against the legacy MRT Cloud API (API key). Two commands — `mrt bundle history` and `mrt bundle deploy <bundleId>` — can also run over the SCAPI Storefront Deployments API. Choose with `--mrt-backend` (`MRT_BACKEND`, or `mrtBackend` in `dw.json`):

- `auto` (default) — use SCAPI when it's configured (`--short-code` + `--tenant-id` + client-credentials or JWT Bearer auth; scopes `sfcc.storefront.deployments[.rw]`), otherwise legacy. Falls back to legacy on safe pre-execution errors.
- `legacy` — always the MRT Cloud API.
- `scapi` — always SCAPI, with no fallback; errors if prerequisites are missing. Also errors on unsupported commands and on the local-build push path (`deploy` with no bundle ID).

Notes:

- Under `--json`, these commands emit the **serving backend's native shape** (legacy `{count, next, previous, deployments}` vs SCAPI `{limit, offset, total, data}`). The human table is normalized; `--json` is not. Pin `legacy` or `scapi` when a script needs a stable shape.
- Legacy-only flags (`--api-key`, `--cloud-origin` / `-o`, `--credentials-file` / `-c`) are ignored — with a warning — when SCAPI serves the request.
- `--storefront` / `-s` is an alias of `--project` / `-p` (the SCAPI storefront ID is the project slug).

## Command Structure

```
mrt
├── org                          - Organizations and B2C connections
│   ├── member                   - Organization-level member management
│   └── cert                     - Custom domain certificates
├── project                      - Project management
│   ├── member                   - Team member management
│   └── notification             - Deployment notifications
├── env                          - Environment management (incl. clone)
│   ├── var                      - Environment variables
│   ├── redirect                 - URL redirects
│   └── access-control           - Access control headers
├── bundle                       - Bundle and deployment management (incl. delete)
└── user                         - User profile and settings
```

## Quick Examples

### Deploy a Bundle

```bash
# Push local build to staging
b2c mrt bundle deploy -p my-storefront -e staging

# Push to production with release message
b2c mrt bundle deploy -p my-storefront -e production -m "Release v1.0.0"

# Deploy existing bundle by ID
b2c mrt bundle deploy 12345 -p my-storefront -e production
```

### Manage Environments

```bash
# List environments
b2c mrt env list -p my-storefront

# Create a new environment
b2c mrt env create qa -p my-storefront --name "QA Environment"

# Clone an existing environment (-e is the source; positional arg is the new slug)
b2c mrt env clone qa -p my-storefront -e staging --clone-redirects --clone-env-vars

# Get environment details
b2c mrt env get -p my-storefront -e production

# Invalidate CDN cache
b2c mrt env invalidate -p my-storefront -e production
```

### Environment Variables

```bash
# List variables
b2c mrt env var list -p my-storefront -e production

# Set variables
b2c mrt env var set API_KEY=secret DEBUG=true -p my-storefront -e staging

# Delete a variable
b2c mrt env var delete OLD_VAR -p my-storefront -e production
```

### View Deployment History

```bash
# List bundles in project
b2c mrt bundle list -p my-storefront

# View deployment history for environment
b2c mrt bundle history -p my-storefront -e production

# Download a bundle artifact
b2c mrt bundle download 12345 -p my-storefront

# Delete one or more bundles (uses bulk-delete for >1)
b2c mrt bundle delete 12345 -p my-storefront
b2c mrt bundle delete 12345 12346 12347 -p my-storefront --force
```

### Organization Members and Certificates

Organization members are distinct from project members; they hold a role at the organization level. Custom-domain certificates are organization-scoped and referenced by `b2c mrt env create`/`update`/`clone` via `--certificate-id`.

```bash
# List, add, update, remove organization members
b2c mrt org member list --org my-org
b2c mrt org member add alice@example.com --org my-org --role member --view-all-projects
b2c mrt org member update alice@example.com --org my-org --no-cert-permission
b2c mrt org member remove alice@example.com --org my-org

# Manage custom domain certificates
b2c mrt org cert list --org my-org
b2c mrt org cert create shop.example.com --org my-org   # output includes the DNS validation record
b2c mrt org cert get 123 --org my-org
b2c mrt org cert restart-validation 123 --org my-org
b2c mrt org cert delete 123 --org my-org
```

### Project Management

```bash
# List projects
b2c mrt project list

# Get project details
b2c mrt project get -p my-storefront

# List project members
b2c mrt project member list -p my-storefront

# Add a member
b2c mrt project member add user@example.com -p my-storefront --role developer
```

### URL Redirects

```bash
# List redirects
b2c mrt env redirect list -p my-storefront -e production

# Create a redirect
b2c mrt env redirect create -p my-storefront -e production \
  --from "/old-path" --to "/new-path"

# Clone redirects between environments
b2c mrt env redirect clone -p my-storefront --source staging --target production
```

## Configuration

### dw.json

Configure MRT settings in your project's `dw.json`:

```json
{
  "mrtProject": "my-storefront",
  "mrtEnvironment": "staging"
}
```

### Environment Variables

```bash
export MRT_API_KEY=your-api-key
export MRT_PROJECT=my-storefront
export MRT_ENVIRONMENT=staging
export MRT_BACKEND=auto        # auto (default) | legacy | scapi
```

### ~/.mobify Config

Store your API key in `~/.mobify`:

```json
{
  "api_key": "your-mrt-api-key"
}
```

## Detailed References

- [Project Commands](references/PROJECT-COMMANDS.md) - Projects, members, and notifications
- [Environment Commands](references/ENVIRONMENT-COMMANDS.md) - Environments, variables, redirects
- [Bundle Commands](references/BUNDLE-COMMANDS.md) - Deployments, history, downloads

### More Commands

See `b2c mrt --help` for a full list of available commands and options.
