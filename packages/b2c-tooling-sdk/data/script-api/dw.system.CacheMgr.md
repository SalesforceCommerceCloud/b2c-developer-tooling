<!-- prettier-ignore-start -->
# Class CacheMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.CacheMgr](dw.system.CacheMgr.md)

The CacheMgr class is the entry point for using custom caches.


The CacheMgr can manage multiple custom caches that share one storage space. Each individual cache has a unique ID
and an optional expiration time that specifies the maximum time (in seconds) an entry is stored in the cache. For
registering caches inside the cartridge root folder, a 'package.json' file with a 'caches' entry must exist. The
registration of caches is independent of any site context.


```
"caches": "./caches.json"
```


The caches entry links to a JSON file, with a path relative to the 'package.json' file. This file lists all
registered caches inside the caches property:


```
{
  "caches": [
    {
      "id": "UnlimitedTestCache"
    },
    {
      "id": "TestCacheWithExpiration",
      "expireAfterSeconds": 10
    }
  ]
}
```



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getCache](dw.system.CacheMgr.md#getcachestring)([String](TopLevel.String.md)) | Returns the defined cache instance for the given ID. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### getCache(String)
- static getCache(cacheID: [String](TopLevel.String.md)): [Cache](dw.system.Cache.md)
  - : Returns the defined cache instance for the given ID. Throws an exception when the requested cache has not been
      defined in any caches.json descriptor.


    **Parameters:**
    - cacheID - The ID of the cache.

    **Returns:**
    - The registered cache.


---

<!-- prettier-ignore-end -->
