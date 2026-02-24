# Publishing

This document is a playbook for releasing the B2C CLI monorepo packages. It covers the day-to-day flows for contributors and maintainers.

## What Gets Published

Three packages are published to npm, each versioned independently:

| Package | npm |
|---------|-----|
| `@salesforce/b2c-cli` | [npm](https://www.npmjs.com/package/@salesforce/b2c-cli) |
| `@salesforce/b2c-tooling-sdk` | [npm](https://www.npmjs.com/package/@salesforce/b2c-tooling-sdk) |
| `@salesforce/b2c-dx-mcp` | [npm](https://www.npmjs.com/package/@salesforce/b2c-dx-mcp) |

When a dependency is bumped (e.g., the SDK), dependent packages automatically receive a patch bump. The `@salesforce/b2c-dx-docs` workspace package is private and uses git tags to trigger documentation rebuilds — it is not published to npm.

## Release Types

| Type | npm Tag | Trigger |
|------|---------|---------|
| **Stable** | `@latest` | Merge version PR on `main` |
| **Release Branch** | `@latest` or `@release-X.Y` | Push to `release/**` branch |
| **Nightly** | `@nightly` | Scheduled weekdays 2 AM UTC, or manual |

Publishing uses [npm OIDC trusted publishers](https://docs.npmjs.com/trusted-publishers) — no npm tokens are needed. Provenance attestations are generated automatically.

## Creating a Changeset

Every PR with user-facing changes should include a changeset:

```bash
pnpm changeset
```

1. Select the packages you directly changed
2. Choose `patch` (bug fixes) or `minor` (new features) — no `major` bumps pre-1.0
3. Write a brief user-facing summary (this goes in the changelog)
4. Commit the generated `.changeset/*.md` file with your PR

Only list packages you directly changed — dependent packages are bumped automatically.

**Don't need a changeset:** internal refactoring, test improvements, CI changes.

## Stable Release

This is the normal release flow from `main`.

1. **Merge PRs with changesets** to `main`

2. **Review the "Next Release" PR** — created automatically by `changesets.yml`:
   - Bumps versions in `package.json` files
   - Updates `CHANGELOG.md` files
   - Removes consumed changeset files

3. **Merge the version PR** — `publish.yml` runs automatically:
   - Publishes changed packages to npm
   - Creates per-package git tags (e.g., `@salesforce/b2c-cli@0.4.1`)
   - Creates a GitHub Release with aggregated changelogs
   - Triggers a documentation rebuild

No manual tagging or workflow dispatch is needed.

## Release Branches

Use when you need to ship a fix independently of `main`. There are two scenarios:

1. **Hotfix from latest** — urgent patch while unrelated changesets are pending on `main`. Publishes to `@latest`.
2. **Maintenance patch** — fix for an older minor version (e.g., patching `0.4.x` when `@latest` is `0.5.0`). Publishes to a scoped dist-tag like `@release-0.4`.

**Why:** Changesets consumes all pending changesets atomically — you can't release one package while holding others. Release branches let you version and publish independently of `main`.

Branch naming convention: `release/<major.minor>` (e.g., `release/0.5`). This is self-documenting and allows reuse for multiple patches to the same minor.

### Steps

1. **Find the tag to branch from:**

   ```bash
   git tag --list '@salesforce/*' --sort=-creatordate | head -n5
   ```

2. **Create a release branch:**

   ```bash
   # Hotfix from latest (e.g., latest is 0.5.0)
   git checkout -b release/0.5 @salesforce/b2c-cli@0.5.0

   # Maintenance patch on older minor (e.g., latest is 0.5.0, patching 0.4.x)
   git checkout -b release/0.4 @salesforce/b2c-cli@0.4.2
   ```

3. **Cherry-pick or apply the fix**, then create and consume a changeset:

   ```bash
   git cherry-pick <commit-sha>
   pnpm changeset          # create changeset for the fix
   pnpm changeset version  # consume it — bumps versions and changelogs
   git add -A && git commit -m "Version packages"
   ```

4. **Push the branch:**

   ```bash
   git push -u origin release/0.5
   ```

5. **Publishing happens automatically** — CI runs, and on success `publish.yml` triggers. No manual dispatch needed.

6. **Review the auto-created PR** that merges version bumps back to `main`. Merge it to prevent version collisions on the next regular release.

7. **Delete the release branch** after the merge-back PR is merged (or keep it for future patches to the same minor).

### Older minor version patching

When the release branch targets an older minor (e.g., `0.4.3` when `@latest` is `0.5.0`), the publish workflow automatically uses a scoped dist-tag (`release-0.4`) instead of `@latest`, preventing `@latest` from moving backward. Users install with:

```bash
npm install @salesforce/b2c-cli@release-0.4
```

## Nightly Release

Nightlies run automatically on weekdays at 2 AM UTC. To trigger one manually:

1. Go to **Actions** → **Publish to npm**
2. Click **Run workflow** → select `nightly` → **Run workflow**

Nightlies publish as `0.0.0-nightly.<timestamp>` to the `@nightly` tag. They don't create GitHub releases or git tags.

## Doc-Only Release

To deploy documentation changes without bumping CLI/SDK/MCP versions, create a changeset targeting only the docs package:

```md
---
'@salesforce/b2c-dx-docs': patch
---

Improved authentication guide with step-by-step examples
```

This follows the normal [stable release](#stable-release) flow — the version PR will only bump the docs package, and on merge a `docs@<version>` tag triggers a documentation rebuild. No npm packages are published.

Use this for significant documentation improvements (new guides, restructured content) that should go live before the next package release. Routine typo fixes can wait for the next package release and don't need a changeset.

SDK version bumps automatically cascade to the docs package (since API docs are generated from the SDK), so a separate docs changeset isn't needed when the SDK changes.

## Documentation Deployment

The documentation site serves two versions:

- **Stable** (root URL) — built from the most recent release tag (across all branches)
- **Dev** (`/dev/`) — built from `main`, updated on every push

Stable docs are rebuilt after every stable or release branch publish. The `deploy-docs.yml` workflow finds the most recent release tag by creation date across all branches, so tags from release branches are picked up automatically.

## Local Testing

```bash
# Dry-run publish (see what would be published)
pnpm run build
pnpm --filter @salesforce/b2c-tooling-sdk --filter @salesforce/b2c-cli --filter @salesforce/b2c-dx-mcp publish --access public --dry-run

# Preview version bumps
pnpm changeset version --dry-run
```

## Troubleshooting

**Version PR not created** — Check the `changesets.yml` workflow in the Actions tab. Verify changeset files exist in `.changeset/` (besides `README.md` and `config.json`).

**Packages not published after version PR merge** — Check the `publish.yml` workflow run. The workflow compares local versions against npm — if they already match, nothing is published. Verify `changesets.yml` successfully dispatched `publish.yml`.

**OIDC publish fails** — Verify trusted publishers are configured on npmjs.com for each package (Settings → Publishing access → Trusted Publishers). The workflow filename must match exactly (`publish.yml`).

**No changesets found** — Ensure changeset files exist in `.changeset/` and reference correct package names (`@salesforce/b2c-cli`, `@salesforce/b2c-tooling-sdk`, `@salesforce/b2c-dx-mcp`, `@salesforce/b2c-dx-docs`).
