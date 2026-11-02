---
name: generate-service-impex
description: >-
  Generate SFCC service configuration impex files (credentials, profiles, and definitions).
  Supports multiple authentication patterns, rate limiting, circuit breakers, and uninstall
  scripts. Use this skill immediately when creating or updating service integrations for commerce apps.
  Don't wait for users to mention "services" - if they describe integrating with external APIs,
  third-party services, webhooks, or ANY HTTP/REST communication, use this skill proactively.
---

# Generate Service Impex

Generate complete service configuration impex files for SFCC commerce apps.

## When to use this skill

Use proactively whenever:
- Integrating with external APIs
- Setting up third-party service connections
- Configuring webhooks or HTTP endpoints
- Any scenario requiring HTTP/REST/FTP communication

## Step 1: Collect service information

| Input | Example | Notes |
|-------|---------|-------|
| Service ID | `avalara.tax.api` | Dotted notation, vendor.service |
| Service Name | `Avalara Tax API` | Human-readable name |
| Credential ID | `avalara.tax.credential` | Usually `{vendor}.{service}.credential` |
| Profile ID | `avalara.tax.profile` | Usually `{vendor}.{service}.profile` |
| Base URL | `https://rest.avatax.com/api/v2` | API endpoint |
| Auth Type | `bearer`, `basic`, `oauth2` | Authentication method |
| Timeout (ms) | `30000` | Default: 30000 (30 seconds) |
| Rate limiting | Yes/No | Enable rate limiting? |
| Circuit breaker | Yes/No | Enable circuit breaker? |

## Step 2: Choose authentication pattern

### Pattern 1: Bearer Token / API Key (Most Common)

Use for: Modern REST APIs, SaaS platforms

```xml
<service-credential credential-id="{credentialId}">
    <url>{baseUrl}</url>
    <user-id>{apiKeyPlaceholder}</user-id>
    <password>{apiSecretPlaceholder}</password>
</service-credential>
```

### Pattern 2: Basic Authentication

Use for: Legacy APIs, simple username/password

### Pattern 3: OAuth 2.0

Use for: OAuth-based APIs, three-legged auth

### Pattern 4: Custom Headers

Use for: APIs requiring custom authentication headers

**See `references/service-patterns.md` for complete pattern examples.**

## Step 3: Use app-specific patterns

Read `references/service-patterns.md` for pre-built patterns:

- **Tax apps** - Fast timeout (5s), high rate limit, circuit breaker enabled
- **Payment apps** - Medium timeout (10s), moderate rate limit, circuit breaker enabled
- **Shipping apps** - Fast timeout (5s), high rate limit, circuit breaker enabled
- **Reviews/ratings apps** - Longer timeout (10s), lower rate limit, circuit breaker optional

**Copy the relevant pattern and customize with your service details.**

## Step 4: Generate install/services.xml

**File:** `impex/install/services.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns="http://www.demandware.com/xml/impex/services/2015-07-01">

    <!-- Service Credential -->
    <service-credential credential-id="{credentialId}">
        <url>{baseUrl}</url>
        <user-id>{placeholder_api_key}</user-id>
        <password>{placeholder_api_secret}</password>
    </service-credential>

    <!-- Service Profile -->
    <service-profile profile-id="{profileId}">
        <timeout-millis>{timeout}</timeout-millis>

        <!-- Rate Limiting -->
        <rate-limit-enabled>{rateLimitEnabled}</rate-limit-enabled>
        <rate-limit-calls>100</rate-limit-calls>
        <rate-limit-millis>1000</rate-limit-millis>

        <!-- Circuit Breaker -->
        <circuit-breaker-enabled>{circuitBreakerEnabled}</circuit-breaker-enabled>
        <circuit-breaker-max-calls>5</circuit-breaker-max-calls>
    </service-profile>

    <!-- Service Definition -->
    <service service-id="{serviceId}">
        <service-type>HTTP</service-type>
        <enabled>true</enabled>
        <log-prefix>{serviceName}</log-prefix>
        <communication-log>true</communication-log>
        <mock-mode-enabled>false</mock-mode-enabled>
        <credential credential-id="{credentialId}"/>
        <profile profile-id="{profileId}"/>
    </service>

</services>
```

## Step 5: Generate uninstall/services.xml

**File:** `impex/uninstall/services.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns="http://www.demandware.com/xml/impex/services/2015-07-01">
    <!-- Same XSD order as install: credential → profile → service -->
    <service-credential credential-id="{credentialId}" mode="delete"/>
    <service-profile profile-id="{profileId}" mode="delete"/>
    <service service-id="{serviceId}" mode="delete"/>
</services>
```

