---
name: generate-site-preferences-impex
description: >-
  Generate SFCC site preference impex files with custom attribute definitions, groups,
  and default values. Supports all attribute types (string, boolean, enum, text, etc.),
  validation, and multi-language localization. Use this skill immediately whenever adding
  configurable settings to commerce apps, when users mention "site preferences", "custom preferences",
  "app configuration", "merchant settings", or need to expose ANY configuration options to merchants
  in Business Manager. Don't wait to be asked - if an app needs configuration, use this skill.
---

# Generate Site Preferences Impex

Generate complete site preference configuration impex files for SFCC commerce apps.

## When to use this skill

Use proactively whenever:
- Creating a new commerce app (always needs preferences)
- User mentions "configuration", "settings", or "preferences"
- App needs merchant-configurable options
- Adding API credentials, feature toggles, or environment selection
- Any scenario where merchants need to configure app behavior

## Step 1: Collect preference information

| Input | Example | Notes |
|-------|---------|-------|
| App name | `ratings-reviews` | Used for grouping and prefixing |
| Preference ID | `ratingsReviewsEnabled` | camelCase, unique |
| Display name | `Enable Ratings & Reviews` | Human-readable |
| Description | `Enable or disable ratings functionality` | Help text |
| Data type | `boolean`, `string`, `enum`, etc. | See attribute-types.md |
| Default value | `false`, `""`, etc. | Initial value |
| Mandatory | Yes/No | Required field? |
| Group ID | `ratingsReviews` | Logical grouping |

## Step 2: Choose attribute types

Read `references/attribute-types.md` for complete type reference with examples:
- **boolean** - Enable/disable flags
- **string** - API keys, URLs, short text
- **text** - Long descriptions, JSON configs
- **integer** - Counts, limits
- **decimal** - Percentages, ratings
- **enum-of-string** - Dropdown selections
- **set-of-string** - Multiple selections
- **email** - Email addresses
- **password** - Encrypted secrets

## Step 3: Use app-specific patterns

For common app types, read `references/app-patterns.md` which contains ready-to-use patterns for:
- Tax apps (company code, environment, commit settings)
- Payment apps (merchant ID, test mode, payment methods)
- Shipping apps (account number, origin, service levels)
- Reviews/ratings apps (moderation, display settings)

**Copy the relevant pattern and customize attribute IDs with your app name prefix.**

## Step 4: Generate meta/system-objecttype-extensions.xml

Create the attribute definitions file:

**File:** `impex/install/meta/system-objecttype-extensions.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">
    <type-extension type-id="SitePreferences">
        <custom-attribute-definitions>

            <!-- Enable/Disable Feature -->
            <attribute-definition attribute-id="{appName}Enabled">
                <display-name xml:lang="x-default">Enable {displayName}</display-name>
                <description xml:lang="x-default">Enable or disable {displayName} integration</description>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <default-value>false</default-value>
            </attribute-definition>

            <!-- API Credentials -->
            <attribute-definition attribute-id="{appName}ApiKey">
                <display-name xml:lang="x-default">{displayName} API Key</display-name>
                <type>string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <min-length>0</min-length>
                <default-value></default-value>
            </attribute-definition>

            <attribute-definition attribute-id="{appName}ApiSecret">
                <display-name xml:lang="x-default">{displayName} API Secret</display-name>
                <type>password</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <min-length>0</min-length>
            </attribute-definition>

            <!-- Environment Selection -->
            <attribute-definition attribute-id="{appName}Environment">
                <display-name xml:lang="x-default">{displayName} Environment</display-name>
                <type>enum-of-string</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <value-definitions>
                    <value-definition>
                        <display xml:lang="x-default">Sandbox (Testing)</display>
                        <value>sandbox</value>
                    </value-definition>
                    <value-definition>
                        <display xml:lang="x-default">Production (Live)</display>
                        <value>production</value>
                    </value-definition>
                </value-definitions>
                <default-value>sandbox</default-value>
            </attribute-definition>

            <!-- Debug Mode -->
            <attribute-definition attribute-id="{appName}DebugMode">
                <display-name xml:lang="x-default">Debug Mode</display-name>
                <type>boolean</type>
                <mandatory-flag>false</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <default-value>false</default-value>
            </attribute-definition>

        </custom-attribute-definitions>

        <!-- Group Definitions -->
        <group-definitions>
            <attribute-group group-id="{appName}">
                <display-name xml:lang="x-default">{displayName}</display-name>
                <attribute attribute-id="{appName}Enabled"/>
                <attribute attribute-id="{appName}ApiKey"/>
                <attribute attribute-id="{appName}ApiSecret"/>
                <attribute attribute-id="{appName}Environment"/>
                <attribute attribute-id="{appName}DebugMode"/>
            </attribute-group>
        </group-definitions>

    </type-extension>
</metadata>
```

## Step 5: Generate sites/SITEID/preferences.xml

Create default preference values:

**File:** `impex/install/sites/SITEID/preferences.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2006-10-31">
    <preference preference-id="{appName}Enabled">false</preference>
    <preference preference-id="{appName}Environment">sandbox</preference>
    <preference preference-id="{appName}DebugMode">false</preference>

    <!-- Leave sensitive values (API keys, secrets) empty -->
</preferences>
```

**CRITICAL:** Use `SITEID` placeholder, not actual site ID.

## Step 6: Add localization (optional)

For international merchants, add translations. See `references/attribute-types.md` for localization examples.

## Step 7: Best practices

### Naming
- Prefix ALL IDs with app name: `{appName}SettingName`
- Use camelCase: `myPreferenceName`
- Be descriptive: `autoCommitTaxOnInvoice`

### Defaults
- Safe defaults: Start with features disabled
- Sensible values: Choose defaults that work for most cases
- Empty credentials: Don't include placeholder API keys

### Security
- Use `password` type for API secrets
- Don't expose secrets in XML
- Document sensitive fields clearly

### Validation
- Set min/max values for numbers
- Use enum for fixed options
- Mark mandatory carefully (only essentials)

## Step 8: Validation checklist

- [ ] All attribute IDs prefixed with app name
- [ ] camelCase naming
- [ ] Display names clear and descriptive
- [ ] Descriptions provide helpful guidance
- [ ] Appropriate data types
- [ ] Safe default values
- [ ] Password type for secrets
- [ ] All attributes in group definition
- [ ] XML well-formed
- [ ] SITEID placeholder used

## Step 9: Testing

```bash
# Validate XML
xmllint --noout impex/install/meta/system-objecttype-extensions.xml
xmllint --noout impex/install/sites/SITEID/preferences.xml

# Import via Business Manager
# Administration > Site Development > Import & Export

# Verify in Business Manager
# Merchant Tools > Site Preferences > Custom Preferences
```

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Missing app prefix | Add app name prefix to all IDs |
| snake_case IDs | Use camelCase |
| No default values | Set sensible defaults |
| Everything mandatory | Only require essentials |
| Generic descriptions | Provide clear guidance |
| Hardcoded credentials | Leave empty for merchants |
| Not in group | Add all attributes to group |

## Quick reference

```xml
<attribute-definition attribute-id="{appName}Enabled">
    <display-name xml:lang="x-default">Enable {App Name}</display-name>
    <type>boolean</type>
    <mandatory-flag>false</mandatory-flag>
    <externally-managed-flag>false</externally-managed-flag>
    <default-value>false</default-value>
</attribute-definition>
```

## Reference files

- `references/attribute-types.md` - Complete type reference with examples
- `references/app-patterns.md` - Pre-built patterns for common app types
