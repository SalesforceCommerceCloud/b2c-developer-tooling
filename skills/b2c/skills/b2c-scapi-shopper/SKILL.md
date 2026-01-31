---
name: b2c-scapi-shopper
description: Consume standard Shopper Commerce APIs (SCAPI) for headless storefronts. Use when building PWA/composable commerce, accessing products, search, baskets, orders, or customer data via SCAPI. Covers authentication with SLAS, checkout flows, performance optimization, and Shopper Context API.
---

# Shopper Commerce APIs (SCAPI)

This skill guides you through consuming standard Shopper APIs for building headless commerce experiences. Shopper APIs are RESTful endpoints designed for customer-facing storefronts.

> **Note:** For **creating** custom API endpoints, see [b2c-custom-api-development](../b2c-custom-api-development/SKILL.md). This skill focuses on **consuming** standard Shopper APIs.

## Overview

Shopper APIs are designed for frontend commerce applications:

- **Client**: PWA Kit, composable storefronts, mobile apps
- **Authentication**: SLAS (Shopper Login and API Access Service)
- **Response Time**: < 10 seconds (HTTP 504 if exceeded)
- **CORS**: Not supported - use a reverse proxy or BFF (Backend for Frontend)

### Base URL Structure

```
https://{shortCode}.api.commercecloud.salesforce.com/{apiFamily}/{apiName}/v1/organizations/{organizationId}/{resource}?siteId={siteId}
```

Example:
```
https://kv7kzm78.api.commercecloud.salesforce.com/product/shopper-products/v1/organizations/f_ecom_zzte_053/products/25518823M?siteId=RefArchGlobal
```

**Note:** Shopper Baskets API supports both `v1` and `v2`. Use `v2` for newer features.

### Configuration Values

| Value | Description | Example |
|-------|-------------|---------|
| `shortCode` | 8-character API routing code | `kv7kzm78` |
| `organizationId` | Instance identifier | `f_ecom_zzte_053` |
| `siteId` | Site/channel name | `RefArchGlobal` |

Find these in Business Manager: **Administration > Site Development > Salesforce Commerce API Settings**

## Authentication

Shopper APIs require SLAS tokens. SLAS supports guest and registered shopper flows.

### Create SLAS Client

```bash
# Create client with default scopes for a shopping app
b2c slas client create \
  --tenant-id zzte_053 \
  --channels RefArchGlobal \
  --default-scopes \
  --redirect-uri http://localhost:3000/callback
```

See [b2c-slas skill](../../b2c-cli/skills/b2c-slas/SKILL.md) for full client management.

### Get Guest Token

```javascript
const response = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`,
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            channel_id: siteId
        })
    }
);

const { access_token, refresh_token } = await response.json();
```

### Required Scopes

All Shopper API scopes must be configured on your SLAS client. See [Scopes Reference](references/SCOPES.md) for the complete list.

| API Family | Scope |
|------------|-------|
| Products | `sfcc.shopper-products` |
| Search | `sfcc.shopper-product-search` |
| Baskets | `sfcc.shopper-baskets-orders.rw` |
| Orders | `sfcc.shopper-baskets-orders` |
| Customers | `sfcc.shopper-customers.login`, `sfcc.shopper-myaccount.rw` |

## API Families

### Shopper Products

Retrieve product details, pricing, and availability.

```javascript
// Get product by ID
const product = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/shopper-products/v1/organizations/${orgId}/products/${productId}?siteId=${siteId}`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());

// Get multiple products
const products = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/shopper-products/v1/organizations/${orgId}/products?ids=prod1,prod2,prod3&siteId=${siteId}`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());
```

### Shopper Search

Product search and suggestions.

```javascript
// Search products
const results = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/${orgId}/product-search?siteId=${siteId}&q=shirt&limit=25`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());

// Get search suggestions
const suggestions = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/search/shopper-search/v1/organizations/${orgId}/search-suggestions?siteId=${siteId}&q=shi`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());
```

### Shopper Baskets

Create and manage shopping carts. See [Checkout Flow Reference](references/CHECKOUT-FLOW.md) for the complete flow.

```javascript
// Create basket
const basket = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }
).then(r => r.json());

