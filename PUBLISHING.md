# Publishing

This document describes the release and publishing process for the B2C CLI monorepo packages.

## Overview

The project uses:
- **[Changesets](https://github.com/changesets/changesets)** for version management and changelog generation
- **[npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)** with OIDC for secure, tokenless publishing
- **Two-workflow architecture** separating version management from publishing

## Release Types

| Type | npm Tag | Trigger | GitHub Release |
|------|---------|---------|----------------|
| **Stable** (`1.0.0`) | `@latest` | Git tag `v1.0.0` | Release |
| **Pre-release** (`1.0.0-beta.1`) | `@next` | Git tag `v1.0.0-beta.1` | Pre-release |
| **Nightly** (`0.0.1-nightly-20250113`) | `@nightly` | Scheduled (weekdays) or manual | None |

### Installing Different Versions

```bash
# Stable release (default)
npm install @salesforce/b2c-cli

# Pre-release (beta, preview, rc)
npm install @salesforce/b2c-cli@next

# Nightly snapshot
npm install @salesforce/b2c-cli@nightly
```

## Published Packages

Only these three packages are published to npm:

| Package | npm | Description |
|---------|-----|-------------|
| `@salesforce/b2c-cli` | [npm](https://www.npmjs.com/package/@salesforce/b2c-cli) | Command line interface |
| `@salesforce/b2c-tooling-sdk` | [npm](https://www.npmjs.com/package/@salesforce/b2c-tooling-sdk) | SDK/library for B2C operations |
| `@salesforce/b2c-dx-mcp` | [npm](https://www.npmjs.com/package/@salesforce/b2c-dx-mcp) | MCP server |

These packages are **linked** in changesets configuration, meaning they always version together.

**Not published:**
- `@salesforce/b2c-plugin-example-config` - Example plugin for reference only
- `@salesforce/b2c-cli-root` - Monorepo root package

The publish workflow explicitly filters to only these three packages using `--filter`.

## Architecture

### Workflow 1: `changesets.yml` - Version Management

- **Trigger**: Push to `main` branch
- **Purpose**: Creates/updates a "Version Packages" PR when changesets exist
- **Permissions**: `contents: write`, `pull-requests: write`
- **Does NOT publish** - no npm interaction

### Workflow 2: `publish.yml` - npm Publishing

- **Triggers**:
  - Push of version tags (`v1.0.0`, `v1.0.0-beta.1`, etc.) - stable/pre-releases
  - Schedule (weekdays at 2 AM UTC) - nightly snapshots
  - Manual `workflow_dispatch` - on-demand nightly
- **Purpose**: Publishes packages to npm and creates GitHub Releases (for tag-based releases)
- **Permissions**: `contents: write`, `id-token: write` (for OIDC)
- **Security**: Uses npm OIDC trusted publishers - no npm token required

## Release Process

### For Contributors

When making changes that should be released:

1. **Create a changeset** describing your changes:

   ```bash
   pnpm changeset
   ```

2. **Select the change type**:
   - `patch` - Bug fixes, documentation updates
   - `minor` - New features, non-breaking changes
   - `major` - Breaking changes

3. **Write a summary** - This appears in the changelog

4. **Commit the changeset file** along with your code changes

5. **Open a PR** - The changeset file (`.changeset/*.md`) should be included

### For Maintainers

When ready to release:

1. **Merge PRs with changesets** to `main`

2. **Review the Version PR** - The `changesets.yml` workflow automatically creates a "Version Packages" PR that:
   - Bumps versions in all `package.json` files
   - Updates `CHANGELOG.md` files
   - Removes consumed changeset files

3. **Merge the Version PR** when ready to release

4. **Create and push a version tag**:

   ```bash
   # Get the new version from package.json
   VERSION=$(node -p "require('./packages/b2c-tooling-sdk/package.json').version")

   # Create and push the tag
   git tag "v$VERSION"
   git push origin "v$VERSION"
   ```

5. **Monitor the publish** - The `publish.yml` workflow will:
   - Validate the tag matches package versions
   - Build and test all packages
   - Publish to npm via OIDC
   - Create a GitHub Release with aggregated changelogs

### Pre-releases (Beta, Preview, RC)

For pre-release versions, use changesets pre-release mode:

```bash
# Enter pre-release mode
pnpm changeset pre enter beta

# Continue normal workflow: create changesets, merge version PR
# Versions will be like 1.0.0-beta.0, 1.0.0-beta.1, etc.

# Exit pre-release mode when ready for stable
pnpm changeset pre exit
```

Pre-release tags (`v1.0.0-beta.1`) publish to `@next` and create GitHub Pre-releases.

### Nightly Releases

Nightly releases run automatically on weekdays at 2 AM UTC. They can also be triggered manually:

1. Go to **Actions** → **Publish to npm** workflow
2. Click **Run workflow**
3. Select `nightly` and click **Run workflow**

Nightly versions use changesets snapshot format: `0.0.1-nightly-20250113`

**Notes:**
- Nightly releases do NOT create GitHub releases
- They publish to the `@nightly` npm tag
- Each nightly overwrites the previous `@nightly` tag

## Changeset Configuration

Configuration is in `.changeset/config.json`:

```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "..." }],
  "linked": [
    ["@salesforce/b2c-cli", "@salesforce/b2c-tooling-sdk", "@salesforce/b2c-dx-mcp"]
  ],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@salesforce/b2c-plugin-example-config"]
}
```

Key settings:
- **linked**: All three main packages version together
- **access**: Packages are published as public
- **ignore**: Example plugin is not published
- **updateInternalDependencies**: Automatically bumps internal deps

## npm Trusted Publishers (OIDC)

This project uses npm's OIDC trusted publishers instead of npm tokens:

### How It Works

1. npm is configured to trust publishes from the `publish.yml` workflow
2. GitHub Actions generates a short-lived OIDC token during workflow execution
3. The token is automatically used by `pnpm publish` - no secrets needed
4. Provenance attestations are automatically generated

### Benefits

- **No token management** - No npm tokens to rotate or secure
- **Audit trail** - Every publish is linked to a specific workflow run
- **Provenance** - Packages include attestations proving where they were built
- **Security** - Only the specific workflow can publish, not any repository secret holder

### Configuration (npmjs.com)

Each package must be configured on npmjs.com:

1. Navigate to package → Settings → Publishing access → Trusted Publishers
2. Add GitHub Actions trusted publisher:
   - **Owner**: `SalesforceCommerceCloud`
   - **Repository**: `b2c-developer-tooling`
   - **Workflow**: `publish.yml`
   - **Environment**: (leave empty)

## Troubleshooting

### "Tag version does not match package version"

The `publish.yml` workflow validates that the git tag matches the version in `package.json`. Ensure:
1. The "Version Packages" PR was merged
2. You pulled the latest `main` before tagging
3. The tag matches exactly (e.g., `v1.0.0` for version `1.0.0`)

### "No changesets found"

If `pnpm changeset status` shows no pending changes but you expect some:
1. Ensure changeset files exist in `.changeset/` (not including `README.md` and `config.json`)
2. Check that the changeset files reference the correct package names

### OIDC publish fails

If publishing fails with authentication errors:
1. Verify trusted publishers are configured on npmjs.com for all packages
2. Ensure the workflow filename matches exactly (`publish.yml`)
3. Check that `id-token: write` permission is set in the workflow

### Version PR not created

If no "Version Packages" PR appears after merging changesets:
1. Check the Actions tab for `changesets.yml` workflow runs
2. Verify changesets exist (files in `.changeset/` besides config)
3. Ensure the workflow has necessary permissions

## Local Testing

### Dry-run publish

Test what would be published without actually publishing:

```bash
pnpm run build
pnpm --filter @salesforce/b2c-tooling-sdk --filter @salesforce/b2c-cli --filter @salesforce/b2c-dx-mcp publish --access public --dry-run
```

Note: Only the three main packages are published. The example plugin and root package are excluded.

### Test changeset version

See what versions would be bumped:

```bash
pnpm changeset version --dry-run
```

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
