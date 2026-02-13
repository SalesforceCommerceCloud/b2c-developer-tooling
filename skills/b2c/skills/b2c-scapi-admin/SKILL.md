---
name: b2c-scapi-admin
description: Consume SCAPI Admin APIs for backend integrations and data management. Use when building inventory sync, order management, catalog updates, or customer data integrations. Covers Account Manager OAuth, admin scopes, and common integration patterns.
---

# SCAPI Admin APIs

This skill guides you through consuming Admin APIs for backend integrations, data synchronization, and management operations. Admin APIs are designed for server-to-server integration, not storefront use.

> **Note:** For **shopper-facing** APIs (products, baskets, checkout), see [b2c-scapi-shopper](../b2c-scapi-shopper/SKILL.md). This skill focuses on **admin/backend** operations.

## Overview

Admin APIs are designed for backend systems and integrations:

- **Client**: Backend services, ETL pipelines, management tools
- **Authentication**: Account Manager OAuth (client credentials)
- **Response Time**: < 60 seconds (HTTP 504 if exceeded)
- **Usage**: Moderate frequency, batch operations preferred

### Base URL Structure

```
https://{shortCode}.api.commercecloud.salesforce.com/{apiFamily}/{apiName}/v1/organizations/{organizationId}/{resource}
```

Example:
```
https://kv7kzm78.api.commercecloud.salesforce.com/product/products/v1/organizations/f_ecom_zzte_053/products/25518823M
```

**Note:** Admin APIs typically don't require `siteId` parameter (unlike Shopper APIs).

## Authentication

Admin APIs use Account Manager OAuth with client credentials flow.

### Get Admin Token via CLI

```bash
# Get admin token (uses clientId/clientSecret from dw.json)
b2c auth token

# Get token with specific scopes
b2c auth token --auth-scope sfcc.orders --auth-scope sfcc.products

# Get token as JSON (includes expiration)
b2c auth token --json
```

See [b2c-config skill](../../b2c-cli/skills/b2c-config/SKILL.md) for configuration details.

### Get Token Programmatically

```bash
curl "https://account.demandware.com/dwsso/oauth2/access_token" \
  --request 'POST' \
  --user "${CLIENT_ID}:${CLIENT_SECRET}" \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data "grant_type=client_credentials" \
  --data-urlencode "scope=SALESFORCE_COMMERCE_API:${TENANT_ID} ${SCOPES}"
```

**Example:**

```bash
CLIENT_ID="your-client-id"
CLIENT_SECRET="your-client-secret"
TENANT_ID="zzte_053"
SCOPES="sfcc.orders sfcc.products"

TOKEN=$(curl -s "https://account.demandware.com/dwsso/oauth2/access_token" \
  -u "$CLIENT_ID:$CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  --data-urlencode "scope=SALESFORCE_COMMERCE_API:$TENANT_ID $SCOPES" \
  | jq -r '.access_token')
```

### Dual Scope Requirement

Admin APIs require **two types of scopes**:

1. **Tenant scope**: `SALESFORCE_COMMERCE_API:{tenant_id}` - grants access to the tenant
2. **API-specific scopes**: `sfcc.catalogs`, `sfcc.orders.rw`, etc. - grants API access

```
scope=SALESFORCE_COMMERCE_API:zzte_053 sfcc.catalogs sfcc.products.rw
```

See [OAuth Scopes Reference](references/OAUTH-SCOPES.md) for the complete scope list.

### Account Manager Setup

1. Log into Account Manager
2. Navigate to **API Client** > **Add API Client**
3. Configure:
   - Display Name and Password (client secret)
   - Assign Organizations (your B2C instances)
   - Role: "Salesforce Commerce API"
   - Token Endpoint Auth Method: `client_secret_post`
   - Access Token Format: `JWT`
   - Allowed Scopes: Add required scopes
4. Copy the Client ID

## API Families

### Products API

Manage product catalog data.

```javascript
// Get product
const product = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/products/v1/organizations/${orgId}/products/${productId}`,
    {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    }
).then(r => r.json());

// Update product
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/products/v1/organizations/${orgId}/products/${productId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: { default: 'Updated Product Name' },
            shortDescription: { default: 'New description' }
        })
    }
);
```

**Required Scopes:**
- Read: `sfcc.products`
- Write: `sfcc.products.rw`

### Catalogs API

Manage catalog structure and assignments.

```javascript
// List catalogs
const catalogs = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/catalogs/v1/organizations/${orgId}/catalogs`,
    {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    }
).then(r => r.json());

// Get catalog details
const catalog = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/catalogs/v1/organizations/${orgId}/catalogs/${catalogId}`,
    {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    }
).then(r => r.json());
```

**Required Scopes:**
- Read: `sfcc.catalogs`
- Write: `sfcc.catalogs.rw`

### Orders API

Retrieve and manage orders.

```javascript
// Get order by number
const order = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/orders/v1/organizations/${orgId}/orders/${orderNo}?siteId=${siteId}`,
    {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    }
).then(r => r.json());

// Update order status
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/orders/v1/organizations/${orgId}/orders/${orderNo}?siteId=${siteId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'completed',
            shippingStatus: 'shipped'
        })
    }
);
```