// Add item to basket
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-baskets/v1/organizations/${orgId}/baskets/${basketId}/items?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            productId: '25518823M',
            quantity: 1
        }])
    }
);
```

### Shopper Orders

Submit orders and retrieve order history.

```javascript
// Create order from basket
const order = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/checkout/shopper-orders/v1/organizations/${orgId}/orders?siteId=${siteId}`,
    {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            basketId: basket.basketId
        })
    }
).then(r => r.json());
```

### Shopper Customers

Customer registration, login, and account management.

```javascript
// Get customer profile (registered shopper)
const customer = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/customer/shopper-customers/v1/organizations/${orgId}/customers/${customerId}?siteId=${siteId}`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());
```

## Shopper Context API

Maintain personalization state across requests using the Shopper Context API. The `siteId` query parameter is **required** for all Shopper Context operations.

```javascript
// Set shopper context
await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/shopper/shopper-context/v1/organizations/${orgId}/shopper-context/${usid}?siteId=${siteId}`,
    {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            effectiveDateTime: new Date().toISOString(),
            sourceCode: 'SUMMER2024',
            customerGroupIds: ['VIP', 'Loyalty']
        })
    }
);
```

### When to Set Context

- **Initial visit/login**: Immediately after obtaining SLAS token
- **Token refresh**: Reuse existing USID for session continuity
- **Login transitions**: When shopper changes from guest to registered (or vice versa)
- **Logout**: Clear context explicitly

### Quota Limits

| Environment | Limit |
|-------------|-------|
| Non-production | 5,000 records |
| Production | 1,000,000 records |

**Strategies to manage quota:**
- Use lower TTL (1-2 days for registered shoppers)
- Reuse USIDs for the same shopper
- Explicitly log out shoppers to delete context

### Best Practices

- Set context immediately after obtaining SLAS token
- Use the USID from the SLAS token response
- Context TTL: 1 day (guest), 7 days (registered)
- **Security**: Use private SLAS clients only, call from BFF (not browser)
- Don't use Shopper Context for data that's automatically set (like geolocation)

## Performance Optimization

### Use `select` Parameter

Return only needed fields to reduce response size:

```javascript
// Only return specific product fields
const product = await fetch(
    `https://${shortCode}.api.commercecloud.salesforce.com/product/shopper-products/v1/organizations/${orgId}/products/${productId}?siteId=${siteId}&select=(id,name,price,images)`,
    {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }
).then(r => r.json());
```

### Use `expand` Carefully

Expansions increase response time and reduce cache effectiveness:

```javascript
// Expand availability (60-second cache TTL)
const product = await fetch(
    `...?expand=availability,images,prices`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
).then(r => r.json());
```

Consider separate requests instead of low-cache expansions.

### Enable Compression

Always enable HTTP compression in your client for faster responses.

See [Common Patterns Reference](references/COMMON-PATTERNS.md) for more optimization patterns.

## Debugging

### Correlation IDs

Include correlation IDs for request tracking:

```javascript
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'correlation-id': crypto.randomUUID()
    }
});

// Check response header for SCAPI-generated ID
const scapiCorrelationId = response.headers.get('sfdc_correlation_id');
```

Search Log Center with: `externalID:({correlation-id})`

### Verbose Logging

Enable verbose logging for debugging:

```javascript
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'sfdc_verbose': 'true'
    }
});
```

Find logs in Log Center under `scapi.verbose` category.

## Related Skills

- [b2c-slas](../../b2c-cli/skills/b2c-slas/SKILL.md) - Create and manage SLAS clients
- [b2c-slas-auth-patterns](../b2c-slas-auth-patterns/SKILL.md) - Advanced auth: OTP, passkeys, session bridge
- [b2c-scapi-schemas](../../b2c-cli/skills/b2c-scapi-schemas/SKILL.md) - Browse OpenAPI schemas
- [b2c-custom-api-development](../b2c-custom-api-development/SKILL.md) - Create custom endpoints

## Reference Documentation

- [Checkout Flow](references/CHECKOUT-FLOW.md) - Complete basket to order workflow
- [Common Patterns](references/COMMON-PATTERNS.md) - Error handling, pagination, field selection
- [Scopes Reference](references/SCOPES.md) - Complete shopper scope reference by API family
