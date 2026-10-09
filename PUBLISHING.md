# Publishing

This document is a playbook for releasing the B2C CLI monorepo packages. It covers the day-to-day flows for contributors and maintainers.

## What Gets Published

Three packages are published to npm, each versioned independently:

| Package                       | npm                                                              |
| ----------------------------- | ---------------------------------------------------------------- |
| `@salesforce/b2c-cli`         | [npm](https://www.npmjs.com/package/@salesforce/b2c-cli)         |
| `@salesforce/b2c-tooling-sdk` | [npm](https://www.npmjs.com/package/@salesforce/b2c-tooling-sdk) |
| `@salesforce/b2c-dx-mcp`      | [npm](https://www.npmjs.com/package/@salesforce/b2c-dx-mcp)      |

When a dependency is bumped (e.g., the SDK), dependent packages automatically receive a patch bump. The `@salesforce/b2c-dx-docs` workspace package is private and uses git tags to trigger documentation rebuilds — it is not published to npm.

## Release Types

| Type               | npm Tag                     | Trigger                                |
| ------------------ | --------------------------- | -------------------------------------- |
| **Stable**         | `@latest`                   | Merge version PR on `main`             |
| **Release Branch** | `@latest` or `@release-X.Y` | Push to `release/**` branch            |
| **Nightly**        | `@nightly`                  | Scheduled weekdays 2 AM UTC, or manual |

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
   - Releases the GitHub Actions at the new CLI version (when the CLI was published)
   - Pins the `b2c-dx-mcp` plugin to the new MCP version once npm serves it (when the MCP server was published to `latest`)

No manual tagging or workflow dispatch is needed.

A stable CLI publish also releases the GitHub Actions at the same version (see [GitHub Actions Releases](#github-actions-releases)).

## MCP Plugin Pin

The `b2c-dx-mcp` plugin (`plugins/b2c-dx-mcp/`, its Claude marketplace entry and Codex manifest) launches an exact `@salesforce/b2c-dx-mcp@X.Y.Z` with `npx`. The version PR does not change it: plugin manifests are live as soon as they reach `main`, and pinning a version npm does not serve yet leaves new installs failing to start.

After a stable MCP publish to `latest`, `publish.yml` dispatches **Pin MCP Plugin**. It waits until npm serves the version (plus the registry's 5-minute cache period), runs `scripts/pin-mcp-plugin.mjs`, and pushes the pin to `main`. If npm does not serve it within 30 minutes the run fails and the plugin keeps the previous version; retry with `gh workflow run pin-mcp-plugin.yml -f version=X.Y.Z`.

## GitHub Actions Releases

GitHub Actions are released with the CLI and share its version:

- `pnpm run version` (run by `changesets.yml` for the version PR) calls `scripts/sync-actions-version.mjs`, which sets `actions/VERSION` to the new `@salesforce/b2c-cli` version, pins every internal `actions/setup` / `actions/run` reference to that exact `vX.Y.Z`, and sets the `version` input default to the CLI major.
- When a stable CLI version is published, `publish.yml` dispatches **Release GitHub Actions** with the CLI's package tag (e.g. `@salesforce/b2c-cli@2.2.0`). It validates the Action metadata, installs the CLI major, runs a smoke test, creates the immutable `vX.Y.Z` tag, and moves the floating `vX` tag.
- The floating tag only moves forward. A maintenance release from a `release/*` branch gets its exact tag, but `vX` stays on the newest release.
- `v2` follows Action 2.x releases and installs CLI 2.x by default. `v1` follows the maintained Action 1.x line on the `actions/v1` branch and installs CLI 1.x by default.
- Exact tags such as `v2.2.0` are immutable. The release workflow refuses to move an existing exact tag to another commit.

Changes to the Actions (`action.yml`, `actions/`) ship with the next CLI release, so give them a `@salesforce/b2c-cli` changeset.

To release manually (for example, to retry a failed run or release from `actions/v1`), run **Release GitHub Actions** and select the source ref. Prefer an immutable package tag over a moving branch.

### Establish the Action v1 Maintenance Branch

Complete this once before publishing CLI 2.0:

1. Create `actions/v1` from the current floating `v1` tag.
2. Add `actions/VERSION` containing `1.0.0`.
3. Change the `version` input default from `latest` to `1` in the root, setup, and five high-level Action manifests. Change their internal references to `@v1.0.0`.
4. Review and push the compatibility commit to `actions/v1`.
5. Run **Release GitHub Actions** with `ref` set to `actions/v1`. It creates immutable `v1.0.0` and moves floating `v1` to the compatibility commit.

Do not publish CLI 2.0 until this is complete. The older v1 setup action defaults to npm `latest`; freezing the tag without changing that default would still let npm `latest` pull CLI 2.0.

The stable package workflow enforces this ordering. Publishing a new CLI major fails unless the previous floating Action major exists, declares its own version, defaults to the previous CLI major, and pins its internal Action references to its exact release.

## Release Branches

Use when you need to ship a fix independently of `main`. There are two scenarios:

1. **Hotfix from latest** — urgent patch while unrelated changesets are pending on `main`. Publishes to `@latest`.
2. **Maintenance patch** — fix for an older minor version (e.g., patching `0.4.x` when `@latest` is `0.5.0`). Publishes to a scoped dist-tag like `@release-0.4`.

**Why:** Changesets consumes all pending changesets atomically — you can't release one package while holding others. Release branches let you version and publish independently of `main`.

Package branch naming convention: `release/<major.minor>` (e.g., `release/0.5`). This is self-documenting and allows reuse for multiple patches to the same minor. The separate `actions/v1` branch is reserved for the GitHub Action compatibility line and does not trigger package publishing.

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

Stable docs are rebuilt only when a package publishes to `@latest` (hotfix from the current minor or a regular release) or when a doc-only release is created. Maintenance patches on older minors (which publish to scoped dist-tags like `@release-0.4`) do not trigger a docs rebuild.

### PR Previews

Pull requests that change `docs/**` get a temporary rendered preview of the docs site so reviewers can see the changes before merge. The `Docs Preview` workflow (`.github/workflows/docs-preview.yml`) builds the site with a per-PR base path (`/pr-<number>/`), publishes it to S3 behind CloudFront, and posts the preview URL as a PR comment. The comment updates on every push and the preview is removed when the PR is closed.

You can also build a preview on demand — including for a PR that didn't touch `docs/**` — via **Actions → Docs Preview → Run workflow**, passing the PR number as the `pr_number` input. (Dispatching the workflow requires write access, so this is maintainer-gated.)

Previews run only for PRs raised from branches in this repository — **not from forks** (forks can't access the deployment credentials). Fork PRs still have their docs build validated by the `Docs Build` workflow; they just don't get a hosted preview. The preview deploy is a no-op until the AWS preview infrastructure (S3 bucket, CloudFront distribution, and OIDC role) and the corresponding repo secrets/variables are configured.

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
