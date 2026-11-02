---
name: generate-custom-object-impex
description: >-
  Generate SFCC custom object type impex files with attribute definitions, key structures,
  and storage configurations. Use this skill immediately when your commerce app needs to store
  custom data like caching, configurations, or app-specific records. Don't wait for users to
  explicitly mention "custom objects" - if they describe storing data, caching API responses,
  persisting state, or need ANY kind of key-value storage beyond site preferences, use this skill.
---

# Generate Custom Object Impex

Generate complete custom object type definitions for SFCC commerce apps.

## When to use this skill

Use proactively whenever the app needs to store data:
- Caching API responses
- Storing app configuration (beyond site preferences)
- Logging and audit trails
- Session management
- Custom data storage (wishlists, notifications, etc.)
- Any key-value data persistence

## Step 1: Understand custom objects

**What are custom objects?**
- Key-value storage for custom application data
- Persist data across sessions
- Query and index capabilities
- Can store complex data structures (JSON in text fields)

**Common use cases:**
- Cache: API responses, calculated data
- Config: Complex app settings, feature flags
- Logs: Activity tracking, audit trails, errors
- Session: Temporary user state, shopping data

## Step 2: Collect information

| Input | Example | Notes |
|-------|---------|-------|
| Object Type ID | `RatingsReviewsCache` | PascalCase, unique |
| Display Name | `Ratings & Reviews Cache` | Human-readable |
| Key Pattern | `{siteID}_{productID}` | How keys structured |
| Storage Duration | `7 days`, `permanent` | Retention policy |
| Data Attributes | List of fields | What to store |

## Step 3: Choose pattern

Read `references/patterns.md` for complete pre-built patterns:

1. **API Response Cache** - Cache expensive API calls
   - Retention: 7 days
   - Scope: site
   - Use when: Caching external API data

2. **Configuration Storage** - Complex app settings
   - Retention: Permanent
   - Scope: organization
   - Use when: Settings beyond site preferences

3. **Audit Log** - Track user actions/events
   - Retention: 30 days
   - Scope: site
   - Use when: Need activity tracking

4. **Session/State** - Temporary user data
   - Retention: 1 day
   - Scope: site
   - Use when: Storing temporary session info

**Copy the relevant pattern from references/patterns.md and customize.**

## Step 4: Generate impex file

**File:** `impex/install/meta/custom-objecttype-definitions.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<metadata xmlns="http://www.demandware.com/xml/impex/metadata/2006-10-31">

    <!-- Custom Object Type Definition -->
    <type-extension type-id="{ObjectTypeID}">
        <key-attribute attribute-id="keyProperty"/>

        <custom-attribute-definitions>

            <!-- Key Property (Required) -->
            <attribute-definition attribute-id="keyProperty">
                <display-name xml:lang="x-default">Key</display-name>
                <description xml:lang="x-default">Unique identifier</description>
                <type>string</type>
                <mandatory-flag>true</mandatory-flag>
                <externally-managed-flag>false</externally-managed-flag>
                <min-length>1</min-length>
                <max-length>256</max-length>
            </attribute-definition>

            <!-- Add your custom attributes here -->

        </custom-attribute-definitions>

        <group-definitions>
            <attribute-group group-id="{ObjectTypeID}">
                <display-name xml:lang="x-default">{Display Name}</display-name>
                <attribute attribute-id="keyProperty"/>
                <!-- Add all attributes to group -->
            </attribute-group>
        </group-definitions>

    </type-extension>

    <!-- Storage Configuration -->
    <custom-type type-id="{ObjectTypeID}">
        <display-name xml:lang="x-default">{Display Name}</display-name>
        <description xml:lang="x-default">{Description}</description>
        <staging-mode>no-sharing</staging-mode>
        <storage-scope>site</storage-scope>
        <key-definition attribute-id="keyProperty"/>
        <retention-days>{retentionDays}</retention-days>
    </custom-type>

</metadata>
```

