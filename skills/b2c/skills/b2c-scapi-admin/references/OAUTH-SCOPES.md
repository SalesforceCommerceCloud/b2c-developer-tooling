# Admin API OAuth Scopes Reference

Complete reference for OAuth scopes used with Account Manager for Admin APIs.

## Scope Format

Admin API scopes follow this pattern:

```
SALESFORCE_COMMERCE_API:{tenant_id} {api_scope_1} {api_scope_2} ...
```

**Example:**
```
SALESFORCE_COMMERCE_API:zzte_053 sfcc.catalogs sfcc.products.rw sfcc.orders
```

### Scope Suffix Convention

- No suffix = read-only access
- `.rw` suffix = read and write access

```
sfcc.products    # Read only
sfcc.products.rw # Read and write
```

## Getting Tokens with Scopes

### Via CLI

```bash
# Get token with specific scopes
b2c auth token --auth-scope sfcc.orders --scope sfcc.products

# Get token with full scope string
b2c auth token --auth-scope "sfcc.orders sfcc.products.rw"
```

### Via cURL

```bash
curl "https://account.demandware.com/dwsso/oauth2/access_token" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  --data-urlencode "scope=SALESFORCE_COMMERCE_API:$TENANT_ID sfcc.catalogs sfcc.products.rw"
```

## Product API Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.catalogs` | Catalogs | Read catalogs, categories |
| `sfcc.catalogs.rw` | Catalogs | Create/update/delete catalogs |
| `sfcc.products` | Products | Read products |
| `sfcc.products.rw` | Products | Create/update/delete products |

**Use Cases:**
- Catalog sync from PIM system
- Product data export for analytics
- Bulk product updates

## Order API Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.orders` | Orders | Read orders |
| `sfcc.orders.rw` | Orders | Update order status, shipping |

**Use Cases:**
- Order export to OMS/WMS
- Order status updates from fulfillment
- Order analytics and reporting

## Inventory API Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.inventory.availability` | Availability | Read inventory levels |
| `sfcc.inventory.availability.rw` | Availability | Update inventory |
| `sfcc.inventory.reservations` | Reservations | Read reservations |
| `sfcc.inventory.reservations.rw` | Reservations | Create/update reservations |
| `sfcc.inventory.impex-inventory` | IMPEX | Bulk inventory import (read) |
| `sfcc.inventory.impex-inventory.rw` | IMPEX | Bulk inventory import (write) |
| `sfcc.inventory.impex-graphs` | IMPEX | Location graph exports |

**Use Cases:**
- Real-time inventory sync from WMS
- Bulk inventory file imports
- Stock allocation across channels
- Location graph management

## Pricing API Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.promotions` | Promotions | Read promotions |
| `sfcc.promotions.rw` | Promotions | Create/update promotions |
| `sfcc.gift-certificates` | Gift Certificates | Read gift certificates |
| `sfcc.gift-certificates.rw` | Gift Certificates | Manage gift certificates |
| `sfcc.source-codes` | Source Codes | Read source code groups |
| `sfcc.source-codes.rw` | Source Codes | Manage source code groups |

**Use Cases:**
- Promotion data export
- Dynamic promotion creation
- Campaign management integration
- Gift certificate management

## Customer Management Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.shopper-customers` | Customers | Read customer data |
| `sfcc.shopper-customers.rw` | Customers | Create/update customer profiles |
| `sfcc.consents` | Consents | Read customer consent preferences |
| `sfcc.consents.rw` | Consents | Manage consent preferences |
| `sfcc.customergroups` | Customer Groups | Read customer groups |
| `sfcc.customergroups.rw` | Customer Groups | Manage customer groups |
| `sfcc.customerlists` | Customer Lists | Read customer lists |
| `sfcc.customerlists.rw` | Customer Lists | Manage customer lists |

**Use Cases:**
- Customer data sync to CRM
- Customer profile enrichment
- Consent management (GDPR/CCPA)
- Customer segmentation

## Configuration Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.cors-preferences` | CORS | Read CORS configuration |
| `sfcc.cors-preferences.rw` | CORS | Manage CORS settings |
| `sfcc.preferences` | Preferences | Read site preferences |
| `sfcc.timeouts` | Timeouts | Read timeout configuration |
| `sfcc.timeouts.rw` | Timeouts | Manage timeout settings |

**Use Cases:**
- Automated configuration management
- CI/CD pipeline configuration

## Experience Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.experiences.rw` | Experiences | Manage merchandiser experiences |

**Use Cases:**
- Experience/campaign management
- A/B testing automation

