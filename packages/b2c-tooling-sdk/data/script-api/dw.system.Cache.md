<!-- prettier-ignore-start -->
# Class Cache

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Cache](dw.system.Cache.md)

The Cache class represents a custom cache.


A cache stores data over multiple requests. Each cartridge can define its own
caches for different business requirements. To limit the
visibility of cache entries by scope, for example, by site, catalog, or
external system, include the scope reference when constructing the
key. For example:


```
   var cache = CacheMgr.getCache( 'SiteConfigurations' );
   cache.get( Site.current.ID + "config", function loadSiteConfiguration() {return loadCfg( Site.current );} );
```




Do not build the cache key using personal user data, since the key might be
visible in log messages.



There is never a guarantee that a stored object can be retrieved from the
cache. The storage allocated for entries is limited and clearing or
invalidation might occur at any time. To maintain the cache size limits, the
cache evicts entries that are less likely to be used again. For example, the
cache might evict an entry because it hasn't been used recently or very
often. Cache entries aren't synchronized between different application
servers.



The cache returns immutable copies of the original objects put into the
cache. Lists are converted to arrays during this process. Only JavaScript
primitive values and tree-like object structures can be stored as entries.
Object structures can consist of arrays, lists, and basic JavaScript
objects. Script API classes are not supported, except [List](dw.util.List.md)
and its subclasses. `null` can be stored as a value.
`undefined` can't be stored.



See [CacheMgr](dw.system.CacheMgr.md) for details about how to configure a custom cache.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [get](dw.system.Cache.md#getstring)([String](TopLevel.String.md)) | Returns the value associated with key in this cache. |
| [get](dw.system.Cache.md#getstring-function)([String](TopLevel.String.md), [Function](TopLevel.Function.md)) | Returns the value associated with key in this cache, or invokes the loader function to generate the entry if  there is no entry found. |
| [invalidate](dw.system.Cache.md#invalidatestring)([String](TopLevel.String.md)) | Removes the cache entry for key (if one exists) manually before the cache's eviction strategy goes into effect. |
| [put](dw.system.Cache.md#putstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Stores the specified entry directly into the cache, replacing any previously cached entry for key if one exists. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### get(String)
- get(key: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : Returns the value associated with key in this cache. If there is no entry in the cache then
      `undefined` is returned.


    **Parameters:**
    - key - The cache key.

    **Returns:**
    - The stored value or `undefined` if no value is found in the cache.


---

### get(String, Function)
- get(key: [String](TopLevel.String.md), loader: [Function](TopLevel.Function.md)): [Object](TopLevel.Object.md)
  - : Returns the value associated with key in this cache, or invokes the loader function to generate the entry if
      there is no entry found. The generated entry is stored for future retrieval. If the loader function returns
      `undefined`, this value is not stored in the cache.


    **Parameters:**
    - key - The cache key.
    - loader - The loader function that is called if no value is stored in the cache.

    **Returns:**
    - The value found in the cache or the value returned from the loader function call.


---

### invalidate(String)
- invalidate(key: [String](TopLevel.String.md)): void
  - : Removes the cache entry for key (if one exists) manually before the cache's eviction strategy goes into effect.

    **Parameters:**
    - key - The cache key.


---

### put(String, Object)
- put(key: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): void
  - : Stores the specified entry directly into the cache, replacing any previously cached entry for key if one exists.
      Storing `undefined` as value has the same effect as calling [invalidate(String)](dw.system.Cache.md#invalidatestring) for that key.


    **Parameters:**
    - key - The cache key.
    - value - The value to be store in the cache.


---

<!-- prettier-ignore-end -->
