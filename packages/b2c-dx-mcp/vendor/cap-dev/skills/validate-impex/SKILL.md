---
name: validate-impex
description: >-
  Validate SFCC impex XML files for syntax, structure, and common errors. Checks services,
  site preferences, custom objects, and installation/uninstallation pairs. Use this skill
  immediately before importing impex files to Business Manager or submitting any commerce app.
  Don't wait for import failures - run validation proactively whenever impex files are created
  or modified to catch errors early and save debugging time.
---

# Validate Impex Files

Validate SFCC impex XML files to catch errors before import.

> **Cross-tool note:** References to `/skill-name` (e.g., `/validate-app`) are Claude Code invocation syntax. If using another assistant, read and follow the corresponding `.claude/skills/<skill-name>/SKILL.md` file instead.

## When to use this skill

Use proactively:
- Before importing impex files to Business Manager
- After generating or modifying any impex files
- Before running `/validate-app` or `/submit-app`
- When debugging import failures
- As part of any impex workflow

## Step 1: Quick validation

Run the automated validation script:

```bash
bash scripts/validate-impex.sh impex/
```

This checks:
- Directory structure (install/ and uninstall/)
- XML syntax (all .xml files)
- Services (namespace, delete mode, install/uninstall pairs)
- Site preferences (attribute definitions, groups)

## Step 2: XML syntax validation

Validate all XML files are well-formed:

```bash
find impex/ -name "*.xml" -exec xmllint --noout {} \;
```

**Common XML errors:**
- Missing closing tags
- Unescaped special characters (`&` → `&amp;`, `<` → `&lt;`)
- Missing XML declaration
- Invalid attribute quotes

### XSD schema validation (preferred)

Validate against the bundled SFCC XSD schemas — this catches namespace, structural, and type errors that plain well-formedness misses. The `b2c` CLI ships the schemas; use `npx @salesforce/b2c-cli` if it's not installed globally.

```bash
# List bundled schemas
b2c docs schema --list

# Validate site preferences and custom object metadata
xmllint --schema "$(b2c docs schema metadata --path)" \
  impex/install/meta/system-objecttype-extensions.xml --noout
xmllint --schema "$(b2c docs schema metadata --path)" \
  impex/install/meta/custom-objecttype-definitions.xml --noout

# Validate services
xmllint --schema "$(b2c docs schema services --path)" impex/install/services.xml --noout
xmllint --schema "$(b2c docs schema services --path)" impex/uninstall/services.xml --noout

# Validate preferences
xmllint --schema "$(b2c docs schema preferences --path)" impex/install/preferences.xml --noout
```

## Step 3: Validate services.xml

### Installation file (`impex/install/services.xml`)

**Check:**
- [ ] XML namespace: `http://www.demandware.com/xml/impex/services/2015-07-01`
- [ ] Service IDs use dotted notation (e.g., `vendor.service.api`)
- [ ] All services reference valid credentials and profiles
- [ ] No hardcoded production credentials
- [ ] Timeouts reasonable (5000-60000 ms)
- [ ] Rate limiting configured

### Uninstallation file (`impex/uninstall/services.xml`)

**Check:**
- [ ] All credentials, profiles, and services use `mode="delete"`
- [ ] Element order matches `services.xsd` (and install): credential → profile → service
- [ ] All IDs match install file

**BM UI vs Site Impex:** Business Manager UI still requires deleting the service first (`RemoveServiceProfile` / `RemoveServiceCredential` refuse delete while a service references them). That UI rule does **not** apply to CAP uninstall IMPEX.

**Verify pairs match:**
```bash
# Extract service IDs from both files
grep 'service-id=' impex/install/services.xml | sed 's/.*service-id="\([^"]*\)".*/\1/' | sort > /tmp/install.txt
grep 'service-id=' impex/uninstall/services.xml | sed 's/.*service-id="\([^"]*\)".*/\1/' | sort > /tmp/uninstall.txt

# Compare (should be identical)
diff /tmp/install.txt /tmp/uninstall.txt
```

## Step 4: Validate site preferences

### system-objecttype-extensions.xml

**Check:**
- [ ] XML namespace: `http://www.demandware.com/xml/impex/metadata/2006-10-31`
- [ ] All attribute IDs use camelCase (not snake_case)
- [ ] All IDs prefixed with app name
- [ ] Display names and descriptions present
- [ ] Appropriate data types (boolean, string, integer, enum-of-string, etc.)
- [ ] Default values match types
- [ ] All attributes in group definition

### preferences.xml

**Check:**
- [ ] Uses `SITEID` placeholder (not actual site ID)
- [ ] All preference IDs match attribute definitions
- [ ] Default values match types
- [ ] No sensitive data (API keys, secrets)

## Step 5: Validate custom objects

If present (`impex/install/meta/custom-objecttype-definitions.xml`):

**Check:**
- [ ] `key-attribute` defined and mandatory
- [ ] Storage scope: `site` or `organization`
- [ ] Retention policy set (0 or 1-365 days)
- [ ] Valid staging mode: `no-sharing`, `shared`, or `source-to-target`
- [ ] All attributes in group

## Step 6: Cross-file validation

Ensure install/uninstall pairs match:

```bash
# Verify all service IDs match
grep 'service-id=' impex/install/services.xml | sort > /tmp/install-ids.txt
grep 'service-id=' impex/uninstall/services.xml | sort > /tmp/uninstall-ids.txt
diff /tmp/install-ids.txt /tmp/uninstall-ids.txt
```

## Step 7: Common errors

| Error | Fix |
|-------|-----|
| `parser error: Opening and ending tag mismatch` | Add closing tag |
| `Namespace prefix dwre ... is not defined` | Use correct SFCC namespace |
| `Service with ID already exists` | Use unique IDs |
| `Attribute not defined in group` | Add to group-definitions |
| `Invalid value for type` | Match default value to type |
| `Cannot delete service, profile in use` | Business Manager UI: delete the service first, then the profile, then the credential. This UI rule does **not** apply to CAP uninstall IMPEX. |
| Uninstall `services.xml` fails XSD / services not deleted | Site Impex processes elements in document order. Use credential → profile → service (`mode="delete"`), the same sequence as install. |
| `SITEID not found` | Use SITEID placeholder |

## Step 8: Pre-import checklist

- [ ] All XML files well-formed
- [ ] Namespaces correct
- [ ] SITEID placeholder used
- [ ] Service IDs unique and dotted notation
- [ ] Uninstall matches install
- [ ] No hardcoded production credentials
- [ ] Attribute IDs use camelCase with app prefix
- [ ] All attributes in groups
- [ ] No sensitive data in defaults

## Quick validation command

```bash
find impex/ -name "*.xml" | while read f; do
  echo "Checking $f...";
  xmllint --noout "$f" && echo "✓" || echo "✗ ERROR";
done
```

## Testing after import

1. **Services:** Administration > Operations > Services
2. **Site Preferences:** Merchant Tools > Site Preferences > Custom Preferences
3. **Custom Objects:** Administration > Site Development > System Object Types

## Automation

Use the validation script in CI/CD:

```bash
#!/bin/bash
bash .claude/skills/validate-impex/scripts/validate-impex.sh impex/ || exit 1
```
