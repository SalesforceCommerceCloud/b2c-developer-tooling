# Publishing the B2C DX VS Code Extension

The extension is built in this monorepo and published to the marketplaces from a separate Salesforce-owned repository, [`forcedotcom/b2c-dx`](https://github.com/forcedotcom/b2c-dx). The marketplace requires the extension's repository URL to live under that org. Each release goes through a **review PR** in `forcedotcom/b2c-dx` so a human can inspect and approve it before anything reaches the marketplaces.

## Where things live

| What | Where |
|---|---|
| Source code, dev workflow, issues, PRs | This monorepo (`SalesforceCommerceCloud/b2c-developer-tooling`) |
| VSIX build (`vsce package` + `inject-script-types.mjs`) | This monorepo's `publish.yml` workflow |
| Tagged GitHub release with VSIX attached | This monorepo (tag: `b2c-vs-extension@X.Y.Z`) |
| Release review PR | `forcedotcom/b2c-dx` (branch `release/b2c-vs-extension-X.Y.Z`) |
| Marketplace landing page, governance, publish workflows | `forcedotcom/b2c-dx` |
| Mirrored release with the same VSIX asset | `forcedotcom/b2c-dx` (created on PR merge; tag `b2c-vs-extension@X.Y.Z`) |
| `vsce publish` to VS Code Marketplace | `forcedotcom/b2c-dx` workflow `publish-vscode.yml` |
| `ovsx publish` to Open VSX | `forcedotcom/b2c-dx` workflow `publish-openvsx.yml` |

## Automatic flow (the default)

1. A PR lands in this monorepo containing a changeset that bumps `b2c-vs-extension`.
2. The Changesets "Version Packages" PR is merged. `publish.yml` runs and:
   - Packages the extension via `pnpm run package` (esbuild + `vsce package` + `inject-script-types.mjs`).
   - Creates the git tag `b2c-vs-extension@X.Y.Z` and a GitHub Release in this repo with the `.vsix` attached.
   - Runs the **"Open release PR in forcedotcom/b2c-dx"** step, which uses `B2C_DX_PUBLISH_TOKEN` (a fine-grained PAT with `contents: write` and `pull-requests: write` on `forcedotcom/b2c-dx`) to:
     - Push a branch `release/b2c-vs-extension-X.Y.Z` containing the new `CHANGELOG.md` section and an updated `releases/latest.json` marker pointing at this monorepo's release.
     - Open a PR titled `Release b2c-vs-extension X.Y.Z`.
3. **A maintainer reviews and merges that PR in `forcedotcom/b2c-dx`.** This is the manual gate. The PR diff shows exactly what would be released — CHANGELOG + the version/tag in the marker file.
4. Merging fires `release-on-merge.yml` in `forcedotcom/b2c-dx`, which:
   - Reads `releases/latest.json` and extracts version + monorepo tag.
   - Downloads the VSIX from the monorepo release.
   - Creates a release on `forcedotcom/b2c-dx` with the VSIX attached.
5. The new release event triggers both publish workflows in parallel:
   - `publish-vscode.yml` → `vsce publish --skip-duplicate` to VS Code Marketplace using `VSCE_PERSONAL_ACCESS_TOKEN`.
   - `publish-openvsx.yml` → `ovsx publish --skip-duplicate` to Open VSX using `IDEE_OVSX_PAT`.

The extension typically appears on both marketplaces within a few minutes of merge.

### Where to watch each step

- **Build + monorepo release:** Actions tab in this repo → `Publish` workflow run.
- **PR creation:** the same workflow run, "Open release PR in forcedotcom/b2c-dx" step → follow the link to the PR.
- **PR review/merge:** `forcedotcom/b2c-dx` Pull Requests tab.
- **Release creation + marketplace publish:** Actions tab in `forcedotcom/b2c-dx` → `Create release on merge`, then `Publish to VS Code Marketplace` and `Publish to Open VSX Registry`.
- **Listings:**
  - <https://marketplace.visualstudio.com/items?itemName=Salesforce.b2c-vs-extension>
  - <https://open-vsx.org/extension/Salesforce/b2c-vs-extension>

## Manual fallback

Use these when the automatic path fails — typically because a token has expired, a workflow was disabled, or the marketplace returned a non-409 error.

> **Where to find the tokens.** `VSCE_PERSONAL_ACCESS_TOKEN` and `IDEE_OVSX_PAT` are repo secrets on `forcedotcom/b2c-dx`; `B2C_DX_PUBLISH_TOKEN` is a repo secret on this monorepo. For local manual publishing, request short-lived equivalents from the team that owns the marketplace publisher (do **not** export them into a long-lived shell config).

### 1. The "Open release PR" step failed

The VSIX is on the monorepo release; just open the PR by hand.

```bash
VERSION=0.8.2
TAG="b2c-vs-extension@${VERSION}"
BRANCH="release/b2c-vs-extension-${VERSION}"
MONOREPO=SalesforceCommerceCloud/b2c-developer-tooling

# Clone b2c-dx, branch, edit CHANGELOG and marker, push, open PR
git clone https://github.com/forcedotcom/b2c-dx.git /tmp/b2c-dx
cd /tmp/b2c-dx
git checkout -b "$BRANCH"

# 1. Splice the new section into CHANGELOG.md (paste the latest section from
#    the monorepo's packages/b2c-vs-extension/CHANGELOG.md right under
#    the "# Change Log" header).

# 2. Update releases/latest.json:
cat > releases/latest.json <<JSON
{
  "version": "${VERSION}",
  "monorepoTag": "${TAG}",
  "monorepoRepo": "${MONOREPO}",
  "monorepoReleaseUrl": "https://github.com/${MONOREPO}/releases/tag/${TAG}",
  "sha": "$(gh api repos/${MONOREPO}/commits/main --jq .sha)"
}
JSON

git add CHANGELOG.md releases/latest.json
git commit -m "Release b2c-vs-extension ${VERSION}"
git push -u origin "$BRANCH"

gh pr create --base main --head "$BRANCH" \
  --title "Release b2c-vs-extension ${VERSION}" \
  --body "Manual release PR for b2c-vs-extension@${VERSION}. See ${MONOREPO}@${TAG} for the source release."
```

Merge the PR through the normal review path.

### 2. PR was merged but `release-on-merge.yml` didn't run / failed

Re-run it manually from the b2c-dx Actions tab, or via CLI:

```bash
gh workflow run release-on-merge.yml -R forcedotcom/b2c-dx
```

The workflow re-reads `releases/latest.json` and is idempotent — it skips if the release already exists.

### 3. Release exists in b2c-dx but a publish workflow didn't fire / failed

Re-run with the tag input:

```bash
VERSION=0.8.2

gh workflow run publish-vscode.yml \
  -R forcedotcom/b2c-dx \
  -f tag="b2c-vs-extension@${VERSION}"

gh workflow run publish-openvsx.yml \
  -R forcedotcom/b2c-dx \
  -f tag="b2c-vs-extension@${VERSION}"
```

### 4. Last resort: publish the VSIX directly from a workstation

If the GitHub Actions environment is unavailable, publish locally with the marketplace tokens exported into the shell. Do not commit these values; do not put them in a long-lived dotfile.

```bash
VERSION=0.8.2
VSIX="b2c-vs-extension-${VERSION}.vsix"

gh release download "b2c-vs-extension@${VERSION}" \
  -R SalesforceCommerceCloud/b2c-developer-tooling \
  -p '*.vsix'

npx --yes @vscode/vsce publish --skip-duplicate --pat "$VSCE_PAT" --packagePath "$VSIX"
npx --yes ovsx publish --skip-duplicate -p "$OVSX_PAT" "$VSIX"
```

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| "Open release PR" step shows `B2C_DX_PUBLISH_TOKEN is not configured` | PAT not yet provisioned, or expired | Generate a new fine-grained PAT with `contents: write` + `pull-requests: write` on `forcedotcom/b2c-dx` only; store as `B2C_DX_PUBLISH_TOKEN` in this repo's secrets |
| PR opens but force-pushes itself on every workflow re-run | Expected — the step uses `--force-with-lease` to keep the branch in sync with the latest CHANGELOG | If the diff looks unstable, check that no one else is editing the branch by hand |
| `release-on-merge.yml` skipped with "Version unchanged" | The marker version matches the previous commit (e.g. only governance files changed) | Expected; the marker file gates the trigger on real version bumps |
| `vsce publish` returns `409 already exists` | Version already published | Safe; `--skip-duplicate` masks this |
| Open VSX returns `namespace not verified` / `403` | Publisher token lost access to the `Salesforce` namespace | Coordinate with the team holding the Open VSX publisher account; rotate `IDEE_OVSX_PAT` |
| `gh release download` (in b2c-dx workflow) fails `release not found` | Monorepo release not yet created, or tag mismatch | Verify the monorepo `publish.yml` run completed and the tag matches `releases/latest.json#monorepoTag` |

## Token rotation

Three tokens drive this pipeline. Rotate ahead of expiry; an expired token silently breaks publishing.

- **`B2C_DX_PUBLISH_TOKEN`** (this repo's secrets) — fine-grained PAT, `contents: write` + `pull-requests: write` on `forcedotcom/b2c-dx` only.
- **`VSCE_PERSONAL_ACCESS_TOKEN`** (`forcedotcom/b2c-dx` secrets) — Azure DevOps PAT for the `Salesforce` marketplace publisher.
- **`IDEE_OVSX_PAT`** (`forcedotcom/b2c-dx` secrets) — Open VSX PAT for the `Salesforce` namespace.