## CDN API Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.cdn-zones` | CDN Zones | Read CDN configuration |
| `sfcc.cdn-zones.rw` | CDN Zones | Configure CDN zones |

**Use Cases:**
- CDN configuration automation
- Certificate management
- WAF rule management

## Developer API Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.custom-apis` | Custom APIs | Read custom API status |
| `sfcc.custom-apis.rw` | Custom APIs | Manage custom API registration |
| `sfcc.scapi-schemas` | SCAPI Schemas | Read SCAPI schema registry |

**Use Cases:**
- Check custom API deployment status
- Automated deployment pipelines
- Schema discovery and documentation

## SLAS Admin Scopes

| Scope | API Family | Access Level |
|-------|------------|--------------|
| `sfcc.slas-admin` | SLAS Admin | Read SLAS configuration |
| `sfcc.slas-admin.rw` | SLAS Admin | Manage SLAS clients |

**Use Cases:**
- Automated SLAS client provisioning
- Client configuration management

## Recommended Scope Sets

### Order Management Integration

```
SALESFORCE_COMMERCE_API:{tenant_id} sfcc.orders.rw sfcc.inventory.availability.rw
```

### Catalog/Product Sync

```
SALESFORCE_COMMERCE_API:{tenant_id} sfcc.catalogs.rw sfcc.products.rw
```

### Inventory Sync

```
SALESFORCE_COMMERCE_API:{tenant_id} sfcc.inventory.availability.rw sfcc.inventory.impex-inventory
```

### Customer Data Sync

```
SALESFORCE_COMMERCE_API:{tenant_id} sfcc.shopper-customers.rw sfcc.orders
```

### Read-Only Analytics/Reporting

```
SALESFORCE_COMMERCE_API:{tenant_id} sfcc.orders sfcc.products sfcc.shopper-customers
```

### Full Admin Access

```
SALESFORCE_COMMERCE_API:{tenant_id} sfcc.catalogs.rw sfcc.products.rw sfcc.orders.rw sfcc.inventory.availability.rw sfcc.promotions.rw sfcc.shopper-customers.rw
```

## Best Practices

### Principle of Least Privilege

Request only the scopes your integration needs:

```bash
# Bad - too broad
b2c auth token --auth-scope "sfcc.catalogs.rw sfcc.products.rw sfcc.orders.rw sfcc.inventory.availability.rw"

# Good - only what's needed for order export
b2c auth token --auth-scope sfcc.orders
```

### Separate Clients for Different Integrations

Create dedicated API clients for different systems:

| Integration | Client | Scopes |
|-------------|--------|--------|
| PIM Sync | `pim-integration` | `sfcc.products.rw sfcc.catalogs.rw` |
| OMS Sync | `oms-integration` | `sfcc.orders.rw` |
| WMS Sync | `wms-integration` | `sfcc.inventory.availability.rw` |

### Token Caching

Admin tokens are valid for ~30 minutes. Cache and reuse:

```javascript
let tokenCache = null;
let tokenExpiry = 0;

async function getAdminToken() {
    const now = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (tokenCache && tokenExpiry > now + 60000) {
        return tokenCache;
    }

    const response = await fetch('https://account.demandware.com/dwsso/oauth2/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`
        },
        body: `grant_type=client_credentials&scope=SALESFORCE_COMMERCE_API:${tenantId} ${scopes}`
    });

    const data = await response.json();
    tokenCache = data.access_token;
    tokenExpiry = now + (data.expires_in * 1000);

    return tokenCache;
}
```

### Audit Scope Usage

Periodically review what scopes are actually being used:

```javascript
// Decode token to see granted scopes
const tokenParts = adminToken.split('.');
const payload = JSON.parse(atob(tokenParts[1]));
console.log('Granted scopes:', payload.scope);
```

## Scope Errors

### 403 Forbidden - Missing Scope

```json
{
    "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/forbidden",
    "title": "Forbidden",
    "detail": "Access denied. Missing required scope: sfcc.orders.rw"
}
```

**Solution:** Add the missing scope to your token request.

### 403 Forbidden - Missing Tenant Scope

```json
{
    "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/forbidden",
    "title": "Forbidden",
    "detail": "Access denied for organization f_ecom_zzte_053"
}
```

**Solution:** Include `SALESFORCE_COMMERCE_API:{tenant_id}` in your scope request.

### Invalid Scope Error

```json
{
    "error": "invalid_scope",
    "error_description": "One or more scopes are invalid: sfcc.invalid-scope"
}
```

**Solution:** Check scope name spelling and remove invalid scopes.
