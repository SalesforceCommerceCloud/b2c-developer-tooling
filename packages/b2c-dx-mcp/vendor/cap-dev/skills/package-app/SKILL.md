---
name: package-app
description: >-
  Package a commerce app directory into a registry-ready ZIP file. This skill handles BOTH
  new apps AND version bumps of existing apps. Use this IMMEDIATELY when users mention
  "package", "ZIP", "build app", "ready to submit", "bump version", "new version",
  "update version", "release", "patch", "minor update", "major release", or after ANY
  changes to an app directory. Trigger proactively whenever you see a commerce-*-app-v*
  directory that needs packaging - don't wait for explicit requests.
---

# Package Commerce App

Build a registry-ready Commerce App Package (CAP) ZIP from an app directory.

> **Cross-tool note:** References to `/skill-name` (e.g., `/validate-app`) are Claude Code invocation syntax. If using another assistant, read and follow the corresponding `.claude/skills/<skill-name>/SKILL.md` file instead.

## Step 1: Collect inputs

| Input | Example | Required |
|-------|---------|----------|
| App name | `avalara-tax` | Yes |
| Display name | `Avalara Tax` | Yes |
| Domain | `tax` | Yes |
| Version | `0.2.8` | Yes |
| Description | Short description | Yes |
| Publisher name | `Avalara` | Yes |
| Publisher URL | `https://developer.avalara.com/` | Yes |
| SFNext min version | `1.0.0` | No |
| SFNext max version | `2.0.0` | No |
| SFRA min version | `7.0.0` | No — only valid if SFNext min version is also set |
| SFRA max version | `8.0.0` | No |

**Valid domains:** `tax`, `payment`, `shipping`, `gift-cards`, `ratings-and-reviews`, `loyalty`, `search`, `address-verification`, `analytics`, `approaching-discounts`, `fraud`

**Structure:** Apps must be at `{domain}/{appName}/` where `{appName}` matches the "id" field. See `references/folder-structure.md`.

## Step 2: Version strategy

Check for existing `catalog.json`:

```bash
cat <domain>/<appName>/catalog.json
```

**Decision tree:**
- **No catalog.json:** New app → proceed with version from commerce-app.json
- **catalog.json with `"latest": {"version": "INIT"}` and `"versions": []`:** Ask user to replace or bump
- **Version EXISTS in catalog.json versions array:** MUST bump - ask user for new version

**Version validation:**
- Published versions cannot be replaced
- Always confirm version with user
- Use semantic versioning: major.minor.patch

## Step 3: Update commerce-app.json

Ensure version matches throughout:

```json
{
  "id": "<appName>",
  "name": "<displayName>",
  "description": "<description>",
  "domain": "<domain>",
  "version": "<version>",
  "publisher": {
    "name": "<publisherName>",
    "url": "<publisherUrl>",
    "support": "<publisherUrl>"
  },
  "dependencies": {},
  "storefrontSupport": {
    "sfnext": { "minVersion": "<sfnextMinVersion>", "maxVersion": "<sfnextMaxVersion>" }
  }
}
```

> **Note:** `storefrontSupport` is optional. Include only if the app declares a minimum storefront version. Omit the entire object if no version gating is needed. `maxVersion` is optional within each storefront key — include it only to guard against a known-incompatible future version (e.g., a major release that removes target IDs the app depends on); omit it for "no upper bound." An `sfra` key without an `sfnext` key will fail validation — SFRA support is always additive to SFNext. When present, the values here must match the root manifest entry exactly.

## Step 4: Run validation

**CRITICAL:** Validate before packaging:

```
/validate-app
```

Checks architecture, structure, manifest, impex, icons, translations, and security. Address all failures before continuing.

## Step 5: Delete old ZIPs

```bash
cd <domain>/<appName>/
rm -f <appName>-v*.zip
```

## Step 6: Ensure cartridge `.project` files, then generate ZIP

