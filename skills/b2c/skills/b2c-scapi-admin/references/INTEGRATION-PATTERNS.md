# Integration Patterns Reference

Common patterns for integrating with Admin APIs, including ETL workflows, data synchronization, and bulk operations.

## Inventory Sync Pattern

### Real-Time Inventory Updates

For small, frequent updates (< 100 SKUs):

```javascript
async function updateInventory(records) {
    const adminToken = await getAdminToken();

    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/inventory/availability/v1/organizations/${orgId}/availability-records`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
                'correlation-id': crypto.randomUUID()
            },
            body: JSON.stringify({
                records: records.map(r => ({
                    recordId: r.recordId || crypto.randomUUID(),
                    sku: r.sku,
                    locationId: r.locationId,
                    onHand: r.quantity,
                    effectiveDate: new Date().toISOString()
                }))
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Inventory update failed: ${response.status}`);
    }

    return response.json();
}
```

### Bulk Inventory Import (IMPEX)

For large updates (1000+ SKUs), use the high-performance import process:

```javascript
async function bulkInventoryImport(inventoryData) {
    const adminToken = await getAdminToken();

    // Step 1: Initiate import job
    const initResponse = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/inventory/impex/v1/organizations/${orgId}/availability-records/imports`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        }
    ).then(r => r.json());

    // Step 2: Prepare newline-delimited JSON
    const ndjsonData = inventoryData
        .map(item => JSON.stringify({
            recordId: item.recordId || crypto.randomUUID(),
            sku: item.sku,
            locationId: item.locationId,
            onHand: item.quantity,
            effectiveDate: new Date().toISOString(),
            safetyStockCount: item.safetyStock || 0
        }))
        .join('\n');

    // Step 3: Upload data
    await fetch(initResponse.uploadLink, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ndjsonData
    });

    // Step 4: Poll for completion
    return pollImportStatus(initResponse.importStatusLink, adminToken);
}

async function pollImportStatus(statusUrl, token, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const status = await fetch(statusUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        if (status.status === 'COMPLETED') {
            return status;
        }

        if (status.status === 'FAILED') {
            throw new Error(`Import failed: ${status.errorMessage}`);
        }

        // Wait 2 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Import timed out');
}
```

### Best Practices for Inventory IMPEX

- Files > 100MB must be gzip compressed
- Use delta imports (changed data only), not full exports
- Theoretical limit: ~50 requests/second per SKU/location
- Reuse `recordId` for updates (idempotent)
- Include `externalRefId` for linking to external systems

## Order Export Pattern

### Polling for New Orders

```javascript
async function pollOrders(lastExportTime) {
    const adminToken = await getAdminToken();

    // Search for orders modified since last export
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/checkout/orders/v1/organizations/${orgId}/order-search?siteId=${siteId}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: {
                    filteredQuery: {
                        query: { matchAllQuery: {} },
                        filter: {
                            range: {
                                field: 'lastModified',
                                from: lastExportTime.toISOString()
                            }
                        }
                    }
                },
                sorts: [{ field: 'lastModified', sortOrder: 'asc' }],
                select: '(orderNo,status,lastModified,productItems,shipments,totals)'
            })
        }
    ).then(r => r.json());

    return response.hits;
}

