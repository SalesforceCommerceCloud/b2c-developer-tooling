# Services XML Import/Export Reference

XML format for importing and exporting service configurations via site import/export.

## XML Namespace

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns="http://www.demandware.com/xml/impex/services/2014-09-26">
    <!-- service-credential, service-profile, and service elements -->
</services>
```

## XML Structure

Services XML contains three types of elements that must appear in this order:

1. `service-credential` - Authentication and URL configuration
2. `service-profile` - Rate limiting and circuit breaker settings
3. `service` - Service configuration linking credentials and profiles

## Service Credential

Defines authentication credentials and base URL.

```xml
<service-credential service-credential-id="my.api.credential">
    <url>https://api.example.com/v1</url>
    <user-id>api_user</user-id>
    <password>plaintext_password</password>
</service-credential>
```

### Credential Elements

| Element | Required | Description |
|---------|----------|-------------|
| `url` | No | Base URL for the service |
| `user-id` | No | Username for authentication |
| `password` | No | Password (plain text on import, encrypted on export) |
| `custom-attributes` | No | Custom attributes for the credential |

### Password Encryption

On export, passwords are encrypted:

```xml
<password encrypted="true" encryption-type="common.export">
    bZHe1DBvCOyUTyHpte9DSgQ2qpqQXe+s6vlsRYbEYAs=
</password>
```

On import, use plain text:

```xml
<password>my_secret_password</password>
```

### Credential with Custom Attributes

```xml
<service-credential service-credential-id="aws.s3">
    <url>https://bucket-name.s3.amazonaws.com</url>
    <user-id>AWS_ACCESS_KEY_ID</user-id>
    <password>AWS_SECRET_ACCESS_KEY</password>
    <custom-attributes>
        <custom-attribute attribute-id="awsRegion">us-east-2</custom-attribute>
    </custom-attributes>
</service-credential>
```

## Service Profile

Defines timeout, rate limiting, and circuit breaker settings.

```xml
<service-profile service-profile-id="my.api.profile">
    <timeout-millis>30000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>10</rate-limit-calls>
    <rate-limit-millis>2000</rate-limit-millis>
    <cb-enabled>true</cb-enabled>
    <cb-calls>5</cb-calls>
    <cb-millis>5000</cb-millis>
</service-profile>
```

### Profile Elements

| Element | Required | Default | Description |
|---------|----------|---------|-------------|
| `timeout-millis` | No | 30000 | Request timeout in milliseconds |
| `rate-limit-enabled` | No | false | Enable rate limiting |
| `rate-limit-calls` | No | 0 | Max calls in rate limit window |
| `rate-limit-millis` | No | 0 | Rate limit time window in ms |
| `cb-enabled` | No | false | Enable circuit breaker |
| `cb-ignore-5xx` | No | false | Don't count 5xx as failures |
| `cb-calls` | No | 0 | Failures before circuit opens |
| `cb-millis` | No | 0 | Circuit breaker time window |
| `custom-attributes` | No | | Custom attributes |

### Profile Examples

**High-throughput API:**
```xml
<service-profile service-profile-id="high-throughput">
    <timeout-millis>5000</timeout-millis>
    <rate-limit-enabled>true</rate-limit-enabled>
    <rate-limit-calls>100</rate-limit-calls>
    <rate-limit-millis>1000</rate-limit-millis>
    <cb-enabled>true</cb-enabled>
    <cb-calls>10</cb-calls>
    <cb-millis>2000</cb-millis>
</service-profile>
```

**Long-running service (no rate limit):**
```xml
<service-profile service-profile-id="long-running">
    <timeout-millis>90000</timeout-millis>
    <rate-limit-enabled>false</rate-limit-enabled>
    <rate-limit-calls>0</rate-limit-calls>
    <rate-limit-millis>0</rate-limit-millis>
    <cb-enabled>true</cb-enabled>
    <cb-calls>3</cb-calls>
    <cb-millis>1000</cb-millis>
</service-profile>
```

**No protections (internal service):**
```xml
<service-profile service-profile-id="internal">
    <timeout-millis>60000</timeout-millis>
    <rate-limit-enabled>false</rate-limit-enabled>
    <rate-limit-calls>0</rate-limit-calls>
    <rate-limit-millis>0</rate-limit-millis>
    <cb-enabled>false</cb-enabled>
    <cb-calls>0</cb-calls>
    <cb-millis>0</cb-millis>
</service-profile>
```

## Service

Links service type, profile, and credential together.

```xml
<service service-id="my.api.service">
    <service-type>HTTP</service-type>
    <enabled>true</enabled>
    <log-prefix>myapi</log-prefix>
    <comm-log-enabled>false</comm-log-enabled>
    <force-prd-enabled>true</force-prd-enabled>
    <mock-mode-enabled>false</mock-mode-enabled>
    <profile-id>my.api.profile</profile-id>
    <credential-id>my.api.credential</credential-id>
