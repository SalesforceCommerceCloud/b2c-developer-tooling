# Service Configuration Patterns Reference

Pre-built service patterns for common commerce app types.

## Tax App Services

```xml
<service-credential credential-id="tax.calculation.credential">
    <url>https://api.taxprovider.com</url>
    <user-id>COMPANY_CODE</user-id>
    <password>API_KEY</password>
</service-credential>

<service-profile profile-id="tax.profile">
    <timeout-millis>5000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>100</rate-limit-calls>
    <rate-limit-millis>1000</rate-limit-millis>
    <circuit-breaker-enabled>true</circuit-breaker-enabled>
    <circuit-breaker-max-calls>3</circuit-breaker-max-calls>
</service-profile>

<service service-id="tax.calculation.api">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>Tax Calculation</log-prefix>
    <communication-log>true</communication-log>
    <credential credential-id="tax.calculation.credential"/>
    <profile profile-id="tax.profile"/>
</service>
```

## Payment App Services

```xml
<service-credential credential-id="payment.gateway.credential">
    <url>https://api.paymentgateway.com</url>
    <user-id>MERCHANT_ID</user-id>
    <password>API_SECRET</password>
</service-credential>

<service-profile profile-id="payment.profile">
    <timeout-millis>10000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>50</rate-limit-calls>
    <rate-limit-millis>1000</rate-limit-millis>
    <circuit-breaker-enabled>true</circuit-breaker-enabled>
    <circuit-breaker-max-calls>3</circuit-breaker-max-calls>
</service-profile>

<service service-id="payment.authorization.api">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>Payment Authorization</log-prefix>
    <communication-log>true</communication-log>
    <credential credential-id="payment.gateway.credential"/>
    <profile profile-id="payment.profile"/>
</service>
```

## Shipping App Services

```xml
<service-credential credential-id="shipping.carrier.credential">
    <url>https://api.carrier.com</url>
    <user-id>ACCOUNT_NUMBER</user-id>
    <password>API_KEY</password>
</service-credential>

<service-profile profile-id="shipping.profile">
    <timeout-millis>5000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>100</rate-limit-calls>
    <rate-limit-millis>1000</rate-limit-millis>
    <circuit-breaker-enabled>true</circuit-breaker-enabled>
    <circuit-breaker-max-calls>5</circuit-breaker-max-calls>
</service-profile>

<service service-id="shipping.rates.api">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>Shipping Rates</log-prefix>
    <communication-log>true</communication-log>
    <credential credential-id="shipping.carrier.credential"/>
    <profile profile-id="shipping.profile"/>
</service>
```

## Reviews/Ratings App Services

```xml
<service-credential credential-id="reviews.platform.credential">
    <url>https://api.reviews.com</url>
    <user-id>CLIENT_ID</user-id>
    <password>API_KEY</password>
</service-credential>

<service-profile profile-id="reviews.profile">
    <timeout-millis>10000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>50</rate-limit-calls>
    <rate-limit-millis>1000</rate-limit-millis>
    <circuit-breaker-enabled>false</circuit-breaker-enabled>
</service-profile>

<service service-id="reviews.api">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>Reviews Platform</log-prefix>
    <communication-log>true</communication-log>
    <credential credential-id="reviews.platform.credential"/>
    <profile profile-id="reviews.profile"/>
</service>
```

## Configuration Guidelines

### Rate Limiting by App Type

| App Type | Calls | Window | Notes |
|----------|-------|--------|-------|
| Tax | 100 | 1s | High volume during checkout |
| Payment | 50 | 1s | Moderate volume |
| Shipping | 100 | 1s | High volume during checkout |
| Reviews | 10-50 | 1s | Lower volume |

### Timeout Guidelines

| API Type | Timeout (ms) | Notes |
|----------|--------------|-------|
| Real-time checkout | 5000-10000 | Fast response required |
| Background jobs | 30000-60000 | Can wait longer |
| File uploads | 60000+ | Large files |

### Circuit Breaker Settings

- **Critical services (payment, tax):** `max-calls="3"` (fail fast)
- **Non-critical services (reviews):** `max-calls="5-10"` or disabled
- **Background jobs:** Circuit breaker optional
