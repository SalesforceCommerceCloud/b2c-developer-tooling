# Impex Validation Reference

**When to use:** Backend-only and Fullstack apps only. Skip for UI-only architecture.

This reference provides detailed validation rules for all SFCC impex XML files.

## Table of Contents
1. [XML Syntax Validation](#xml-syntax-validation)
2. [Services Validation](#services-validation)
3. [Site Preferences Validation](#site-preferences-validation)
4. [Custom Objects Validation](#custom-objects-validation)
5. [Cross-File Validation](#cross-file-validation)
6. [Common Errors](#common-errors)

## XML Syntax Validation

Validate all XML files are well-formed:
```bash
find commerce-<appName>-app-v<version>/impex/ -name "*.xml" -exec xmllint --noout {} \;
```

## Services Validation

### Install file (`impex/install/services.xml`)

**Required checks:**
- [ ] XML namespace is `http://www.demandware.com/xml/impex/services/2015-07-01`
- [ ] All service IDs use dotted notation (e.g., `vendor.service.api`)
- [ ] All services reference valid credentials and profiles
- [ ] No hardcoded production credentials or secrets
- [ ] Timeouts are reasonable (5000-60000 ms)
- [ ] Rate limiting configured for external APIs

### Uninstall file (`impex/uninstall/services.xml`)

**Required checks:**
- [ ] All credentials, profiles, and services use `mode="delete"`
- [ ] Element order matches `services.xsd` (and install): credential → profile → service
- [ ] All service/profile/credential IDs match install file exactly

**BM UI vs Site Impex:** Business Manager UI refuses to delete a profile or credential while a service still references it (delete the service first). That UI rule does **not** apply to CAP uninstall IMPEX. Site Impex processes elements in document order and `services.xsd` requires credential → profile → service.

## Site Preferences Validation

### Metadata file (`impex/install/meta/system-objecttype-extensions.xml`)

**Required checks:**
- [ ] XML namespace is `http://www.demandware.com/xml/impex/metadata/2006-10-31`
- [ ] All attribute IDs use camelCase (not snake_case)
- [ ] All attribute IDs prefixed with app name
- [ ] All attributes have display names and descriptions
- [ ] Default values match data types
- [ ] All attributes added to group definition
- [ ] Valid attribute types used (string, boolean, integer, enum-of-string, etc.)

### Preferences file (`impex/install/sites/SITEID/preferences.xml`)

**Required checks:**
- [ ] Uses `SITEID` placeholder (not actual site ID)
- [ ] All preference IDs match attribute definitions
- [ ] Default values match data types
- [ ] No sensitive data (API keys, secrets)

## Custom Objects Validation

**Custom object definitions (`impex/install/meta/custom-objecttype-definitions.xml`):**

**Required checks:**
- [ ] `key-attribute` defined and mandatory
- [ ] Storage scope is `site` or `organization`
- [ ] Retention policy set (0 or 1-365 days)
- [ ] Valid staging mode (`no-sharing`, `shared`, or `source-to-target`)
- [ ] All attributes added to group

## Cross-File Validation

Verify install/uninstall pairs match:

```bash
# Extract and compare service IDs
grep 'service-id=' impex/install/services.xml | sed 's/.*service-id="\([^"]*\)".*/\1/' | sort > /tmp/install.txt
grep 'service-id=' impex/uninstall/services.xml | sed 's/.*service-id="\([^"]*\)".*/\1/' | sort > /tmp/uninstall.txt
diff /tmp/install.txt /tmp/uninstall.txt
```

**What to check:**
- All service IDs in install must have matching delete entries in uninstall
- All credential IDs in install must have matching delete entries in uninstall
- All profile IDs in install must have matching delete entries in uninstall

## Common Errors

Check for these frequent issues:

**XML encoding:**
- [ ] No unescaped special characters (`&` → `&amp;`, `<` → `&lt;`, etc.)

**ID naming:**
- [ ] No duplicate service/credential/profile IDs
- [ ] Service IDs don't use underscores (use dots instead)
- [ ] Attribute IDs don't use underscores (use camelCase)

**Structure:**
- [ ] All XML files are well-formed (no unclosed tags)
- [ ] All XML files use correct namespace declarations
- [ ] Uninstall `services.xml` uses credential → profile → service (XSD order). BM UI service-first delete does not apply to IMPEX.

**If any validation fails:**
- Report specific file path
- Report line number (from xmllint output)
- Provide fix recommendation
