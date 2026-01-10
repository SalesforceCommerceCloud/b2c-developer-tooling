# Chunk-Oriented Job Steps Reference

Complete patterns for chunk-oriented job steps.

## When to Use

- Product exports/imports
- Order processing
- Customer data sync
- Inventory updates
- Any bulk data operation with countable items

**Important:** Chunk-oriented steps **cannot** define custom exit status. They always finish with either **OK** or **ERROR**.

## Basic Structure

```javascript
'use strict';

var iterator;

exports.beforeStep = function (parameters, stepExecution) {
    // Initialize: open files, start queries
};

exports.getTotalCount = function (parameters, stepExecution) {
    return iterator.count;
};

exports.read = function (parameters, stepExecution) {
    if (iterator.hasNext()) {
        return iterator.next();
    }
};

exports.process = function (item, parameters, stepExecution) {
    // Transform item
    return transformedItem;
};

exports.write = function (items, parameters, stepExecution) {
    // Write chunk
};

exports.afterStep = function (success, parameters, stepExecution) {
    // Cleanup
};
```

## Product Export Example

```javascript
'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'ProductExport');
var products;
var writer;

exports.beforeStep = function (parameters, stepExecution) {
    var outputPath = parameters.OutputFile || '/export/products.csv';
    var outputFile = new File(File.IMPEX + outputPath);

    // Ensure parent directory exists
    outputFile.parentFile.mkdirs();

    writer = new FileWriter(outputFile, 'UTF-8');
    writer.writeLine('ID,Name,Brand,Price,Online');

    // Query all products
    products = ProductMgr.queryAllSiteProducts();

    log.info('Starting product export');
};

exports.getTotalCount = function (parameters, stepExecution) {
    return products.count;
};

exports.read = function (parameters, stepExecution) {
    if (products.hasNext()) {
        return products.next();
    }
};

exports.process = function (product, parameters, stepExecution) {
    // Skip masters (export variants only) or filter as needed
    if (product.master) {
        return;  // Filter out
    }

    // Extract and transform data
    return {
        id: product.ID,
        name: escapeCsv(product.name || ''),
        brand: product.brand ? escapeCsv(product.brand) : '',
        price: product.priceModel.price ? product.priceModel.price.value : 0,
        online: product.online ? 'Y' : 'N'
    };
};

exports.write = function (items, parameters, stepExecution) {
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        writer.writeLine([
            item.id,
            item.name,
            item.brand,
            item.price,
            item.online
        ].join(','));
    }
};

exports.afterStep = function (success, parameters, stepExecution) {
    if (products) {
        products.close();
    }
    if (writer) {
        writer.close();
    }

    if (success) {
        log.info('Product export completed successfully');
    } else {
        log.error('Product export failed');
    }
};

function escapeCsv(str) {
    if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}
```

## Order Processing Example

```javascript
'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'OrderProcess');
var orders;

exports.beforeStep = function (parameters, stepExecution) {
    var status = parameters.OrderStatus || 'NEW';

    // Query orders by status
    orders = OrderMgr.searchOrders(
        'status = {0}',
        'creationDate asc',
        require('dw/order/Order')[status]
    );

    log.info('Found ' + orders.count + ' orders to process');
};

exports.getTotalCount = function (parameters, stepExecution) {
    return orders.count;
};

exports.read = function (parameters, stepExecution) {
    if (orders.hasNext()) {
        return orders.next();
    }
};

exports.process = function (order, parameters, stepExecution) {
    // Validate order can be processed
    if (order.paymentStatus.value !== require('dw/order/Order').PAYMENT_STATUS_PAID) {
        log.warn('Skipping order ' + order.orderNo + ' - not paid');
        return;  // Filter out
    }

    return order;
};

exports.write = function (orders, parameters, stepExecution) {
    for (var i = 0; i < orders.size(); i++) {
        var order = orders.get(i);

        Transaction.wrap(function () {
            // Update order status
            order.setExportStatus(require('dw/order/Order').EXPORT_STATUS_EXPORTED);
            log.info('Processed order: ' + order.orderNo);
        });
    }
};

exports.afterStep = function (success, parameters, stepExecution) {
    if (orders) {
        orders.close();
    }
};
```