// Export loop
async function orderExportLoop() {
    let lastExportTime = await getLastExportTime(); // From your persistence

    setInterval(async () => {
        try {
            const orders = await pollOrders(lastExportTime);

            for (const order of orders) {
                await exportOrderToOMS(order);
                lastExportTime = new Date(order.lastModified);
            }

            await saveLastExportTime(lastExportTime);
        } catch (error) {
            console.error('Order export failed:', error);
        }
    }, 60000); // Poll every minute
}
```

### Order Status Updates

Update orders from fulfillment system:

```javascript
async function updateOrderStatus(orderNo, status, trackingInfo) {
    const adminToken = await getAdminToken();

    await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/checkout/orders/v1/organizations/${orgId}/orders/${orderNo}?siteId=${siteId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                shippingStatus: trackingInfo ? 'shipped' : 'notShipped',
                c_trackingNumber: trackingInfo?.trackingNumber,
                c_carrier: trackingInfo?.carrier
            })
        }
    );
}
```

## Product Sync Pattern

### Delta Product Updates

```javascript
async function syncProducts(products) {
    const adminToken = await getAdminToken();
    const results = { success: 0, failed: 0, errors: [] };

    // Process in batches to avoid timeouts
    const batches = chunk(products, 50);

    for (const batch of batches) {
        await Promise.all(batch.map(async (product) => {
            try {
                await fetch(
                    `https://${shortCode}.api.commercecloud.salesforce.com/product/products/v1/organizations/${orgId}/products/${product.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${adminToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: { default: product.name },
                            shortDescription: { default: product.description },
                            c_brand: product.brand,
                            c_customAttr: product.customValue
                        })
                    }
                );
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ productId: product.id, error: error.message });
            }
        }));

        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

function chunk(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
        array.slice(i * size, i * size + size)
    );
}
```

## Customer Data Sync Pattern

### Export Customers to CRM

```javascript
async function exportCustomersToCRM(lastSyncTime) {
    const adminToken = await getAdminToken();

    let offset = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(
            `https://${shortCode}.api.commercecloud.salesforce.com/customer/customers/v1/organizations/${orgId}/customer-search?siteId=${siteId}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        filteredQuery: {
                            query: { matchAllQuery: {} },
                            filter: {
                                range: {
                                    field: 'lastModified',
                                    from: lastSyncTime.toISOString()
                                }
                            }
                        }
                    },
                    offset: offset,
                    limit: pageSize
                })
            }
        ).then(r => r.json());

        for (const customer of response.hits) {
            await sendToCRM(customer);
        }

        offset += pageSize;
        hasMore = response.hits.length === pageSize;
    }
}
```

## Error Handling Pattern

### Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.ok) {
                return response;
            }

            // Retry on rate limit or server errors
            if (response.status === 429 || response.status >= 500) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Don't retry client errors
            throw new Error(`Request failed: ${response.status}`);
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

### Dead Letter Queue Pattern

For failed records that need manual review:

```javascript
async function processWithDLQ(records, processor) {
    const results = { processed: 0, failed: [] };

    for (const record of records) {
        try {
            await processor(record);
            results.processed++;
        } catch (error) {
            results.failed.push({
                record: record,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Send failed records to DLQ
    if (results.failed.length > 0) {
        await sendToDLQ(results.failed);
        console.log(`${results.failed.length} records sent to DLQ`);
    }

    return results;
}
```

## Token Management Pattern

### Automatic Token Refresh

```javascript
class AdminAPIClient {
    constructor(clientId, clientSecret, tenantId, scopes) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
        this.scopes = scopes;
        this.token = null;
        this.tokenExpiry = 0;
    }

    async getToken() {
        const now = Date.now();

        // Refresh token 60 seconds before expiry
        if (this.token && this.tokenExpiry > now + 60000) {
            return this.token;
        }

        const response = await fetch('https://account.demandware.com/dwsso/oauth2/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(this.clientId + ':' + this.clientSecret)}`
            },
            body: `grant_type=client_credentials&scope=SALESFORCE_COMMERCE_API:${this.tenantId} ${this.scopes}`
        });

        const data = await response.json();
        this.token = data.access_token;
        this.tokenExpiry = now + (data.expires_in * 1000);

        return this.token;
    }

    async fetch(url, options = {}) {
        const token = await this.getToken();

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    }
}

// Usage
const client = new AdminAPIClient(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'zzte_053',
    'sfcc.orders sfcc.products.rw'
);

const orders = await client.fetch(`${baseUrl}/orders/search`, {
    method: 'POST',
    body: JSON.stringify({ query: { matchAllQuery: {} } })
}).then(r => r.json());
```

## Monitoring Pattern

### Request Logging

```javascript
async function loggedFetch(url, options, context = {}) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'correlation-id': correlationId
            }
        });

        const duration = Date.now() - startTime;

        console.log(JSON.stringify({
            type: 'api_call',
            correlationId,
            url: url.split('?')[0], // Remove query params for logging
            method: options.method || 'GET',
            status: response.status,
            duration,
            ...context
        }));

        return response;
    } catch (error) {
        const duration = Date.now() - startTime;

        console.error(JSON.stringify({
            type: 'api_error',
            correlationId,
            url: url.split('?')[0],
            method: options.method || 'GET',
            error: error.message,
            duration,
            ...context
        }));

        throw error;
    }
}
```

## Scheduling Best Practices

### Spread Load Over Time

```javascript
// Bad - all updates at once
await Promise.all(products.map(p => updateProduct(p)));

// Good - staggered updates
for (const product of products) {
    await updateProduct(product);
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between calls
}
```

### Off-Peak Processing

Schedule heavy batch operations during off-peak hours to avoid impacting storefront performance.

### Idempotency

Design integrations to be idempotent - safe to retry without side effects:

```javascript
// Use recordId for inventory updates (idempotent)
{
    "recordId": "550e8400-e29b-41d4-a716-446655440000", // Same ID = update, not duplicate
    "sku": "SKU001",
    "onHand": 100
}

// Use external reference IDs for order tracking
{
    "externalRefId": "WMS-ORDER-12345"
}
```