**Backend/Fullstack apps only:** Before zipping, every immediate child directory under `cartridges/site_cartridges/` and `cartridges/bm_cartridges/` MUST have a `.project` file — required for b2c cartridge discovery. If missing, create an empty one. **Never overwrite an existing (possibly non-empty, Eclipse-generated) `.project` file.**

```bash
cd commerce-<appName>-app-v<version>/
for group in site_cartridges bm_cartridges; do
  dir="cartridges/$group"
  [[ -d "$dir" ]] || continue
  for cartridge in "$dir"/*/; do
    [[ -e "$cartridge/.project" ]] || touch "$cartridge/.project"
  done
done
cd ..
```

Generate the ZIP. **Do NOT use a blanket `-x "*/.*"` exclusion** — it strips the `.project` files just created. Exclude junk explicitly instead:

```bash
cd <domain>/<appName>/
zip -r <appName>-v<version>.zip commerce-<appName>-app-v<version>/ \
  -x "*.DS_Store" -x "*/*.DS_Store" -x "__MACOSX/*" -x "*/__MACOSX/*" \
  -x "*/.git/*" -x "*/.env" -x "*/.env.*" -x "Thumbs.db" \
  -x "*.key" -x "*.pem" -x "*.p12" -x "*.pfx" -x "*.jks"
```

Verify structure:
```bash
unzip -l <appName>-v<version>.zip | head -20
```

Confirm:
- Single root: `commerce-<appName>-app-v<version>/`
- No junk files (`.DS_Store`, `__MACOSX`, `.env`, secrets)
- **`.project` files ARE present** for every cartridge root (Backend/Fullstack apps) — verify with `unzip -l <appName>-v<version>.zip | grep '\.project$'`
- Architecture-specific directories present

## Step 7: Compute hash

```bash
shasum -a 256 <domain>/<appName>/<appName>-v<version>.zip
```

## Step 8: Update root manifest

Update `commerce-apps-manifest/manifest.json`:

```json
{
  "id": "<appName>",
  "name": "<displayName>",
  "description": "<description>",
  "iconName": "<appName>.png",
  "domain": "<domain>",
  "type": "app",
  "provider": "thirdParty",
  "version": "<version>",
  "zip": "<appName>-v<version>.zip",
  "sha256": "<computed_hash>",
  "storefrontSupport": {
    "sfnext": { "minVersion": "<sfnextMinVersion>", "maxVersion": "<sfnextMaxVersion>" }
  }
}
```

> **Note:** Include `storefrontSupport` only if the app declares a minimum storefront version. Omit the entire field if no version gating is needed. `maxVersion` is optional within each storefront key — include it only to guard against a known-incompatible future version; omit it for "no upper bound." An `sfra` key without an `sfnext` key will fail validation — SFRA support is always additive to SFNext. Values must match the corresponding fields in `commerce-app.json` exactly.

**Icon:** Must match filename in ZIP's `icons/` directory. CI extracts automatically.

## Step 9: Add translations

Update `commerce-apps-manifest/translations/en-US.json` (minimum):

```bash
jq '. + {"<appName>": {"name": "<displayName>", "description": "<description>"}}' \
  commerce-apps-manifest/translations/en-US.json > temp.json && \
  mv temp.json commerce-apps-manifest/translations/en-US.json
```

Repeat for other locales or use English as fallback.

## Step 10: Handle catalog.json

- **Existing app:** Don't modify - CI updates on merge
- **New app:** Create with INIT values:

```json
{
  "latest": {"version": "INIT", "tag": "INIT"},
  "versions": []
}
```

## Step 11: Final validation

```
/validate-app
```

All checks must pass.

## Step 12: Clean up

```bash
cd <domain>/<appName>/
rm -rf commerce-<appName>-app-v<version>/
```

**Commit only:**
- ✅ `<appName>-v<version>.zip`
- ✅ `commerce-apps-manifest/manifest.json`
- ✅ `commerce-apps-manifest/translations/*.json`
- ✅ `catalog.json` (new apps only)

**Don't commit:**
- ❌ Extracted directories
- ❌ Old ZIP versions
- ❌ Junk files
