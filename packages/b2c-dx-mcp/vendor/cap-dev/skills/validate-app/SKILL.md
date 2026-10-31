---
name: validate-app
description: >-
  Run comprehensive pre-submission validation on commerce app packages. Use IMMEDIATELY when users
  mention "validate", "check", "verify", or "ready to submit". REQUIRED before calling submit-app
  - trigger proactively to catch errors early. Validates directory structure, manifest format,
  SHA256 hashes, impex XML, security issues, and runs complete CONTRIBUTING.md checklist. Also use
  when debugging validation failures or import errors to identify root cause quickly.
---

# Validate Commerce App Package

Run comprehensive validation checks on a commerce app before submitting a PR.

> **Cross-tool note:** References to `/skill-name` (e.g., `/submit-app`) are Claude Code invocation syntax. If using another assistant, read and follow the corresponding `.claude/skills/<skill-name>/SKILL.md` file instead.

## Step 1: Identify app and resolve input

Gather:
- Domain (e.g., `tax`, `payment`, `shipping`)
- App name (e.g., `avalara-tax`)
- Version (or use latest ZIP)

**Structure:** Apps must be at `{domain}/{appName}/` where `{appName}` matches the "id" field. See `references/folder-structure.md`.

The skill accepts **either** a packaged `.zip` **or** an already-extracted CAP root directory (e.g., `commerce-<appName>-app-v<version>/`). Set both variables once; later steps branch on `INPUT_KIND`:

```bash
# Resolve the input: a .zip path OR an extracted CAP root directory.
INPUT="<path-to-zip-or-extracted-cap-root>"
if [[ -f "$INPUT" && "$INPUT" == *.zip ]]; then
  INPUT_KIND=zip
  ZIP="$INPUT"
  EXTRACT_DIR="$(mktemp -d)"
  unzip -q "$ZIP" -d "$EXTRACT_DIR"
  CAP_ROOT="$EXTRACT_DIR/commerce-<appName>-app-v<version>"
elif [[ -d "$INPUT" ]]; then
  INPUT_KIND=dir
  CAP_ROOT="$INPUT"
  ZIP=""        # no zip available — Step 3 will be skipped
  EXTRACT_DIR="" # nothing to clean up in Step 14
else
  echo "Input must be a .zip file or extracted CAP root directory" >&2; exit 2
fi
```

## Step 2: Verify input exists

```bash
if [[ "$INPUT_KIND" == "zip" ]]; then ls -lh "$ZIP"; else ls -ld "$CAP_ROOT"; fi
```

## Step 3: Validate SHA256

**Skip if `INPUT_KIND=dir`** — the manifest pins a hash of the `.zip` artifact, which can't be reproduced from extracted files. Note this gap in the report and re-run Step 3 once the ZIP is built.

```bash
if [[ "$INPUT_KIND" == "zip" ]]; then
  shasum -a 256 "$ZIP"
  jq '[.[] | select(type=="array")] | flatten | .[] | select(.id == "<appName>") | .sha256' \
    commerce-apps-manifest/manifest.json
else
  echo "(skipped — no ZIP available; SHA256 must be re-checked against the built ZIP)"
fi
```

Hashes must match exactly.

## Step 4: Validate manifest entry

Check `commerce-apps-manifest/manifest.json` has all required fields:

- `id` - matches app name
- `name` - display name
- `description`
- `iconName` - matches icon in ZIP `icons/` directory
- `domain` - valid domain (hyphen-case)
- `type` - must be `"app"`
- `provider` - must be `"thirdParty"`
- `version` - semantic versioning
- `zip` - matches actual filename
- `sha256` - matches computed hash

Optional fields (validate if present):
- `storefrontSupport.sfnext.minVersion` - valid semver (`X.Y.Z` or `X.Y.Z-prerelease`)
- `storefrontSupport.sfnext.maxVersion` - valid semver, optional (`X.Y.Z` or `X.Y.Z-prerelease`)
- `storefrontSupport.sfra.minVersion` - valid semver (`X.Y.Z` or `X.Y.Z-prerelease`)
- `storefrontSupport.sfra.maxVersion` - valid semver, optional (`X.Y.Z` or `X.Y.Z-prerelease`)
- Only `sfnext` and `sfra` keys allowed inside `storefrontSupport`; only `minVersion` and `maxVersion` allowed inside each
- If `storefrontSupport.sfra` is present, `storefrontSupport.sfnext` must also be present (with a valid `minVersion`). Fail validation on SFRA-only declarations.
- `storefrontSupport` must be present in **both** the root manifest and `commerce-app.json` with matching values

