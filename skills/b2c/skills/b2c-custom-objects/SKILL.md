---
name: b2c-custom-objects
description: Work with custom objects in B2C Commerce using Script API and OCAPI. Use when storing custom business data, querying custom objects, implementing data persistence, or creating site-scoped or global data stores. Covers CustomObjectMgr, OCAPI Data API, search queries, and Shopper Custom Objects API.
---

# B2C Custom Objects

Custom objects store business data that doesn't fit into standard system objects. They support both site-scoped and organization-scoped (global) data, with full CRUD operations via Script API and OCAPI.

## When to Use Custom Objects

| Use Case | Example |
|----------|---------|
| Business configuration | Store configuration per site or globally |
| Integration data | Cache external system responses |
| Custom entities | Loyalty tiers, custom promotions, vendor data |
| Temporary processing | Job processing queues, import staging |

## Custom Object Types

Custom objects are defined in Business Manager under **Administration > Site Development > Custom Object Types**. Each type has:

- **ID**: Unique identifier (e.g., `CustomConfig`)
- **Key Attribute**: Primary key field for lookups
- **Attributes**: Custom attributes for data storage
- **Scope**: Site-scoped or organization-scoped (global)

## Script API (CustomObjectMgr)

### Getting Custom Objects

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

// Get a single custom object by type and key
var config = CustomObjectMgr.getCustomObject('CustomConfig', 'myConfigKey');

if (config) {
    var value = config.custom.configValue;
}
```

### Creating Custom Objects

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

Transaction.wrap(function() {
    // Create new custom object (type, keyValue)
    var obj = CustomObjectMgr.createCustomObject('CustomConfig', 'newKey');
    obj.custom.configValue = 'myValue';
    obj.custom.isActive = true;
});
```

### Querying Custom Objects

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

// Query with attribute filter
var objects = CustomObjectMgr.queryCustomObjects(
    'CustomConfig',                    // Type
    'custom.isActive = {0}',           // Query (uses positional params)
    'creationDate desc',               // Sort order
    true                               // Parameter value for {0}
);

while (objects.hasNext()) {
    var obj = objects.next();
    // Process object
}
objects.close();
```

### Deleting Custom Objects

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

Transaction.wrap(function() {
    var obj = CustomObjectMgr.getCustomObject('CustomConfig', 'keyToDelete');
    if (obj) {
        CustomObjectMgr.remove(obj);
    }
});
```

### Getting All Objects of a Type

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

// Get all objects of a type
var allConfigs = CustomObjectMgr.getAllCustomObjects('CustomConfig');

while (allConfigs.hasNext()) {
    var config = allConfigs.next();
    // Process
}
allConfigs.close();
```

## CustomObjectMgr API Reference

| Method | Description |
|--------|-------------|
| `getCustomObject(type, keyValue)` | Get single object by type and key |
| `createCustomObject(type, keyValue)` | Create new object (within transaction) |
| `remove(object)` | Delete object (within transaction) |
| `queryCustomObjects(type, query, sortString, ...args)` | Query with filters |
| `getAllCustomObjects(type)` | Get all objects of a type |
| `describe(type)` | Get metadata about the custom object type |

## OCAPI Data API

### Get Custom Object

```http
GET /s/-/dw/data/v24_1/custom_objects/{object_type}/{key}
Authorization: Bearer {token}
```

### Create Custom Object

```http
PUT /s/-/dw/data/v24_1/custom_objects/{object_type}/{key}
Authorization: Bearer {token}
Content-Type: application/json

{
    "key_property": "myKey",
    "c_configValue": "myValue",
    "c_isActive": true
}
```

### Update Custom Object

```http
PATCH /s/-/dw/data/v24_1/custom_objects/{object_type}/{key}
Authorization: Bearer {token}
Content-Type: application/json

{
    "c_configValue": "updatedValue"
}
```

### Delete Custom Object

```http
DELETE /s/-/dw/data/v24_1/custom_objects/{object_type}/{key}
Authorization: Bearer {token}
```

### Search Custom Objects

```http
POST /s/-/dw/data/v24_1/custom_object_search/{object_type}
Authorization: Bearer {token}
Content-Type: application/json