## Customer Sync Example

```javascript
'use strict';

var CustomerMgr = require('dw/customer/CustomerMgr');
var HTTPClient = require('dw/net/HTTPClient');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');

var log = Logger.getLogger('job', 'CustomerSync');
var customers;
var apiUrl;
var apiKey;

exports.beforeStep = function (parameters, stepExecution) {
    apiUrl = parameters.APIEndpoint;
    apiKey = parameters.APIKey;

    // Query customers modified since last sync
    var lastSync = parameters.LastSyncDate;
    if (lastSync) {
        customers = CustomerMgr.searchProfiles(
            'lastModified >= {0}',
            'lastModified asc',
            new Date(lastSync)
        );
    } else {
        customers = CustomerMgr.searchProfiles('', 'lastModified asc');
    }
};

exports.getTotalCount = function (parameters, stepExecution) {
    return customers.count;
};

exports.read = function (parameters, stepExecution) {
    if (customers.hasNext()) {
        return customers.next();
    }
};

exports.process = function (profile, parameters, stepExecution) {
    return {
        customerId: profile.customerNo,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        lastModified: profile.lastModified.toISOString()
    };
};

exports.write = function (items, parameters, stepExecution) {
    var http = new HTTPClient();
    http.setTimeout(30000);
    http.setRequestHeader('Authorization', 'Bearer ' + apiKey);
    http.setRequestHeader('Content-Type', 'application/json');

    // Convert Java List to array
    var payload = [];
    for (var i = 0; i < items.size(); i++) {
        payload.push(items.get(i));
    }

    try {
        http.open('POST', apiUrl + '/customers/batch');
        http.send(JSON.stringify({ customers: payload }));

        if (http.statusCode >= 200 && http.statusCode < 300) {
            log.info('Synced ' + payload.length + ' customers');
        } else {
            log.error('API error: ' + http.statusCode);
            throw new Error('API returned ' + http.statusCode);
        }
    } catch (e) {
        log.error('Sync error: ' + e.message);
        throw e;  // Causes step to fail
    }
};

exports.afterStep = function (success, parameters, stepExecution) {
    if (customers) {
        customers.close();
    }
};
```

## Chunk Lifecycle

1. `beforeStep()` - Called once at start
2. For each chunk:
   - `beforeChunk()` - Before chunk (optional)
   - `read()` - Called repeatedly until returns nothing
   - `process()` - Called for each item from read()
   - `write()` - Called with chunk of processed items
   - `afterChunk()` - After chunk (optional)
3. `afterStep(success)` - Called once at end

## Chunk Size Considerations

| Chunk Size | Pros | Cons |
|------------|------|------|
| Small (10-50) | More frequent progress updates | Higher overhead |
| Medium (100-500) | Good balance | Default choice |
| Large (1000+) | Less overhead | Less granular progress |

## Transaction Handling

Two approaches:

**1. transactional="true" in steptypes.json:**
```json
{
    "transactional": "true",
    "chunk-size": 100
}
```
Each chunk wrapped in single transaction. Rollback on error.

**2. Manual Transaction.wrap():**
```javascript
exports.write = function (items, parameters, stepExecution) {
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        Transaction.wrap(function () {
            // Per-item transaction
        });
    }
};
```
More control, item-level error handling.

## steptypes.json for Chunk Steps

```json
{
    "step-types": {
        "chunk-script-module-step": [
            {
                "@type-id": "custom.ProductExport",
                "@supports-parallel-execution": "true",
                "@supports-site-context": "true",
                "@supports-organization-context": "false",
                "description": "Export products to CSV",
                "module": "my_cartridge/cartridge/scripts/steps/productExport.js",
                "before-step-function": "beforeStep",
                "total-count-function": "getTotalCount",
                "read-function": "read",
                "process-function": "process",
                "write-function": "write",
                "after-step-function": "afterStep",
                "chunk-size": 100,
                "transactional": "false",
                "timeout-in-seconds": 3600,
                "parameters": {
                    "parameter": [
                        {
                            "@name": "OutputFile",
                            "@type": "string",
                            "@required": "false",
                            "default-value": "/export/products.csv",
                            "description": "Output file path"
                        }
                    ]
                }
            }
        ]
    }
}
```