</service>
```

### Service Elements

| Element | Required | Description |
|---------|----------|-------------|
| `service-type` | Yes | HTTP, HTTPForm, FTP, SFTP, SOAP, GENERIC |
| `enabled` | No | Enable/disable the service |
| `log-prefix` | No | Prefix for log entries |
| `comm-log-enabled` | No | Enable communication logging |
| `force-prd-enabled` | No | Force logging on production |
| `mock-mode-enabled` | No | Enable mock mode |
| `profile-id` | No | Reference to service profile |
| `credential-id` | No | Reference to service credential |
| `custom-attributes` | No | Custom attributes |

### Service Types

| Type | Description |
|------|-------------|
| `HTTP` | Standard HTTP/HTTPS requests |
| `HTTPForm` | Form-encoded HTTP requests |
| `FTP` | FTP file transfer (deprecated) |
| `SFTP` | Secure FTP file transfer |
| `SOAP` | SOAP web services |
| `GENERIC` | Custom protocol implementation |

## Complete Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<services xmlns="http://www.demandware.com/xml/impex/services/2014-09-26">

    <!-- OAuth Token Endpoint Credential -->
    <service-credential service-credential-id="my.oauth.token.cred">
        <url>https://auth.example.com/oauth/token</url>
        <user-id>client_id_here</user-id>
        <password>client_secret_here</password>
    </service-credential>

    <!-- API Credential -->
    <service-credential service-credential-id="my.api.cred">
        <url>https://api.example.com/v2</url>
        <user-id/>
        <password/>
    </service-credential>

    <!-- SFTP Credential -->
    <service-credential service-credential-id="my.sftp.cred">
        <url>sftp://sftp.example.com:22</url>
        <user-id>sftp_user</user-id>
        <password>sftp_password</password>
    </service-credential>

    <!-- Standard API Profile -->
    <service-profile service-profile-id="standard.api">
        <timeout-millis>15000</timeout-millis>
        <rate-limit-enabled>true</rate-limit-enabled>
        <rate-limit-calls>10</rate-limit-calls>
        <rate-limit-millis>2000</rate-limit-millis>
        <cb-enabled>true</cb-enabled>
        <cb-calls>5</cb-calls>
        <cb-millis>2000</cb-millis>
    </service-profile>

    <!-- Auth Profile (short timeout) -->
    <service-profile service-profile-id="auth.profile">
        <timeout-millis>5000</timeout-millis>
        <rate-limit-enabled>false</rate-limit-enabled>
        <rate-limit-calls>0</rate-limit-calls>
        <rate-limit-millis>0</rate-limit-millis>
        <cb-enabled>false</cb-enabled>
        <cb-calls>0</cb-calls>
        <cb-millis>0</cb-millis>
    </service-profile>

    <!-- SFTP Profile -->
    <service-profile service-profile-id="sftp.profile">
        <timeout-millis>60000</timeout-millis>
        <rate-limit-enabled>true</rate-limit-enabled>
        <rate-limit-calls>5</rate-limit-calls>
        <rate-limit-millis>10000</rate-limit-millis>
        <cb-enabled>true</cb-enabled>
        <cb-calls>3</cb-calls>
        <cb-millis>5000</cb-millis>
    </service-profile>

    <!-- OAuth Token Service -->
    <service service-id="my.oauth.token">
        <service-type>HTTPForm</service-type>
        <enabled>true</enabled>
        <log-prefix>oauth</log-prefix>
        <comm-log-enabled>false</comm-log-enabled>
        <force-prd-enabled>true</force-prd-enabled>
        <mock-mode-enabled>false</mock-mode-enabled>
        <profile-id>auth.profile</profile-id>
        <credential-id>my.oauth.token.cred</credential-id>
    </service>

    <!-- Main API Service -->
    <service service-id="my.api">
        <service-type>HTTP</service-type>
        <enabled>true</enabled>
        <log-prefix>myapi</log-prefix>
        <comm-log-enabled>false</comm-log-enabled>
        <force-prd-enabled>true</force-prd-enabled>
        <mock-mode-enabled>false</mock-mode-enabled>
        <profile-id>standard.api</profile-id>
        <credential-id>my.api.cred</credential-id>
    </service>

    <!-- SFTP Service -->
    <service service-id="my.sftp">
        <service-type>SFTP</service-type>
        <enabled>true</enabled>
        <log-prefix>sftp</log-prefix>
        <comm-log-enabled>true</comm-log-enabled>
        <force-prd-enabled>false</force-prd-enabled>
        <mock-mode-enabled>false</mock-mode-enabled>
        <profile-id>sftp.profile</profile-id>
        <credential-id>my.sftp.cred</credential-id>
    </service>

</services>
```

## Delete Mode

To delete a service configuration during import, use `mode="delete"`:

```xml
<service service-id="old.service" mode="delete">
    <service-type>HTTP</service-type>
</service>

<service-profile service-profile-id="old.profile" mode="delete"/>

<service-credential service-credential-id="old.credential" mode="delete"/>
```

## Import via CLI

```bash
# Import services configuration
b2c job import ./my-import-folder --wait

# The import folder should contain services.xml at the root
```

## Export via Business Manager

1. Go to **Administration > Site Development > Site Import & Export**
2. Select **Export** and choose **Services**
3. Download the exported archive containing `services.xml`

## Best Practices

1. **Use consistent naming**: Match service-id, profile-id, and credential-id
   ```
   my.integration         (service)
   my.integration         (profile)
   my.integration.cred    (credential)
   ```

2. **Separate auth credentials**: Create dedicated credentials for OAuth token endpoints
   ```
   my.api.cred           (API calls)
   my.api.auth.cred      (Token endpoint)
   ```

3. **Environment-specific credentials**: Use different credential IDs per environment
   ```
   my.api.dev.cred       (Development)
   my.api.stg.cred       (Staging)
   my.api.prd.cred       (Production)
   ```

4. **Don't commit passwords**: Remove or mask passwords in version-controlled files
   ```xml
   <password>PLACEHOLDER</password>
   ```

5. **Set appropriate timeouts**: Match profile timeout to expected response times
   - Auth endpoints: 5000ms
   - Standard APIs: 15000-30000ms
   - File transfers: 60000ms+
   - Long-running processes: 90000ms+