{
    "query": {
        "bool_query": {
            "must": [
                { "term_query": { "field": "c_isActive", "value": true } }
            ]
        }
    },
    "select": "(**)",
    "sorts": [{ "field": "creation_date", "sort_order": "desc" }],
    "start": 0,
    "count": 25
}
```

### Search Query Types

| Query Type | Description | Example |
|------------|-------------|---------|
| `term_query` | Exact match | `{"field": "c_status", "value": "active"}` |
| `text_query` | Full-text search | `{"fields": ["c_name"], "search_phrase": "test"}` |
| `range_query` | Range comparison | `{"field": "c_count", "from": 1, "to": 10}` |
| `bool_query` | Combine queries | `{"must": [...], "should": [...], "must_not": [...]}` |
| `match_all_query` | Match all records | `{}` |

## Shopper Custom Objects API (SCAPI)

For read-only access from storefronts, use the Shopper Custom Objects API. This requires specific OAuth scopes.

### Get Custom Object (Shopper)

```http
GET /custom-objects/shopper-custom-objects/v1/organizations/{org}/custom-objects/{object_type}/{key}
    ?siteId={siteId}
Authorization: Bearer {shopper_token}
```

### Required Scopes

For the Shopper Custom Objects API, configure these scopes in your SLAS client:

- `sfcc.shopper-custom-objects` - Read access to custom objects

The custom object type must also be enabled for shopper access in Business Manager.

## Best Practices

### Do

- Use transactions for create/update/delete operations
- Close query iterators when done (`objects.close()`)
- Use meaningful key values for efficient lookups
- Index frequently queried attributes
- Use site-scoped objects for site-specific data
- Use organization-scoped objects for shared configuration

### Don't

- Store sensitive data without encryption
- Create excessive custom object types
- Use custom objects for high-volume transactional data
- Forget to handle null returns from `getCustomObject()`
- Leave query iterators open (causes resource leaks)

## Common Patterns

### Configuration Store

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');

function getConfig(key, defaultValue) {
    var configKey = Site.current.ID + '_' + key;
    var obj = CustomObjectMgr.getCustomObject('SiteConfig', configKey);

    if (obj && obj.custom.value !== null) {
        return JSON.parse(obj.custom.value);
    }
    return defaultValue;
}

function setConfig(key, value) {
    var Transaction = require('dw/system/Transaction');
    var configKey = Site.current.ID + '_' + key;

    Transaction.wrap(function() {
        var obj = CustomObjectMgr.getCustomObject('SiteConfig', configKey);
        if (!obj) {
            obj = CustomObjectMgr.createCustomObject('SiteConfig', configKey);
        }
        obj.custom.value = JSON.stringify(value);
    });
}
```

### Processing Queue

```javascript
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

// Add to queue
function enqueue(data) {
    var key = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    Transaction.wrap(function() {
        var obj = CustomObjectMgr.createCustomObject('JobQueue', key);
        obj.custom.data = JSON.stringify(data);
        obj.custom.status = 'pending';
    });
}

// Process queue
function processQueue() {
    var pending = CustomObjectMgr.queryCustomObjects(
        'JobQueue',
        'custom.status = {0}',
        'creationDate asc',
        'pending'
    );

    while (pending.hasNext()) {
        var job = pending.next();
        Transaction.wrap(function() {
            job.custom.status = 'processing';
        });

        try {
            var data = JSON.parse(job.custom.data);
            processJob(data);

            Transaction.wrap(function() {
                CustomObjectMgr.remove(job);
            });
        } catch (e) {
            Transaction.wrap(function() {
                job.custom.status = 'failed';
                job.custom.error = e.message;
            });
        }
    }
    pending.close();
}
```

## Detailed References

- [OCAPI Search Queries](references/OCAPI-SEARCH.md) - Full search query syntax and examples
