# Common Patterns Reference

Error handling, pagination, field selection, and other common patterns for Shopper APIs.

## Response Optimization

### Field Selection with `select`

Use the `select` parameter to return only needed fields:

```javascript
// Basic selection
GET /products/{id}?select=(id,name,price)

// Nested selection
GET /products/{id}?select=(id,name,images.(link,alt),price)

// Array selection
GET /product-search?q=shirt&select=(hits.(productId,productName,price))
```

**Example:**

```javascript
// Without select - returns full product object (~5KB)
const fullProduct = await fetch(
    `${baseUrl}/products/25518823M?siteId=${siteId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// With select - returns only needed fields (~500 bytes)
const miniProduct = await fetch(
    `${baseUrl}/products/25518823M?siteId=${siteId}&select=(id,name,price,primaryCategoryId)`,
    { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());
```

### Using `expand` Parameter

Expand related data inline. Use carefully as it impacts caching.

```javascript
// Single expansion
GET /products/{id}?expand=images

// Multiple expansions
GET /products/{id}?expand=availability,images,prices,variations

// Expansion with selection
GET /products/{id}?expand=images&select=(id,name,images)
```

**Cache Impact by Expansion:**

| Expansion | Cache TTL | Recommendation |
|-----------|-----------|----------------|
| `images` | Long | Safe to expand |
| `prices` | Medium | Usually safe |
| `availability` | 60 seconds | Consider separate request |
| `variations` | Long | Can be large response |
| `promotions` | Short | Separate request recommended |

### Compression

Always enable HTTP compression:

```javascript
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Encoding': 'gzip, deflate'
    }
});
```

## Pagination

### Offset-Based Pagination

Most search and list endpoints use offset pagination:

```javascript
// First page
GET /product-search?q=shirt&offset=0&limit=25

// Second page
GET /product-search?q=shirt&offset=25&limit=25

// Third page
GET /product-search?q=shirt&offset=50&limit=25
```

**Example implementation:**

```javascript
async function searchProducts(query, page = 0, pageSize = 25) {
    const response = await fetch(
        `${baseUrl}/product-search?siteId=${siteId}&q=${encodeURIComponent(query)}&offset=${page * pageSize}&limit=${pageSize}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    ).then(r => r.json());

    return {
        products: response.hits,
        total: response.total,
        hasMore: (page * pageSize) + response.hits.length < response.total,
        currentPage: page,
        totalPages: Math.ceil(response.total / pageSize)
    };
}
```

### Response Metadata

Search responses include pagination info:

```json
{
    "limit": 25,
    "offset": 0,
    "total": 156,
    "hits": [...]
}
```

## Error Handling

### Error Response Format

SCAPI returns errors in RFC 9457 format:

```json
{
    "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/invalid-request",
    "title": "Invalid Request",
    "detail": "The product ID '12345' was not found.",
    "instance": "/product/shopper-products/v1/organizations/f_ecom_zzbc_001/products/12345"
}
```

### Common HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Refresh token |
| 403 | Forbidden | Check scopes |
| 404 | Not Found | Resource doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |
| 504 | Timeout | Request took > 10 seconds |

### Error Handling Pattern

```javascript
async function callShopperAPI(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json();

        switch (response.status) {
            case 401:
                // Token expired - refresh and retry
                await refreshToken();
                return callShopperAPI(url, options);

            case 429:
                // Rate limited - exponential backoff
                const retryAfter = response.headers.get('Retry-After') || 1;
                await sleep(retryAfter * 1000);
                return callShopperAPI(url, options);

            case 404:
                // Resource not found
                return null;

            default:
                throw new ShopperAPIError(error.title, error.detail, response.status);
        }
    }

    return response.json();
}

class ShopperAPIError extends Error {
    constructor(title, detail, status) {
        super(`${title}: ${detail}`);
        this.name = 'ShopperAPIError';
        this.status = status;
        this.title = title;
        this.detail = detail;
    }
}
```

### Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.status === 429 || response.status >= 500) {
                const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                await sleep(delay);
                continue;
            }

            return response;
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 1000;
            await sleep(delay);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

## URL Encoding

### Special Characters

Double-encode special characters in path parameters:

```javascript
// Product ID with special characters
const productId = 'PROD/123+456';
const encodedId = encodeURIComponent(encodeURIComponent(productId));
// Result: PROD%252F123%252B456

const url = `${baseUrl}/products/${encodedId}?siteId=${siteId}`;
```

### Query Parameters

Single-encode query parameter values:

```javascript
const searchQuery = 'men\'s shirts & accessories';
const url = `${baseUrl}/product-search?q=${encodeURIComponent(searchQuery)}&siteId=${siteId}`;
```

## Caching Strategies

### Client-Side Caching

Implement client-side caching for frequently accessed data:

```javascript
const cache = new Map();
const CACHE_TTL = {
    products: 5 * 60 * 1000,      // 5 minutes
    categories: 15 * 60 * 1000,   // 15 minutes
    search: 2 * 60 * 1000         // 2 minutes
};

async function getProduct(productId) {
    const cacheKey = `product:${productId}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL.products) {
        return cached.data;
    }

    const product = await fetch(
        `${baseUrl}/products/${productId}?siteId=${siteId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    ).then(r => r.json());

    cache.set(cacheKey, { data: product, timestamp: Date.now() });
    return product;
}
```

### CDN Cache Headers

Shopper APIs return cache headers. Respect them for upstream caching:

```javascript
const response = await fetch(url, options);
const cacheControl = response.headers.get('Cache-Control');
const etag = response.headers.get('ETag');

// Use ETag for conditional requests
const conditionalResponse = await fetch(url, {
    ...options,
    headers: {
        ...options.headers,
        'If-None-Match': etag
    }
});

if (conditionalResponse.status === 304) {
    // Use cached version
}
```

## Request Batching

### Multiple Products

Fetch multiple products in one request:

```javascript
// Instead of multiple calls
const product1 = await getProduct('prod1');
const product2 = await getProduct('prod2');
const product3 = await getProduct('prod3');

// Use batch endpoint
const products = await fetch(
    `${baseUrl}/products?ids=prod1,prod2,prod3&siteId=${siteId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());
```

### Parallel Requests

Use Promise.all for independent requests:

```javascript
const [products, categories, promotions] = await Promise.all([
    fetch(`${baseUrl}/product-search?q=shirt&siteId=${siteId}`, options).then(r => r.json()),
    fetch(`${baseUrl}/categories/root?siteId=${siteId}`, options).then(r => r.json()),
    fetch(`${baseUrl}/promotions?siteId=${siteId}`, options).then(r => r.json())
]);
```

## Debugging Requests

### Include Correlation ID

```javascript
const correlationId = crypto.randomUUID();

const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'correlation-id': correlationId
    }
});

console.log(`Request ${correlationId} - Status: ${response.status}`);
// Search Log Center: externalID:({correlationId})
```

### Verbose Logging

Enable for debugging only (not production):

```javascript
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'sfdc_verbose': 'true'
    }
});

// Check scapi.verbose category in Log Center
```

### Log Request/Response

```javascript
async function debugFetch(url, options) {
    const startTime = Date.now();
    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    console.log(`[API] ${response.status} ${response.statusText} (${duration}ms)`);
    console.log(`[API] correlation-id: ${response.headers.get('sfdc_correlation_id')}`);

    return response;
}
```
