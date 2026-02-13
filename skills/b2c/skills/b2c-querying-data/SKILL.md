---
name: b2c-querying-data
description: Best practices for querying products, orders, customers, and system objects in B2C Commerce. Use when writing product searches, order queries, customer/profile lookups, replacing database-intensive APIs, improving search performance, or diagnosing slow category/search pages. Covers ProductSearchModel, OrderMgr, CustomerMgr, SystemObjectMgr, index-friendly vs database-intensive APIs, and query performance pitfalls. For order lifecycle and status management, use b2c-ordering instead. For custom object CRUD, use b2c-custom-objects instead.
---

# Querying Data in B2C Commerce

Efficient data querying is critical for storefront performance and job stability. B2C Commerce provides index-backed search APIs and database query APIs—choosing the right one for each use case avoids performance problems.

## Product Search (Storefront)

Use `ProductSearchModel` for all storefront product searches. It is index-backed and designed for high-traffic pages.

### Basic Product Search

```javascript
var ProductSearchModel = require('dw/catalog/ProductSearchModel');

var psm = new ProductSearchModel();
psm.setCategoryID('electronics');
psm.setOrderableProductsOnly(true); // Only in-stock products
psm.setSearchPhrase('laptop');
psm.search();

var hits = psm.getProductSearchHits();
while (hits.hasNext()) {
    var hit = hits.next();
    var productID = hit.productID;
    var minPrice = hit.minPrice;
    var maxPrice = hit.maxPrice;
}
hits.close();
```

### Paging Search Results

Always page results—never load the full result set:

```javascript
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var PagingModel = require('dw/web/PagingModel');

var psm = new ProductSearchModel();
psm.setCategoryID('mens-clothing');
psm.setOrderableProductsOnly(true);
psm.search();

var pagingModel = new PagingModel(psm.getProductSearchHits(), psm.count);
pagingModel.setPageSize(12);
pagingModel.setStart(0); // page offset

var pageElements = pagingModel.pageElements;
while (pageElements.hasNext()) {
    var hit = pageElements.next();
    // Render product tile
}
```

### Getting Variation Data from Search Hits

Use `ProductSearchHit` methods instead of loading full product objects:

```javascript
// GOOD: Get variation info from the search hit (index-backed)
var representedColors = hit.getRepresentedVariationValues('color');
var representedIDs = hit.getRepresentedProductIDs();
var minPrice = hit.getMinPrice();
var maxPrice = hit.getMaxPrice();

// BAD: Loading the full product and iterating variants (database-intensive)
var product = hit.product;
var variants = product.getVariants(); // Expensive!
var priceModel = product.getPriceModel(); // Expensive!
```

### Search Refinements

```javascript
var psm = new ProductSearchModel();
psm.setCategoryID('shoes');
psm.addRefinementValues('color', 'blue');
psm.addRefinementValues('size', '10');
psm.setPriceMin(50);
psm.setPriceMax(200);
psm.search();

// Get available refinement values for the current result set
var refinements = psm.getRefinements();
var colorValues = refinements.getNextLevelRefinementValues(
    refinements.getRefinementDefinitionByName('color')
);
```

### ProductSearchModel API Summary

| Method | Description |
|--------|-------------|
| `search()` | Execute the search |
| `setCategoryID(id)` | Filter by category |
| `setSearchPhrase(phrase)` | Set search keywords |
| `setOrderableProductsOnly(flag)` | Exclude out-of-stock |
| `addRefinementValues(name, value)` | Add refinement filter |
| `setPriceMin(price)` / `setPriceMax(price)` | Price range filter |
| `setSortingRule(rule)` | Set sorting rule |
| `getProductSearchHits()` | Get result iterator |
| `getRefinements()` | Get available refinements |
| `count` | Total result count |

## Order Queries

### OrderMgr.searchOrders / queryOrders

Use `searchOrders` for index-backed order lookups and `queryOrders` for database queries:

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');

// Index-backed search (preferred for common lookups)
var orders = OrderMgr.searchOrders(
    'customerEmail = {0} AND status != {1}',
    'creationDate desc',
    'customer@example.com',
    Order.ORDER_STATUS_FAILED
);

while (orders.hasNext()) {
    var order = orders.next();
    // Process order
}
orders.close(); // Always close iterators
```

### Query by Date Range

```javascript
var OrderMgr = require('dw/order/OrderMgr');
var Calendar = require('dw/util/Calendar');
var Order = require('dw/order/Order');

var startDate = new Calendar();
startDate.add(Calendar.DAY_OF_YEAR, -7);

var orders = OrderMgr.searchOrders(
    'creationDate >= {0} AND status = {1}',
    'creationDate desc',
    startDate.time,
    Order.ORDER_STATUS_NEW
);

