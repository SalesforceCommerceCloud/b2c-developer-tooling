# Custom Object Patterns Reference

Common custom object patterns for SFCC commerce apps. Use these as templates.

## Pattern 1: API Response Cache

Cache expensive API calls to reduce latency and costs.

**Key structure:** `{siteID}_{productID}`
**Retention:** 7 days
**Storage scope:** site

```xml
<type-extension type-id="RatingsReviewsCache">
    <key-attribute attribute-id="cacheKey"/>
    <custom-attribute-definitions>
        <attribute-definition attribute-id="cacheKey">
            <display-name xml:lang="x-default">Cache Key</display-name>
            <type>string</type>
            <mandatory-flag>true</mandatory-flag>
            <min-length>1</min-length>
            <max-length>256</max-length>
        </attribute-definition>

        <attribute-definition attribute-id="responseData">
            <display-name xml:lang="x-default">Response Data</display-name>
            <type>text</type>
            <mandatory-flag>true</mandatory-flag>
        </attribute-definition>

        <attribute-definition attribute-id="cachedAt">
            <display-name xml:lang="x-default">Cached At</display-name>
            <type>datetime</type>
            <mandatory-flag>true</mandatory-flag>
        </attribute-definition>

        <attribute-definition attribute-id="ttlSeconds">
            <display-name xml:lang="x-default">TTL (seconds)</display-name>
            <type>integer</type>
            <min-value>0</min-value>
            <default-value>3600</default-value>
        </attribute-definition>
    </custom-attribute-definitions>

    <group-definitions>
        <attribute-group group-id="ratingsReviewsCache">
            <display-name xml:lang="x-default">Ratings & Reviews Cache</display-name>
            <attribute attribute-id="cacheKey"/>
            <attribute attribute-id="responseData"/>
            <attribute attribute-id="cachedAt"/>
            <attribute attribute-id="ttlSeconds"/>
        </attribute-group>
    </group-definitions>
</type-extension>

<custom-type type-id="RatingsReviewsCache">
    <display-name xml:lang="x-default">Ratings & Reviews Cache</display-name>
    <staging-mode>no-sharing</staging-mode>
    <storage-scope>site</storage-scope>
    <key-definition attribute-id="cacheKey"/>
    <retention-days>7</retention-days>
</custom-type>
```

## Pattern 2: Configuration Storage

Store complex app configuration beyond site preferences.

**Key structure:** `config_{environment}_{feature}`
**Retention:** Permanent (0 days)
**Storage scope:** organization

```xml
<type-extension type-id="AppConfiguration">
    <key-attribute attribute-id="configKey"/>
    <custom-attribute-definitions>
        <attribute-definition attribute-id="configKey">
            <display-name xml:lang="x-default">Configuration Key</display-name>
            <type>string</type>
            <mandatory-flag>true</mandatory-flag>
            <min-length>1</min-length>
            <max-length>256</max-length>
        </attribute-definition>

        <attribute-definition attribute-id="configValue">
            <display-name xml:lang="x-default">Configuration Value</display-name>
            <type>text</type>
            <mandatory-flag>true</mandatory-flag>
        </attribute-definition>

        <attribute-definition attribute-id="environment">
            <display-name xml:lang="x-default">Environment</display-name>
            <type>enum-of-string</type>
            <value-definitions>
                <value-definition>
                    <display xml:lang="x-default">Development</display>
                    <value>development</value>
                </value-definition>
                <value-definition>
                    <display xml:lang="x-default">Staging</display>
                    <value>staging</value>
                </value-definition>
                <value-definition>
                    <display xml:lang="x-default">Production</display>
                    <value>production</value>
                </value-definition>
            </value-definitions>
            <default-value>production</default-value>
        </attribute-definition>

        <attribute-definition attribute-id="lastUpdated">
            <display-name xml:lang="x-default">Last Updated</display-name>
            <type>datetime</type>
        </attribute-definition>
    </custom-attribute-definitions>

    <group-definitions>
        <attribute-group group-id="appConfiguration">
            <display-name xml:lang="x-default">App Configuration</display-name>
            <attribute attribute-id="configKey"/>
            <attribute attribute-id="configValue"/>
            <attribute attribute-id="environment"/>
            <attribute attribute-id="lastUpdated"/>
        </attribute-group>
    </group-definitions>
</type-extension>

<custom-type type-id="AppConfiguration">
    <display-name xml:lang="x-default">App Configuration</display-name>
    <staging-mode>source-to-target</staging-mode>
    <storage-scope>organization</storage-scope>
    <key-definition attribute-id="configKey"/>
    <retention-days>0</retention-days>
</custom-type>
```

## Pattern 3: Audit Log / Activity Tracking

Track user actions, API calls, or system events.

**Key structure:** `{timestamp}_{userId}`
**Retention:** 30 days
**Storage scope:** site

