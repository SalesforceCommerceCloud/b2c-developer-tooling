# Publishing the B2C DX VS Code Extension

The extension is built in this monorepo and published to the marketplaces from a separate Salesforce-owned repository, [`forcedotcom/b2c-dx`](https://github.com/forcedotcom/b2c-dx). The split exists for **open-source governance**: Salesforce OSPO policy requires public, externally consumable OSS to live under a `forcedotcom`/`salesforce` org, and the marketplace listing's "Repository" link must point at that public repo. It is **not** a VS Code Marketplace technical requirement. Each release goes through a **review PR** in `forcedotcom/b2c-dx` so a human can inspect and approve it before anything reaches the marketplaces.

The source never leaves this monorepo. The only artifact that crosses the boundary is the built VSIX, and it carries **SLSA build provenance** (an `actions/attest-build-provenance` attestation). Every workflow on the `b2c-dx` side re-verifies that provenance before acting, so a tampered or foreign VSIX cannot reach the marketplaces.

## Where things live

| What | Where |
|---|---|
| Source code, dev workflow, issues, PRs | This monorepo (`SalesforceCommerceCloud/b2c-developer-tooling`) |
| VSIX build (`vsce package` + `inject-script-types.mjs`) | This monorepo's `publish.yml` workflow |
| VSIX sha256 + SLSA build-provenance attestation | This monorepo's `publish.yml` workflow |
| Tagged GitHub release with VSIX attached | This monorepo (tag: `b2c-vs-extension@X.Y.Z`) |
| Cross-repo trigger (`repository_dispatch`) | This monorepo's `notify-b2c-dx` job → `forcedotcom/b2c-dx` |
| Release review PR | `forcedotcom/b2c-dx` (opened by `receive-monorepo-release.yml`) |
| Marketplace landing page, governance, publish workflows | `forcedotcom/b2c-dx` |
| Mirrored release with the same VSIX asset | `forcedotcom/b2c-dx` (created on PR merge; tag `b2c-vs-extension@X.Y.Z`) |
| `vsce publish` to VS Code Marketplace | `forcedotcom/b2c-dx` workflow `publish-vscode.yml` |
| `ovsx publish` to Open VSX | `forcedotcom/b2c-dx` workflow `publish-openvsx.yml` |

## Automatic flow (the default)

The model is **monorepo builds and attests; `b2c-dx` publishes.** The monorepo never pushes into `b2c-dx`; it fires an event and lets `b2c-dx` author its own PR with its own token (separation of duties).

1. A PR lands in this monorepo containing a changeset that bumps `b2c-vs-extension`.
2. The Changesets "Version Packages" PR is merged. `publish.yml` runs and:
   - Packages the extension via `pnpm run package` (esbuild + `vsce package` + `inject-script-types.mjs`).
   - Computes the VSIX **sha256** and produces a **build-provenance attestation** for it (`actions/attest-build-provenance`).
   - Creates the git tag `b2c-vs-extension@X.Y.Z` and a GitHub Release in this repo with the `.vsix` attached.
   - Runs the isolated **`notify-b2c-dx`** job, which mints a **short-lived GitHub App installation token** (scoped to `b2c-dx` only, `contents: read`, auto-revoked within ~1h) and fires a `repository_dispatch` event (`monorepo-vsx-release`) carrying the version, monorepo tag, release URL, and VSIX sha256. No long-lived cross-repo PAT is used, and no marketplace credential exists anywhere in this repo.
3. On `b2c-dx`, **`receive-monorepo-release.yml`** receives the dispatch and, using `b2c-dx`'s own `GITHUB_TOKEN`:
   - Validates and allowlists the payload (rejects any source that is not this monorepo; strict semver / sha256 / tag checks).
   - Downloads the VSIX from the monorepo release and **verifies its sha256 and build provenance** (`gh attestation verify --signer-workflow …/publish.yml`). A spoofed dispatch or tampered artifact fails closed here — no PR is opened.
   - Opens a PR titled `Release b2c-vs-extension X.Y.Z` updating `CHANGELOG.md`, `releases/<version>.json`, and `releases/latest.json`.
4. **A maintainer reviews and merges that PR in `forcedotcom/b2c-dx`.** This is the manual gate. The PR diff shows exactly what would be released — CHANGELOG + the version/tag/sha256 in the marker files.
5. Merging fires `release-on-merge.yml` in `forcedotcom/b2c-dx`, which:
   - Reads the marker and re-checks the source allowlist.
   - Downloads the VSIX and **re-verifies sha256 + build provenance** (the machine check that backstops the metadata-only human review).
   - Creates a release on `forcedotcom/b2c-dx` with the VSIX attached.
   - Explicitly triggers the two publish workflows via `workflow_dispatch`. (A `release` event created with `GITHUB_TOKEN` does **not** trigger other workflows — GitHub's recursion guard — so the publishers are dispatched directly rather than relying on the `release` event.)
6. Each publish workflow runs in the protected **`publish` environment** (the only place the marketplace tokens are readable), **verifies build provenance one final time**, and then publishes:
   - `publish-vscode.yml` → `vsce publish --skip-duplicate` to VS Code Marketplace using `VSCE_PERSONAL_ACCESS_TOKEN`.
   - `publish-openvsx.yml` → `ovsx publish --skip-duplicate` to Open VSX using `IDEE_OVSX_PAT`.

The extension typically appears on both marketplaces within a few minutes of merge.

### Where to watch each step

- **Build + attestation + monorepo release:** Actions tab in this repo → `Publish` workflow run.
- **Cross-repo dispatch:** the same workflow run, `notify-b2c-dx` job.
- **PR creation:** `forcedotcom/b2c-dx` Actions tab → `Receive monorepo VSIX release`, then its Pull Requests tab.
- **PR review/merge:** `forcedotcom/b2c-dx` Pull Requests tab.
- **Release creation + marketplace publish:** Actions tab in `forcedotcom/b2c-dx` → `Create release on merge`, then `Publish to VS Code Marketplace` and `Publish to Open VSX Registry`.
- **Listings:**
  - <https://marketplace.visualstudio.com/items?itemName=Salesforce.b2c-vs-extension>
  - <https://open-vsx.org/extension/Salesforce/b2c-vs-extension>

## Manual fallback

Use these when the automatic path fails — typically because the App token isn't provisioned, a workflow was disabled, or the marketplace returned a non-409 error.

> **Where to find the tokens.** `VSCE_PERSONAL_ACCESS_TOKEN` and `IDEE_OVSX_PAT` are secrets in the `publish` environment on `forcedotcom/b2c-dx`. The cross-repo GitHub App credential (`B2C_DX_APP_ID` variable + `B2C_DX_APP_PRIVATE_KEY` secret) lives on this monorepo. For local manual publishing, request short-lived equivalents from the team that owns the marketplace publisher (do **not** export them into a long-lived shell config).

### 1. The dispatch didn't reach b2c-dx / no PR was opened

The VSIX and its attestation are already on the monorepo release. Re-fire the dispatch by re-running the `Publish` workflow's `notify-b2c-dx` job, or trigger the receiver on `b2c-dx` directly (the receiver re-downloads and re-verifies, so this is safe):

```bash
VERSION=0.8.2
TAG="b2c-vs-extension@${VERSION}"
MONOREPO=SalesforceCommerceCloud/b2c-developer-tooling
VSIX_SHA256=$(gh release download "$TAG" -R "$MONOREPO" -p '*.vsix' --dir /tmp/vsix >/dev/null 2>&1; sha256sum /tmp/vsix/*.vsix | awk '{print $1}')

gh api repos/forcedotcom/b2c-dx/dispatches --method POST --input - <<JSON
{
  "event_type": "monorepo-vsx-release",
  "client_payload": {
    "version": "${VERSION}",
    "monorepo_repo": "${MONOREPO}",
    "monorepo_tag": "${TAG}",
    "release_url": "https://github.com/${MONOREPO}/releases/tag/${TAG}",
    "vsix_sha256": "${VSIX_SHA256}"
  }
}
JSON
```

If the receiver itself is unavailable, open the PR by hand on `b2c-dx`: create branch `release/b2c-vs-extension-${VERSION}`, splice the latest section of `packages/b2c-vs-extension/CHANGELOG.md` into `b2c-dx`'s `CHANGELOG.md`, and write `releases/latest.json` (and `releases/${VERSION}.json`) with `version`, `monorepoTag`, `monorepoRepo`, `monorepoReleaseUrl`, and `vsixSha256` (the sha256 above — the on-merge workflow verifies it, so it must be correct).

### 2. PR was merged but `release-on-merge.yml` didn't run / failed

Re-run it manually from the b2c-dx Actions tab, or via CLI:

```bash
gh workflow run release-on-merge.yml -R forcedotcom/b2c-dx
```

The workflow re-reads `releases/latest.json`, re-verifies the VSIX, and is idempotent — it skips if the release already exists.

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

Both publishers verify build provenance before publishing, so a manual dispatch of a foreign or tampered tag still fails closed.

### 4. Last resort: publish the VSIX directly from a workstation

If the GitHub Actions environment is unavailable, publish locally with the marketplace tokens exported into the shell. Do not commit these values; do not put them in a long-lived dotfile. Verify provenance first.

```bash
VERSION=0.8.2
VSIX="b2c-vs-extension-${VERSION}.vsix"
MONOREPO=SalesforceCommerceCloud/b2c-developer-tooling

gh release download "b2c-vs-extension@${VERSION}" -R "$MONOREPO" -p '*.vsix'
gh attestation verify "$VSIX" --repo "$MONOREPO" \
  --signer-workflow "$MONOREPO/.github/workflows/publish.yml"

npx --yes @vscode/vsce publish --skip-duplicate --pat "$VSCE_PAT" --packagePath "$VSIX"
npx --yes ovsx publish --skip-duplicate -p "$OVSX_PAT" "$VSIX"
```

## Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| `notify-b2c-dx` job skipped | `vars.B2C_DX_APP_ID` not set (safe rollout state) | Expected until the GitHub App is provisioned; provision it to enable cross-repo delivery |
| `notify-b2c-dx` fails minting a token | App private key/ID wrong, or App not installed on `b2c-dx` | Verify `B2C_DX_APP_ID` + `B2C_DX_APP_PRIVATE_KEY` and that the App is installed on `forcedotcom/b2c-dx` with `contents: write` |
| Receiver rejects the dispatch (allowlist / validation error) | Source repo not allowlisted, or malformed payload | Expected for spoofed/garbage events; for a legitimate sandbox, set `vars.EXPECTED_MONOREPO` on the receiving repo |
| `gh attestation verify` fails on b2c-dx | VSIX wasn't attested, or doesn't match the signer workflow | Confirm `publish.yml` ran the "Attest VSIX build provenance" step for this release; a mismatch means the artifact is not trusted — do **not** override |
| `release-on-merge.yml` skipped with "Version unchanged" | The marker version matches the previous commit | Expected; the marker gates the trigger on real version bumps |
| Release created but publishers didn't run | Relying on the `release` event under `GITHUB_TOKEN` (recursion guard) | The workflow now dispatches the publishers explicitly; ensure `release-on-merge.yml` has `actions: write` |
| `vsce publish` returns `409 already exists` | Version already published | Safe; `--skip-duplicate` masks this |
| Open VSX returns `namespace not verified` / `403` | Publisher token lost access to the `Salesforce` namespace | Coordinate with the team holding the Open VSX publisher account; rotate `IDEE_OVSX_PAT` |
| `gh release download` (in b2c-dx workflow) fails `release not found` | Monorepo release not yet created, or tag mismatch | Verify the monorepo `publish.yml` run completed and the tag matches the marker's `monorepoTag` |

## Credentials

- **GitHub App** (`B2C_DX_APP_ID` variable + `B2C_DX_APP_PRIVATE_KEY` secret, this repo) — org-owned identity used only to fire the cross-repo dispatch. Installation tokens are short-lived (~1h) and auto-revoked; there is no long-lived cross-repo PAT to rotate. Rotate the App private key per org policy.
- **`VSCE_PERSONAL_ACCESS_TOKEN`** (`publish` environment on `forcedotcom/b2c-dx`) — Azure DevOps PAT for the `Salesforce` marketplace publisher. Scope to Marketplace-publish only; set an expiry and a rotation owner.
- **`IDEE_OVSX_PAT`** (`publish` environment on `forcedotcom/b2c-dx`) — Open VSX PAT for the `Salesforce` namespace. Set an expiry and a rotation owner.

> The previous long-lived `B2C_DX_PUBLISH_TOKEN` PAT is **removed** by this design. If it still exists as a secret, delete it and revoke the PAT once the App path is confirmed working.