while (orders.hasNext()) {
    var order = orders.next();
    // Process
}
orders.close();
```

### searchOrders vs queryOrders

| Aspect | `searchOrders` | `queryOrders` |
|--------|---------------|---------------|
| Backing | Search index | Database |
| Performance | Fast for indexed fields | Slower, full table scan possible |
| Use when | Querying indexed attributes (status, email, dates) | Querying non-indexed or custom attributes |
| Result limit | Up to 1000 hits | No hard limit (but use paging) |

**Prefer `searchOrders`** for storefront and high-traffic code paths. Use `queryOrders` only when you need to query attributes not available in the search index.

## Customer / Profile Queries

### CustomerMgr (Preferred)

Use `searchProfiles` for index-backed searches and `processProfiles` for batch processing in jobs:

```javascript
var CustomerMgr = require('dw/customer/CustomerMgr');

// Index-backed search (storefront use)
var profiles = CustomerMgr.searchProfiles(
    'email = {0}',
    'lastLoginTime desc',
    'customer@example.com'
);

while (profiles.hasNext()) {
    var profile = profiles.next();
    // Process profile
}
profiles.close();
```

### Batch Processing (Jobs)

Use `processProfiles` for jobs that need to iterate over many profiles—it has optimized memory management:

```javascript
var CustomerMgr = require('dw/customer/CustomerMgr');

function processProfile(profile) {
    // Process each profile individually
    // Memory is managed automatically
}

// Process all profiles matching the query
CustomerMgr.processProfiles('gender = {0}', processProfile, 1);
```

**Important:** `processProfiles` replaces the older `queryProfiles` and `SystemObjectMgr.querySystemObjects` for customer data. It uses the full-text search service with better performance and memory characteristics.

### Customer Query Behaviors

- Wildcards (`*`, `%`, `+`) are filtered from queries and replaced by spaces
- `LIKE` and `ILIKE` execute as full-text queries (match whole words, not substrings)
- `LIKE` is case-insensitive
- Combining `AND` and `OR` in the same query degrades performance
- Range queries (e.g., `a > b`) impact performance
- Results are limited to the first 1000 hits

## System Object Queries (SystemObjectMgr)

For querying system objects other than customers (e.g., SitePreferences, catalogs):

```javascript
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

// Query system objects
var results = SystemObjectMgr.querySystemObjects(
    'Profile',
    'custom.loyaltyTier = {0}',
    'lastLoginTime desc',
    'Gold'
);

while (results.hasNext()) {
    var obj = results.next();
    // Process
}
results.close();
```

**Note:** For customer profiles specifically, prefer `CustomerMgr.searchProfiles` or `CustomerMgr.processProfiles` over `SystemObjectMgr.querySystemObjects`—they use the search index and perform significantly better.

## Database-Intensive APIs to Avoid

These APIs hit the database directly and are expensive on high-traffic pages. Replace them with index-friendly alternatives. See [Performance-Critical APIs](references/PERFORMANCE-APIS.md) for the complete list with impact details.

| Avoid (Database-Intensive) | Use Instead (Index-Friendly) |
|----------------------------|------------------------------|
| `Category.getProducts()` / `getOnlineProducts()` | `ProductSearchModel.setCategoryID()` |
| `ProductMgr.queryAllSiteProducts()` | `ProductSearchModel.search()` |
| `Product.getVariants()` / `getVariationModel()` | `ProductSearchHit` methods |
| `Product.getPriceModel()` (in loops) | `ProductSearchHit.getMinPrice()` / `getMaxPrice()` |
| `CustomerMgr.queryProfiles()` | `CustomerMgr.searchProfiles()` or `processProfiles()` |

## Related Skills

- [b2c-ordering](../b2c-ordering/SKILL.md) — Order lifecycle, status transitions, creation flows
- [b2c-custom-objects](../b2c-custom-objects/SKILL.md) — Custom object CRUD, OCAPI search queries

## Best Practices

### Do

- **Always close iterators** — unclosed iterators leak resources (`results.close()`)
- **Page results** — use `PagingModel` or limit result counts; never load unbounded result sets
- **Put all filtering in the query** — don't post-process or filter results in custom code
- **Use index-backed APIs** — `ProductSearchModel`, `searchOrders`, `searchProfiles` for storefront pages
- **Use `processProfiles`** for batch customer operations in jobs (optimized memory)
- **Limit page size** — maximum ~120 products per page for search result pages
- **Use `setOrderableProductsOnly(true)`** — to filter unavailable products at the search level

### Don't

- **Don't iterate over product variants on search result pages** — use `ProductSearchHit` methods instead
- **Don't post-process search results** — all criteria must go into the query for efficient execution
- **Don't use `queryAllSiteProducts()`** on storefront pages — it bypasses the search index
- **Don't combine AND + OR** in customer queries — it degrades performance
- **Don't rely on getting more than 1000 results** — search APIs cap at 1000 hits
- **Don't call database-intensive APIs on high-traffic pages** — category pages, search results, PDPs, and homepage

### Job-Specific Guidelines

- Use `processProfiles` over `queryProfiles` for large customer data sets
- Design loop logic so memory consumption doesn't grow with result set size
- Keep only the currently processed object in memory; don't retain references
- Stream data to files regularly; don't build large structures in memory
- Limit transaction size to under 1000 modified business objects

## Detailed References

- [Performance-Critical APIs](references/PERFORMANCE-APIS.md) — full list of index-friendly vs database-intensive APIs
