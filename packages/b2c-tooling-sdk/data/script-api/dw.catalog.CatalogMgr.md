<!-- prettier-ignore-start -->
# Class CatalogMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.CatalogMgr](dw.catalog.CatalogMgr.md)

Provides helper methods for getting categories.


## Property Summary

| Property | Description |
| --- | --- |
| [siteCatalog](#sitecatalog): [Catalog](dw.catalog.Catalog.md) `(read-only)` | Returns the catalog of the current site or null if no catalog is assigned to the site. |
| [sortingOptions](#sortingoptions): [List](dw.util.List.md) `(read-only)` | Returns a list containing the sorting options configured for this site. |
| [sortingRules](#sortingrules): [Collection](dw.util.Collection.md) `(read-only)` | Returns a collection containing all of the sorting rules for this site, including global sorting rules. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getCatalog](dw.catalog.CatalogMgr.md#getcatalogstring)([String](TopLevel.String.md)) | Returns the catalog identified by the specified catalog id. |
| static [getCategory](dw.catalog.CatalogMgr.md#getcategorystring)([String](TopLevel.String.md)) | Returns the category of the site catalog identified by the specified  category id. |
| static [getSiteCatalog](dw.catalog.CatalogMgr.md#getsitecatalog)() | Returns the catalog of the current site or null if no catalog is assigned to the site. |
| static [getSortingOption](dw.catalog.CatalogMgr.md#getsortingoptionstring)([String](TopLevel.String.md)) | Returns the sorting option with the given ID for this site, or  `null` if there is no such option. |
| static [getSortingOptions](dw.catalog.CatalogMgr.md#getsortingoptions)() | Returns a list containing the sorting options configured for this site. |
| static [getSortingRule](dw.catalog.CatalogMgr.md#getsortingrulestring)([String](TopLevel.String.md)) | Returns the sorting rule with the given ID for this site,  or `null` if there is no such rule. |
| static [getSortingRules](dw.catalog.CatalogMgr.md#getsortingrules)() | Returns a collection containing all of the sorting rules for this site, including global sorting rules. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### siteCatalog
- siteCatalog: [Catalog](dw.catalog.Catalog.md) `(read-only)`
  - : Returns the catalog of the current site or null if no catalog is assigned to the site.


---

### sortingOptions
- sortingOptions: [List](dw.util.List.md) `(read-only)`
  - : Returns a list containing the sorting options configured for this site.


---

### sortingRules
- sortingRules: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns a collection containing all of the sorting rules for this site, including global sorting rules.


---

## Method Details

### getCatalog(String)
- static getCatalog(id: [String](TopLevel.String.md)): [Catalog](dw.catalog.Catalog.md)
  - : Returns the catalog identified by the specified catalog id.
      Returns null if no catalog with the specified id exists in the
      current organization context.


    **Parameters:**
    - id - Catalog id

    **Returns:**
    - the catalog or null.


---

### getCategory(String)
- static getCategory(id: [String](TopLevel.String.md)): [Category](dw.catalog.Category.md)
  - : Returns the category of the site catalog identified by the specified
      category id. Returns null if no site catalog is defined, or no category
      with the specified id is found in the site catalog.


    **Parameters:**
    - id - the category identifier.

    **Returns:**
    - the category of the site catalog identified by the specified
      category id or null if no site catalog is found.



---

### getSiteCatalog()
- static getSiteCatalog(): [Catalog](dw.catalog.Catalog.md)
  - : Returns the catalog of the current site or null if no catalog is assigned to the site.

    **Returns:**
    - the catalog of the current site or null.


---

### getSortingOption(String)
- static getSortingOption(id: [String](TopLevel.String.md)): [SortingOption](dw.catalog.SortingOption.md)
  - : Returns the sorting option with the given ID for this site, or
      `null` if there is no such option.


    **Parameters:**
    - id - the ID of the sorting option

    **Returns:**
    - a SortingOption or null.


---

### getSortingOptions()
- static getSortingOptions(): [List](dw.util.List.md)
  - : Returns a list containing the sorting options configured for this site.

    **Returns:**
    - a list of SortingOption objects


---

### getSortingRule(String)
- static getSortingRule(id: [String](TopLevel.String.md)): [SortingRule](dw.catalog.SortingRule.md)
  - : Returns the sorting rule with the given ID for this site,
      or `null` if there is no such rule.


    **Parameters:**
    - id - the ID of the sorting rule

    **Returns:**
    - a SortingRule or null.


---

### getSortingRules()
- static getSortingRules(): [Collection](dw.util.Collection.md)
  - : Returns a collection containing all of the sorting rules for this site, including global sorting rules.

    **Returns:**
    - a collection of SortingRule objects


---

<!-- prettier-ignore-end -->
