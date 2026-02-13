# Performance-Critical APIs

Complete reference for index-friendly vs database-intensive APIs in B2C Commerce.

## Product APIs

### Database-Intensive (Avoid on Storefront Pages)

| API | Problem | Impact |
|-----|---------|--------|
| `Category.getOnlineSubCategories()` | Hits database for each subcategory | Slow on deep category trees |
| `Category.getProducts()` | Loads all products from database | Memory + time on large categories |
| `Category.getOnlineProducts()` | Same as above, filtered | Still database-backed |
| `Category.getProductAssignments()` | Database query per assignment | Expensive with many assignments |
| `Category.getOnlineCategoryAssignments()` | Same, filtered by online status | Still database-backed |
| `ProductMgr.queryAllSiteProducts()` | Full table scan of all products | Never use on storefront |
| `Product.getPriceModel()` | Database lookup for pricing | Expensive in loops |
| `Product.getVariants()` | Loads all variant products | Very expensive for products with many variants |
| `Product.getVariationModel()` | Builds full variation model | Database-intensive |

### Index-Friendly Replacements

| API | Benefit |
|-----|---------|
| `ProductSearchModel.search()` | Search-index backed, fast |
| `ProductSearchModel.setCategoryID(id)` | Replaces `Category.getProducts()` |
| `ProductSearchModel.setOrderableProductsOnly(true)` | Replaces `Category.getOnlineProducts()` + availability check |
| `ProductSearchModel.getRefinements()` | Index-backed refinement values |
| `ProductSearchRefinements.getNextLevelRefinementValues()` | Replaces `Category.getOnlineSubCategories()` for nav |
| `ProductSearchModel.getProductSearchHits()` | Efficient result iteration |
| `ProductSearchHit.getMinPrice()` / `getMaxPrice()` | Replaces `Product.getPriceModel()` in search |
| `ProductSearchHit.getRepresentedProductIDs()` | Replaces `Product.getVariants()` in search |
| `ProductSearchHit.getRepresentedVariationValues(attr)` | Replaces `Product.getVariationModel()` in search |

## Order APIs

| API | Type | Notes |
|-----|------|-------|
| `OrderMgr.searchOrders(query, sort, ...args)` | Index-backed | Preferred for storefront lookups; limited to 1000 results |
| `OrderMgr.searchOrder(query, ...args)` | Index-backed | Single order search |
| `OrderMgr.queryOrders(query, sort, ...args)` | Database | Use for non-indexed attributes only |
| `OrderMgr.queryOrder(query, ...args)` | Database | Single order, database query |
| `OrderMgr.getOrder(orderNo)` | Direct lookup | Fast; use when you have the order number |

## Customer / Profile APIs

| API | Type | Notes |
|-----|------|-------|
| `CustomerMgr.searchProfiles(query, sort, ...args)` | Index-backed | Preferred for storefront; max 1000 results |
| `CustomerMgr.processProfiles(query, callback, ...args)` | Index-backed | Preferred for jobs; optimized memory management |
| `CustomerMgr.queryProfiles(query, sort, ...args)` | Database | **Deprecated pattern**; use `searchProfiles` instead |
| `SystemObjectMgr.querySystemObjects('Profile', ...)` | Database | **Deprecated for profiles**; use `CustomerMgr` methods |
| `CustomerMgr.getCustomerByLogin(login)` | Direct lookup | Fast; use when you have the login |
| `CustomerMgr.getCustomerByToken(token)` | Direct lookup | Fast; token-based auth flows |

## Custom Object APIs

| API | Type | Notes |
|-----|------|-------|
| `CustomObjectMgr.getCustomObject(type, key)` | Direct lookup | Fast; use when you have the key |
| `CustomObjectMgr.queryCustomObjects(type, query, sort, ...args)` | Database | Only option for filtered queries |
| `CustomObjectMgr.getAllCustomObjects(type)` | Database | Use with caution on large datasets |

## General Query Performance Rules

1. **Search index APIs** (search*) are 10-100x faster than database APIs (query*) for indexed attributes
2. **Direct lookups** (getOrder, getCustomerByLogin, getCustomObject) are fastest when you have the key
3. **Database queries** (query*) should only be used when:
   - The attribute is not in the search index
   - You need more than 1000 results (use in jobs, not storefront)
   - You need exact database consistency (search index can be slightly behind)
4. **Iterator management**: Always call `.close()` on query/search result iterators
5. **Result limits**: Search APIs return at most 1000 hits; design pagination accordingly