## Step 5: Validate package contents

```bash
if [[ "$INPUT_KIND" == "zip" ]]; then
  unzip -l "$ZIP" | head -30
  unzip -l "$ZIP" | grep -E "\.DS_Store|__MACOSX" || echo "  ✓ no junk files"
else
  ls -la "$CAP_ROOT" | head -30
  find "$CAP_ROOT" \( -name '.DS_Store' -o -name '__MACOSX' \) -print | head \
    || echo "  ✓ no junk files"
fi

# Required files (works for both inputs)
for f in commerce-app.json README.md app-configuration/tasksList.json; do
  [[ -e "$CAP_ROOT/$f" ]] && echo "  ✓ $f" || echo "  ✗ MISSING: $f"
done
```

Check:
- Single root: `commerce-<appName>-app-v<version>/` (ZIP only — for `INPUT_KIND=dir`, the directory IS the root)
- No junk hidden files (`.DS_Store`, `__MACOSX`, `.env`, secrets) — **except** `.project`, which every cartridge root MUST include (see Step 6b)
- No registry paths (`tax/`, `domain/`) at the ZIP root (ZIP only)
- Required: `commerce-app.json`, `README.md`, `app-configuration/tasksList.json`

## Step 6: Detect architecture

```bash
HAS_UI=$([[ -d "$CAP_ROOT/storefront-next" ]] && echo 1 || echo 0)
HAS_BACKEND=$([[ -d "$CAP_ROOT/cartridges" ]] && echo 1 || echo 0)
```

Determine:
- **UI-only:** Has `storefront-next/`, NO `cartridges/`
- **Backend-only:** Has `cartridges/`, NO `storefront-next/`
- **Fullstack:** Has both

## Step 6b: Validate cartridge `.project` files (Backend-only/Fullstack)

**Skip if UI-only** (`HAS_BACKEND=0`).

Every immediate child directory of `cartridges/site_cartridges/` and `cartridges/bm_cartridges/` must contain a `.project` file. It may be empty (auto-created by scaffolding/packaging) or a real, non-empty Eclipse `.project` file — both PASS. Missing is a FAIL.

```bash
bash .github/scripts/validate-cartridge-project.sh "$CAP_ROOT"
```

## Step 7: Validate commerce-app.json

```bash
jq . "$CAP_ROOT/commerce-app.json"
```

Required fields:
- `id`, `name`, `description`, `domain`, `version`
- `publisher.name`, `publisher.url`, `publisher.support`

Version must match root manifest version.

Optional fields (validate if present):
- `storefrontSupport.sfnext.minVersion` - valid semver (`X.Y.Z` or `X.Y.Z-prerelease`)
- `storefrontSupport.sfnext.maxVersion` - valid semver, optional (`X.Y.Z` or `X.Y.Z-prerelease`)
- `storefrontSupport.sfra.minVersion` - valid semver (`X.Y.Z` or `X.Y.Z-prerelease`)
- `storefrontSupport.sfra.maxVersion` - valid semver, optional (`X.Y.Z` or `X.Y.Z-prerelease`)
- If `storefrontSupport.sfra` is present, `storefrontSupport.sfnext` must also be present (with a valid `minVersion`). Fail validation on SFRA-only declarations.
- Values must match the corresponding fields in the root manifest entry

## Step 8: Validate storefront files (UI-only/Fullstack)

**Skip if Backend-only.**

Required:
- `storefront-next/src/extensions/<appName>/target-config.json` — entry point; declares `components[]`, `actionHooks[]`, etc., each pointing at a `path` under the extension directory.

For each entry referenced from `target-config.json`, verify the file exists:

```bash
TC="$CAP_ROOT/storefront-next/src/extensions/<appName>/target-config.json"
jq -r '[.components[]?.path, .actionHooks[]?.handler, .routes[]?.handler] | .[] | select(.)' "$TC" \
  | while read -r p; do
      [[ -f "$CAP_ROOT/storefront-next/src/$p" ]] \
        && echo "  ✓ $p" \
        || echo "  ✗ MISSING: $p"
    done
```

If the extension ships translations, they live under `storefront-next/src/extensions/<appName>/locales/<locale>/translations.json`. Locale set is app-specific — not a fixed allowlist.

## Step 9: Validate impex (Backend-only/Fullstack)

**Skip if UI-only.**

```bash
find "$CAP_ROOT/impex/" -name "*.xml" -exec xmllint --noout {} \;
```

See `references/impex-validation.md` for detailed rules:
- Services use dotted notation
- Install/uninstall pairs match
- Uninstall `services.xml` uses credential → profile → service order with `mode="delete"` (same XSD sequence as install; BM UI service-first delete does not apply to IMPEX)
- Attribute IDs use camelCase with app prefix
- SITEID placeholder (not actual site ID)
- No hardcoded credentials

## Step 10: Verify catalog.json

- **Existing app:** catalog.json exists, unchanged in PR
- **New app:** catalog.json has INIT values:
```json
{
  "latest": {"version": "INIT", "tag": "INIT"},
  "versions": []
}
```

## Step 10b: Validate app-configuration/ JSON via CI scripts

Run the same scripts CI runs against `$CAP_ROOT` (already set in Step 1). Each is the source of truth for its schema; scripts print errors to stderr and exit non-zero on failure.

```bash
# tasksList.json schema (required file)
bash .github/scripts/validate-tasks-list.sh "$CAP_ROOT/app-configuration/tasksList.json"

# adminComponents.json schema (optional file)
[[ -f "$CAP_ROOT/app-configuration/adminComponents.json" ]] && \
  bash .github/scripts/validate-admin-components.sh "$CAP_ROOT/app-configuration/adminComponents.json"

# app-shipped translations (optional directory; cross-references the two files above)
bash .github/scripts/validate-translations.sh "$CAP_ROOT"
```

Each script prints schema details and exits non-zero with errors on stderr. See the script header comments for the schema contract.

## Step 11: Validate manifest-level translations

The CAP-internal translations live under `app-configuration/translations/` (validated in Step 10b). The **manifest-level** `commerce-apps-manifest/translations/en-US.json` holds the marketplace `name` / `description` shown on the app card:

```bash
jq '."<appName>"' commerce-apps-manifest/translations/en-US.json
```

Check:
- Entry exists in `en-US.json` (minimum)
- Has `name` and `description` fields
- Valid JSON structure

## Step 12: Validate icon

```bash
ICON_NAME=$(jq -r '[.[] | select(type=="array")] | flatten | .[] | select(.id == "<appName>") | .iconName' \
  commerce-apps-manifest/manifest.json)

[[ -f "$CAP_ROOT/icons/$ICON_NAME" ]] && echo "  ✓ icon in package" || echo "  - not in package"
[[ -f "commerce-apps-manifest/icons/$ICON_NAME" ]] && echo "  ✓ icon in registry" || echo "  ✗ MISSING in registry"
```

Icon filename must match `iconName` field exactly. CI extracts automatically.

## Step 13: Security scan

```bash
bash .github/scripts/security-scan.sh "$CAP_ROOT/"
```

**If blocking findings (exit 1):** FAIL - fix issues first.
**If warnings only:** Continue with warnings for review.

See `references/security-scan.md` for details.

## Step 14: Clean up

Only remove the temp dir if Step 1 created one (`INPUT_KIND=zip`). When the user passed an extracted CAP root, leave it alone.

```bash
[[ -n "$EXTRACT_DIR" ]] && rm -rf "$EXTRACT_DIR"
```

## Report results

- **✅ PASS** - All validations passed, ready for `/submit-app`
- **❌ FAIL** - List specific issues with file paths and line numbers

Provide fix recommendations for each issue.