**Required Scopes:**
- Read: `sfcc.orders`
- Write: `sfcc.orders.rw`

### Inventory Availability API

Manage product inventory.

```javascript
// Get inventory for a product
const availability = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/inventory/availability/v1/organizations/${orgId}/availability-records/search`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            skus: ['SKU001', 'SKU002'],
            locationIds: ['warehouse-1']
        })
    }
).then(r => r.json());

// Update inventory
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/inventory/availability/v1/organizations/${orgId}/availability-records`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            records: [{
                sku: 'SKU001',
                locationId: 'warehouse-1',
                onHand: 100,
                effectiveDate: new Date().toISOString()
            }]
        })
    }
);
```

**Required Scopes:**
- Read: `sfcc.inventory.availability`
- Write: `sfcc.inventory.availability.rw`

### Inventory IMPEX API

High-performance bulk inventory import. Use for 1000+ SKU updates.

**Critical Requirements:**
- Files > 100MB **MUST** be gzip compressed
- Use newline-delimited JSON (NDJSON), not comma-separated arrays
- Don't run imports during location graph changes
- Use delta imports (changed data only) for best performance
- Future quantity values must be > 0

```javascript
// Step 1: Initiate import
const importJob = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/inventory/impex/v1/organizations/${orgId}/availability-records/imports`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }
).then(r => r.json());

// Step 2: Prepare newline-delimited JSON
const ndjsonData = inventoryRecords
    .map(r => JSON.stringify({
        recordId: r.recordId || crypto.randomUUID(),
        sku: r.sku,
        locationId: r.locationId,
        onHand: r.quantity,
        effectiveDate: new Date().toISOString()
    }))
    .join('\n');

// Step 3: Upload data to the uploadLink
await fetch(importJob.uploadLink, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: ndjsonData
});

// Step 4: Monitor status
const status = await fetch(importJob.importStatusLink, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
}).then(r => r.json());
```

**Required Scope:** `sfcc.inventory.impex-inventory`

**Note:** Inventory IMPEX logs don't appear in Log Center. Use correlation IDs and monitor import status directly.

See [Integration Patterns Reference](references/INTEGRATION-PATTERNS.md) for bulk import best practices.

### Customers API

Manage customer data.

```javascript
// Search customers
const customers = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/customer/customers/v1/organizations/${orgId}/customer-search?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: {
                textQuery: { fields: ['email'], searchPhrase: 'john@example.com' }
            }
        })
    }
).then(r => r.json());
```

**Required Scopes:**
- Read: `sfcc.shopper-customers`
- Write: `sfcc.shopper-customers.rw`

### Promotions API

Manage promotions and campaigns.

```javascript
// Get promotion
const promotion = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/pricing/promotions/v1/organizations/${orgId}/promotions/${promotionId}?siteId=${siteId}`,
    {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    }
).then(r => r.json());

// Update promotion
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/pricing/promotions/v1/organizations/${orgId}/promotions/${promotionId}?siteId=${siteId}`,
    {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            enabled: true,
            startDate: '2024-06-01T00:00:00Z',
            endDate: '2024-06-30T23:59:59Z'
        })
    }
);
```

**Required Scopes:**
- Read: `sfcc.promotions`
- Write: `sfcc.promotions.rw`

## Request Tracking

### Correlation IDs

Include correlation IDs for tracking requests across systems:

```javascript
const correlationId = crypto.randomUUID();

const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${adminToken}`,
        'correlation-id': correlationId
    }
});

console.log(`Request ${correlationId} completed`);
// Search Log Center: externalID:({correlationId})
```

### Verbose Logging

Enable verbose logging for debugging:

```javascript
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${adminToken}`,
        'sfdc_verbose': 'true'
    }
});
```

Check Log Center under `scapi.verbose` category.

**Note:** Some Admin APIs (CDN Zones, Inventory, Shopper Context) don't log to Log Center.

## Error Handling

### Common Errors

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad Request | Check request body/parameters |
| 401 | Unauthorized | Token expired - get new token |
| 403 | Forbidden | Missing scope or tenant access |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |
| 504 | Timeout | Request took > 60 seconds |

### Rate Limiting

Admin APIs have lower rate limits than Shopper APIs. For bulk operations:

- Use batch endpoints when available
- Implement exponential backoff for 429 responses
- Consider inventory IMPEX for large data imports
- Spread operations over time for non-urgent updates

## Related Skills

- [b2c-config](../../b2c-cli/skills/b2c-config/SKILL.md) - Get admin tokens via CLI
- [b2c-scapi-shopper](../b2c-scapi-shopper/SKILL.md) - Shopper-facing APIs
- [b2c-scapi-schemas](../../b2c-cli/skills/b2c-scapi-schemas/SKILL.md) - Browse OpenAPI schemas

## Reference Documentation

- [OAuth Scopes Reference](references/OAUTH-SCOPES.md) - Complete admin scope reference
- [Integration Patterns](references/INTEGRATION-PATTERNS.md) - ETL, sync, and bulk import patterns