**CRITICAL:** Always use `mode="delete"`. Site Impex `services.xsd` requires this sequence: `service-credential`, then `service-profile`, then `service`. Use the **same element order for install and uninstall**. The platform processes elements in document order; putting `<service>` first makes the uninstall file invalid against the XSD, so services are not deleted. Impex is safe deleting credentials and profiles first because ORM nulls `SERVICE.CREDENTIALID` / `PROFILEID` when those objects are removed.

**BM UI vs Site Impex:** Business Manager UI still requires deleting the service first (`RemoveServiceProfile` / `RemoveServiceCredential` refuse delete while a service references them). That UI rule does **not** apply to CAP uninstall IMPEX.

## Step 6: Configuration best practices

### Rate Limiting
- Tax/Shipping (high volume): 100 calls/1s
- Payment (moderate): 50 calls/1s
- Background jobs: 10 calls/1s

### Timeouts
- Real-time checkout: 5000-10000 ms
- Background jobs: 30000-60000 ms
- File uploads: 60000+ ms

### Circuit Breaker
- Critical services (payment, tax): `max-calls="3"` (fail fast)
- Non-critical: `max-calls="5-10"` or disabled

## Step 7: Advanced configurations

### Multiple Environments (Sandbox & Production)

```xml
<service-credential credential-id="{credentialId}.sandbox">
    <url>https://sandbox.api.example.com</url>
    <user-id>sandbox_api_key</user-id>
    <password>sandbox_api_secret</password>
</service-credential>

<service-credential credential-id="{credentialId}.prod">
    <url>https://api.example.com</url>
    <user-id>prod_api_key</user-id>
    <password>prod_api_secret</password>
</service-credential>

<service service-id="{serviceId}">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>{serviceName}</log-prefix>
    <credential credential-id="{credentialId}.sandbox"/>
    <profile profile-id="{profileId}"/>
</service>
```

### Multiple Services (Same Provider)

Share profile across multiple endpoints:

```xml
<service-profile profile-id="{vendor}.profile">
    <timeout-millis>30000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>100</rate-limit-calls>
    <rate-limit-millis>1000</rate-limit-millis>
</service-profile>

<service service-id="{vendor}.ratings.api">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>{vendor} Ratings</log-prefix>
    <credential credential-id="{vendor}.ratings.credential"/>
    <profile profile-id="{vendor}.profile"/>
</service>

<service service-id="{vendor}.reviews.api">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>{vendor} Reviews</log-prefix>
    <credential credential-id="{vendor}.reviews.credential"/>
    <profile profile-id="{vendor}.profile"/>
</service>
```

### FTP/SFTP Services

```xml
<service service-id="{serviceId}">
    <service-type>FTP</service-type>
    <enabled>true</enabled>
    <log-prefix>{serviceName} FTP</log-prefix>
    <credential credential-id="{credentialId}"/>
</service>
```

## Step 8: Validation checklist

- [ ] Service IDs use dotted notation and are unique
- [ ] Credential IDs match naming convention
- [ ] Base URL is placeholder (no hardcoded production keys)
- [ ] Timeout appropriate for service type
- [ ] Rate limiting configured
- [ ] Circuit breaker enabled for external APIs
- [ ] Uninstall file includes all credentials, profiles, and services in XSD order (credential → profile → service)
- [ ] All uninstall entries use `mode="delete"`
- [ ] XML well-formed
- [ ] Log prefix descriptive

## Step 9: Testing

```bash
# Validate XML
xmllint --noout impex/install/services.xml
xmllint --noout impex/uninstall/services.xml

# Import via Business Manager
# Administration > Operations > Services

# Test service calls in code
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var service = LocalServiceRegistry.getService('{serviceId}');
var result = service.call(params);
```

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Hardcoded production credentials | Use placeholders |
| Missing uninstall script | Create matching uninstall |
| Wrong deletion order | For CAP uninstall IMPEX, use credential → profile → service (`mode="delete"`), the same XSD order as install. BM UI still requires service-first; that rule does not apply to IMPEX. |
| No rate limiting | Add rate limit config |
| Timeout too short | Increase based on API response time |
| No circuit breaker | Enable for external APIs |
| Generic service IDs | Use vendor-specific dotted notation |

## Reference files

- `references/service-patterns.md` - Complete patterns for tax, payment, shipping, reviews apps
