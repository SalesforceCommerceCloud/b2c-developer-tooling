---
name: submit-app
description: >-
  Submit a pull request for the commerce app registry with automated PR creation via GitHub CLI.
  Use this skill immediately when the app ZIP is ready and validated, whenever users mention
  "submit", "submit app", "create pull request", "ready to submit", "submit to registry", or "open PR".
  This is the FINAL step in the app submission workflow - don't make users ask twice. If they've
  just packaged or validated an app and seem ready to submit, proactively offer to use this skill.
  Automates the entire PR process including branch creation, push, and PR template.
---

# Submit Commerce App

Submit a PR for the commerce app registry with automated GitHub CLI integration.

> **Cross-tool note:** References to `/skill-name` (e.g., `/validate-app`) are Claude Code invocation syntax. If using another assistant, read and follow the corresponding `.claude/skills/<skill-name>/SKILL.md` file instead.

## Step 0: Check GitHub CLI

```bash
which gh && gh auth status --hostname github.com
```

**If authenticated:** Proceed with automated PR creation (Step 6a).
**If not:** User can authenticate (`gh auth login --hostname github.com --web`) or create PR manually (Step 6b).

## Step 1: Validate

**Run before submitting:**
```
/validate-app
```

Fix all validation failures.

## Step 2: Check git status

```bash
git status
```

**Expected:**
- Modified: `commerce-apps-manifest/manifest.json`
- Added: `<domain>/<appName>/<appName>-v<version>.zip`
- Modified: `commerce-apps-manifest/translations/en-US.json` (minimum)
- Optional: `<domain>/<appName>/catalog.json` (new apps only)

**Don't commit:**
- ❌ Extracted directories (`commerce-*-app-v*/`)
- ❌ Old ZIP versions
- ❌ Junk files

## Step 3: Commit

```bash
git add commerce-apps-manifest/manifest.json
git add commerce-apps-manifest/translations/en-US.json
git add <domain>/<appName>/<appName>-v<version>.zip
# For new apps only:
git add <domain>/<appName>/catalog.json

git commit -m "Add <displayName> v<version>"
```

**Format:** `Add <displayName> v<version>` (new) / `Update <displayName> to v<version>` (update) / `Fix <displayName> v<version> - <description>` (fix)

## Step 4: Create branch

```bash
git checkout -b add-<appName>-v<version>
```

**Format:** `add-<appName>-v<version>` (new) / `update-<appName>-v<version>` (update) / `fix-<appName>-v<version>` (fix)

## Step 5: Push

```bash
git push origin add-<appName>-v<version>
```

## Step 6a: Automated PR (gh CLI authenticated)

```bash
CURRENT_BRANCH=$(git branch --show-current)

gh pr create \
  --title "Add <displayName> v<version>" \
  --body "## Commerce App Submission

**App Name:** <appName>
**Display Name:** <displayName>
**Domain:** <domain>
**Version:** <version>

## Changes
- [ ] New app submission
- [ ] Version update (previous: v<oldVersion>)
- [ ] Bug fix or patch

## Files Modified
- \`commerce-apps-manifest/manifest.json\` - Updated app entry
- \`commerce-apps-manifest/translations/en-US.json\` - App translations
- \`<domain>/<appName>/<appName>-v<version>.zip\` - App package
- \`<domain>/<appName>/catalog.json\` - New apps only

**Note:** Icons extracted automatically by CI from ZIP.

## Description
<!-- What this app does or what changed -->

## Checklist
- [x] App at \`<domain>/<appName>/\` where \`<appName>\` matches manifest id
- [x] ZIP follows format: \`<appName>-v<version>.zip\`
- [x] Root manifest has all required fields
- [x] SHA256 hash matches ZIP
- [x] Icon in ZIP \`icons/\` matches manifest \`iconName\`
- [x] Translations in \`commerce-apps-manifest/translations/en-US.json\`
- [x] \`catalog.json\` included (new apps only, INIT values)
- [x] ZIP has single root: \`commerce-<appName>-app-v<version>/\`
- [x] No junk files (.DS_Store, __MACOSX, hidden files)
- [x] commerce-app.json version matches manifest
- [x] Architecture-specific validations passed
- [x] Validated with \`/validate-app\`

## CI Workflows
- **verify-zip.yml** - Validates structure, manifest, SHA256
- **update-catalog.yml** - Updates catalog on merge

## Testing
<!-- Testing performed -->

---

**Submitter's Notes:**
<!-- Additional context -->" \
  --base main \
  --head "$CURRENT_BRANCH"
```

Returns PR URL. Proceed to Step 7.

## Step 6b: Manual PR (no gh CLI)

Get URL:
```bash
CURRENT_BRANCH=$(git branch --show-current)
REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')
echo "$REPO_URL/compare/$CURRENT_BRANCH?expand=1"
```

Open URL in browser, use PR template from Step 6a body, customize with app details.

## Step 7: Monitor CI

Watch GitHub Actions:
1. **verify-zip.yml** - Validates ZIP, manifest, SHA256
2. **update-catalog.yml** - Updates catalog on merge

If CI fails:
- Read error messages
- Fix locally
- Push to same branch (CI re-runs automatically)

## Step 8: Address feedback

```bash
git add <changed-files>
git commit -m "Address review feedback: <description>"
git push origin add-<appName>-v<version>
```

## Common CI Failures

| Error | Fix |
|-------|-----|
| SHA256 mismatch | Recompute: `shasum -a 256 <zip>`, update manifest |
| Invalid manifest | Add missing required fields |
| Junk files | Recreate ZIP with exclusions |
| Wrong root folder | Recreate ZIP from correct directory |
| Version mismatch | Update commerce-app.json to match manifest |

## Final Checklist

- [ ] All CI checks passing
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Ready to merge

Once merged, CI updates catalog automatically.
