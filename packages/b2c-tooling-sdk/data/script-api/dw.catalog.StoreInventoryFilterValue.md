<!-- prettier-ignore-start -->
# Class StoreInventoryFilterValue

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md)



This class represents a store inventory filter value, which can be used for a [StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md) to filter
the search result by one or more store inventory list IDs via
[ProductSearchModel.setStoreInventoryFilter(StoreInventoryFilter)](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter). Compared to
[ProductSearchModel.setInventoryListIDs(List)](dw.catalog.ProductSearchModel.md#setinventorylistidslist) the store inventory filter allows a customization of the
inventory parameter name and the inventory list ID values for URL generations. A StoreInventoryFilterValue provides
the mapping between a semantic value e.g. store1,store2 or Burlington,Boston to the related real inventory list ID.


Example custom URL: city=Burlington|Boston



```
new dw.catalog.StoreInventoryFilter("city",
    new dw.util.ArrayList(
        new dw.catalog.StoreInventoryFilterValue("Burlington","inventory_store_store9"),
        new dw.catalog.StoreInventoryFilterValue("Boston","inventory_store_store8")
));
```



## Property Summary

| Property | Description |
| --- | --- |
| [inventoryListID](#inventorylistid): [String](TopLevel.String.md) `(read-only)` | Returns the real inventory list ID of this store inventory filter value. |
| [semanticInventoryID](#semanticinventoryid): [String](TopLevel.String.md) `(read-only)` | Returns the semantic inventory ID of this store inventory filter value. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [StoreInventoryFilterValue](#storeinventoryfiltervaluestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | <p>  Creates a new StoreInventoryFilterValue instance for the semantic inventory ID and real inventory list ID. |

## Method Summary

| Method | Description |
| --- | --- |
| [getInventoryListID](dw.catalog.StoreInventoryFilterValue.md#getinventorylistid)() | Returns the real inventory list ID of this store inventory filter value. |
| [getSemanticInventoryID](dw.catalog.StoreInventoryFilterValue.md#getsemanticinventoryid)() | Returns the semantic inventory ID of this store inventory filter value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### inventoryListID
- inventoryListID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the real inventory list ID of this store inventory filter value.


---

### semanticInventoryID
- semanticInventoryID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the semantic inventory ID of this store inventory filter value.


---

## Constructor Details

### StoreInventoryFilterValue(String, String)
- StoreInventoryFilterValue(semanticInventoryListID: [String](TopLevel.String.md), inventoryListID: [String](TopLevel.String.md))
  - : 
      
      Creates a new StoreInventoryFilterValue instance for the semantic inventory ID and real inventory list ID.


    **Parameters:**
    - semanticInventoryListID - The semantic inventory list ID of this store inventory filter value.
    - inventoryListID - The real inventory list ID to filter the search result on.

    **Throws:**
    - NullArgumentException - in case of missing required parameter.


---

## Method Details

### getInventoryListID()
- getInventoryListID(): [String](TopLevel.String.md)
  - : Returns the real inventory list ID of this store inventory filter value.

    **Returns:**
    - the real inventory list ID of this store inventory filter value.


---

### getSemanticInventoryID()
- getSemanticInventoryID(): [String](TopLevel.String.md)
  - : Returns the semantic inventory ID of this store inventory filter value.

    **Returns:**
    - the semantic inventory ID of this store inventory filter value.


---

<!-- prettier-ignore-end -->