## Step 5: Configure storage settings

### Staging Mode
- `no-sharing` - Independent in staging/production (most common)
- `shared` - Same data everywhere
- `source-to-target` - Replicate staging → production

**Recommendation:** Use `no-sharing` for cache/session/test data. Use `shared` for reference data.

### Storage Scope
- `site` - Site-specific data (most common)
- `organization` - Shared across all sites

**Recommendation:** Use `site` for site-specific data. Use `organization` for global settings.

### Retention Days
- `0` - Permanent (never auto-delete)
- `1-7` - Cache/temp data
- `30` - Logs
- `365` - Long-term

**Recommendation:**
- Cache: 1-7 days
- Logs: 30 days
- Configuration: 0 (permanent)
- Session: 1 day

## Step 6: Key design patterns

**Good key patterns:**
- `{siteID}_{productID}` - Site-specific product cache
- `{customerID}_{timestamp}` - Customer activity log
- `config_{environment}_{feature}` - Environment-specific config
- `session_{sessionID}` - Session identifier

**Bad key patterns:**
- Random UUIDs (hard to query/debug)
- No delimiters (hard to parse)
- Overly long keys (performance impact)

## Step 7: Data storage

**For small data (<4KB):**
- Use `string` type for simple values
- Store JSON in `text` type for structured data

**For large data (>4KB):**
- Split into multiple custom objects
- Use external storage (S3, etc.) and store reference

**JSON storage example:**
```javascript
var customObj = CustomObjectMgr.createCustomObject('MyCache', cacheKey);
customObj.custom.responseData = JSON.stringify({
    productId: product.ID,
    rating: 4.5,
    lastUpdated: new Date().toISOString()
});
```

## Step 8: Best practices

### Performance
- Index frequently queried fields (use key property)
- Set retention days (auto-cleanup prevents bloat)
- Use site scope when possible (better performance)

### Data Management
- Clean up old data (use retention or manual cleanup)
- Monitor storage (track custom object counts)
- Handle missing data (always check if object exists)
- Validate before storing (check data types and sizes)

### Security
- Don't store sensitive data (no passwords, credit cards, PII)
- Encrypt if needed (use SFCC encryption)
- Access control (limit read/write permissions)

## Step 9: Validation checklist

- [ ] Object type ID is PascalCase and unique
- [ ] Key attribute defined and mandatory
- [ ] All attributes have appropriate types
- [ ] Storage scope appropriate (site vs organization)
- [ ] Staging mode correct (usually no-sharing)
- [ ] Retention days set appropriately
- [ ] All attributes added to group
- [ ] XML well-formed
- [ ] No sensitive data stored unencrypted

## Step 10: Testing

```bash
# Validate XML
xmllint --noout impex/install/meta/custom-objecttype-definitions.xml

# Import via Business Manager
# Administration > Site Development > Import & Export

# Verify in Business Manager
# Administration > Site Development > System Object Types

# Test in code
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

// Create
var obj = CustomObjectMgr.createCustomObject('MyObjectType', 'test-key');
obj.custom.myAttribute = 'value';

// Read
var obj = CustomObjectMgr.getCustomObject('MyObjectType', 'test-key');

// Query
var objs = CustomObjectMgr.queryCustomObjects('MyObjectType', '', 'creationDate desc');

// Delete
CustomObjectMgr.remove(obj);
```

## Common mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing key-attribute | Type won't work | Define key attribute |
| No retention policy | Storage bloat | Set appropriate retention |
| Wrong storage scope | Performance issues | Use site unless shared needed |
| Storing sensitive data | Security risk | Use encryption or don't store |
| No cleanup strategy | Storage limits | Set retention or cleanup job |
| Complex key patterns | Hard to query | Keep keys simple |

## Reference files

- `references/patterns.md` - Pre-built patterns for common use cases with complete XML
