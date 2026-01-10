<!-- prettier-ignore-start -->
# Class StoreInventoryFilter

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.StoreInventoryFilter](dw.catalog.StoreInventoryFilter.md)



This class represents a store inventory filter, which can be used at
[ProductSearchModel.setStoreInventoryFilter(StoreInventoryFilter)](dw.catalog.ProductSearchModel.md#setstoreinventoryfilterstoreinventoryfilter) to filter the search result by one or more
store inventories. Compared to the default parameter 'ilids' (Inventory List IDs) see
([ProductSearchModel.INVENTORY_LIST_IDS_PARAMETER](dw.catalog.ProductSearchModel.md#inventory_list_ids_parameter) the store inventory filter allows a customization of the
parameter name and the inventory list ID parameter values for the URL generations via all URLRefine and URLRelax
methods e.g. for [ProductSearchModel.urlRefineCategory(String, String)](dw.catalog.ProductSearchModel.md#urlrefinecategorystring-string),
[ProductSearchModel.urlRelaxPrice(URL)](dw.catalog.ProductSearchModel.md#urlrelaxpriceurl),
[SearchModel.urlRefineAttribute(String, String, String)](dw.catalog.SearchModel.md#urlrefineattributestring-string-string).


Example custom URL: city=Burlington|Boston



```
new dw.catalog.StoreInventoryFilter( "city",
    new dw.util.ArrayList( new dw.catalog.StoreInventoryFilterValue( "Burlington", "inventory_store_store9" ),
        new dw.catalog.StoreInventoryFilterValue( "Boston", "inventory_store_store8" ) ) );
```



## Property Summary

| Property | Description |
| --- | --- |
| [semanticURLParameter](#semanticurlparameter): [String](TopLevel.String.md) `(read-only)` | Returns the semantic URL parameter of this StoreInventoryFilter. |
| [storeInventoryFilterValues](#storeinventoryfiltervalues): [List](dw.util.List.md) `(read-only)` | Returns a list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances used by this StoreInventoryFilter. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [StoreInventoryFilter](#storeinventoryfilterstring-list)([String](TopLevel.String.md), [List](dw.util.List.md)) | Creates a new StoreInventoryFilter instance for the given semantic URL parameter and a list of  [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances. |

## Method Summary

| Method | Description |
| --- | --- |
| [getSemanticURLParameter](dw.catalog.StoreInventoryFilter.md#getsemanticurlparameter)() | Returns the semantic URL parameter of this StoreInventoryFilter. |
| [getStoreInventoryFilterValues](dw.catalog.StoreInventoryFilter.md#getstoreinventoryfiltervalues)() | Returns a list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances used by this StoreInventoryFilter. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### semanticURLParameter
- semanticURLParameter: [String](TopLevel.String.md) `(read-only)`
  - : Returns the semantic URL parameter of this StoreInventoryFilter.


---

### storeInventoryFilterValues
- storeInventoryFilterValues: [List](dw.util.List.md) `(read-only)`
  - : Returns a list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances used by this StoreInventoryFilter.


---

## Constructor Details

### StoreInventoryFilter(String, List)
- StoreInventoryFilter(semanticURLParameter: [String](TopLevel.String.md), storeFilterValues: [List](dw.util.List.md))
  - : Creates a new StoreInventoryFilter instance for the given semantic URL parameter and a list of
      [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances. The semantic URL parameter e.g. city, zip, store and the semantic
      store inventory values from the storeFilterValues will be used for URL generation. The mapped inventory list IDs
      from the storeFilterValues will be used for filtering. on the mapped


    **Parameters:**
    - semanticURLParameter - The semantic URL parameter which should be used for URL generation instead of 'ilids'                              (Inventory List IDs)
    - storeFilterValues - A list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances containing the store inventory                              values and the related real inventory list ID.

    **Throws:**
    - NullArgumentException - in case of missing required parameter.


---

## Method Details

### getSemanticURLParameter()
- getSemanticURLParameter(): [String](TopLevel.String.md)
  - : Returns the semantic URL parameter of this StoreInventoryFilter.

    **Returns:**
    - the semantic URL parameter of this StoreInventoryFilter.


---

### getStoreInventoryFilterValues()
- getStoreInventoryFilterValues(): [List](dw.util.List.md)
  - : Returns a list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances used by this StoreInventoryFilter.

    **Returns:**
    - a list of [StoreInventoryFilterValue](dw.catalog.StoreInventoryFilterValue.md) instances used by this StoreInventoryFilter.


---

<!-- prettier-ignore-end -->