```xml
<type-extension type-id="AuditLog">
    <key-attribute attribute-id="logId"/>
    <custom-attribute-definitions>
        <attribute-definition attribute-id="logId">
            <display-name xml:lang="x-default">Log ID</display-name>
            <type>string</type>
            <mandatory-flag>true</mandatory-flag>
            <min-length>1</min-length>
            <max-length>256</max-length>
        </attribute-definition>

        <attribute-definition attribute-id="eventType">
            <display-name xml:lang="x-default">Event Type</display-name>
            <type>enum-of-string</type>
            <mandatory-flag>true</mandatory-flag>
            <value-definitions>
                <value-definition>
                    <display xml:lang="x-default">API Call</display>
                    <value>api_call</value>
                </value-definition>
                <value-definition>
                    <display xml:lang="x-default">Configuration Change</display>
                    <value>config_change</value>
                </value-definition>
                <value-definition>
                    <display xml:lang="x-default">Error</display>
                    <value>error</value>
                </value-definition>
            </value-definitions>
        </attribute-definition>

        <attribute-definition attribute-id="eventData">
            <display-name xml:lang="x-default">Event Data</display-name>
            <type>text</type>
        </attribute-definition>

        <attribute-definition attribute-id="timestamp">
            <display-name xml:lang="x-default">Timestamp</display-name>
            <type>datetime</type>
            <mandatory-flag>true</mandatory-flag>
        </attribute-definition>

        <attribute-definition attribute-id="severity">
            <display-name xml:lang="x-default">Severity</display-name>
            <type>enum-of-string</type>
            <value-definitions>
                <value-definition>
                    <display xml:lang="x-default">Info</display>
                    <value>info</value>
                </value-definition>
                <value-definition>
                    <display xml:lang="x-default">Warning</display>
                    <value>warning</value>
                </value-definition>
                <value-definition>
                    <display xml:lang="x-default">Error</display>
                    <value>error</value>
                </value-definition>
            </value-definitions>
            <default-value>info</default-value>
        </attribute-definition>
    </custom-attribute-definitions>

    <group-definitions>
        <attribute-group group-id="auditLog">
            <display-name xml:lang="x-default">Audit Log</display-name>
            <attribute attribute-id="logId"/>
            <attribute attribute-id="eventType"/>
            <attribute attribute-id="eventData"/>
            <attribute attribute-id="timestamp"/>
            <attribute attribute-id="severity"/>
        </attribute-group>
    </group-definitions>
</type-extension>

<custom-type type-id="AuditLog">
    <display-name xml:lang="x-default">Audit Log</display-name>
    <staging-mode>no-sharing</staging-mode>
    <storage-scope>site</storage-scope>
    <key-definition attribute-id="logId"/>
    <retention-days>30</retention-days>
</custom-type>
```

## Pattern 4: Session/State Management

Store temporary session data or user state.

**Key structure:** `session_{sessionID}`
**Retention:** 1 day
**Storage scope:** site

```xml
<type-extension type-id="SessionState">
    <key-attribute attribute-id="sessionId"/>
    <custom-attribute-definitions>
        <attribute-definition attribute-id="sessionId">
            <display-name xml:lang="x-default">Session ID</display-name>
            <type>string</type>
            <mandatory-flag>true</mandatory-flag>
            <min-length>1</min-length>
            <max-length>256</max-length>
        </attribute-definition>

        <attribute-definition attribute-id="sessionData">
            <display-name xml:lang="x-default">Session Data</display-name>
            <type>text</type>
            <mandatory-flag>true</mandatory-flag>
        </attribute-definition>

        <attribute-definition attribute-id="createdAt">
            <display-name xml:lang="x-default">Created At</display-name>
            <type>datetime</type>
            <mandatory-flag>true</mandatory-flag>
        </attribute-definition>

        <attribute-definition attribute-id="lastAccessed">
            <display-name xml:lang="x-default">Last Accessed</display-name>
            <type>datetime</type>
        </attribute-definition>
    </custom-attribute-definitions>

    <group-definitions>
        <attribute-group group-id="sessionState">
            <display-name xml:lang="x-default">Session State</display-name>
            <attribute attribute-id="sessionId"/>
            <attribute attribute-id="sessionData"/>
            <attribute attribute-id="createdAt"/>
            <attribute attribute-id="lastAccessed"/>
        </attribute-group>
    </group-definitions>
</type-extension>

<custom-type type-id="SessionState">
    <display-name xml:lang="x-default">Session State</display-name>
    <staging-mode>no-sharing</staging-mode>
    <storage-scope>site</storage-scope>
    <key-definition attribute-id="sessionId"/>
    <retention-days>1</retention-days>
</custom-type>
```

## Configuration Settings Reference

### Staging Mode
- `no-sharing` - Independent in staging/production (most common)
- `shared` - Same data everywhere
- `source-to-target` - Replicate from staging to production

### Storage Scope
- `site` - Site-specific data (most common)
- `organization` - Shared across all sites

### Retention Days
- `0` - Permanent
- `1-7` - Cache/temp data
- `30` - Logs
- `365` - Long-term data

### Key Patterns
Good: `{siteID}_{productID}`, `{customerID}_{timestamp}`
Bad: Random UUIDs, no delimiters, overly long keys
