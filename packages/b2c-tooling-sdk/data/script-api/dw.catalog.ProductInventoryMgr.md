<!-- prettier-ignore-start -->
# Class ProductInventoryMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductInventoryMgr](dw.catalog.ProductInventoryMgr.md)

This manager provides access to inventory-related objects.


## Constant Summary

| Constant | Description |
| --- | --- |
| [INTEGRATIONMODE_B2C](#integrationmode_b2c): [String](TopLevel.String.md) = "B2C" | Integration mode 'B2C' - using B2C inventory, no integration with Omnichannel Inventory |
| [INTEGRATIONMODE_OCI](#integrationmode_oci): [String](TopLevel.String.md) = "OCI" | Integration mode 'OCI' - integration with Omnichannel Inventory enabled |
| [INTEGRATIONMODE_OCI_CACHE](#integrationmode_oci_cache): [String](TopLevel.String.md) = "OCI_CACHE" | Integration mode 'OCI\_CACHE' - using B2C inventory, initializing cache as preparation for integration with  Omnichannel Inventory |

## Property Summary

| Property | Description |
| --- | --- |
| [inventoryIntegrationMode](#inventoryintegrationmode): [String](TopLevel.String.md) `(read-only)` | Returns the current inventory integration mode as one of  <ul>  <li>[INTEGRATIONMODE_B2C](dw.catalog.ProductInventoryMgr.md#integrationmode_b2c)</li>  <li>[INTEGRATIONMODE_OCI_CACHE](dw.catalog.ProductInventoryMgr.md#integrationmode_oci_cache)</li>  <li>[INTEGRATIONMODE_OCI](dw.catalog.ProductInventoryMgr.md#integrationmode_oci)</li>  </ul> |
| [inventoryList](#inventorylist): [ProductInventoryList](dw.catalog.ProductInventoryList.md) `(read-only)` | Returns the inventory list assigned to the current site or null if no inventory list is assigned to the current  site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getInventoryIntegrationMode](dw.catalog.ProductInventoryMgr.md#getinventoryintegrationmode)() | Returns the current inventory integration mode as one of  <ul>  <li>[INTEGRATIONMODE_B2C](dw.catalog.ProductInventoryMgr.md#integrationmode_b2c)</li>  <li>[INTEGRATIONMODE_OCI_CACHE](dw.catalog.ProductInventoryMgr.md#integrationmode_oci_cache)</li>  <li>[INTEGRATIONMODE_OCI](dw.catalog.ProductInventoryMgr.md#integrationmode_oci)</li>  </ul> |
| static [getInventoryList](dw.catalog.ProductInventoryMgr.md#getinventorylist)() | Returns the inventory list assigned to the current site or null if no inventory list is assigned to the current  site. |
| static [getInventoryList](dw.catalog.ProductInventoryMgr.md#getinventoryliststring)([String](TopLevel.String.md)) | Returns the inventory list with the passed ID or null if no inventory list exists with that ID. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### INTEGRATIONMODE_B2C

- INTEGRATIONMODE_B2C: [String](TopLevel.String.md) = "B2C"
  - : Integration mode 'B2C' - using B2C inventory, no integration with Omnichannel Inventory


---

### INTEGRATIONMODE_OCI

- INTEGRATIONMODE_OCI: [String](TopLevel.String.md) = "OCI"
  - : Integration mode 'OCI' - integration with Omnichannel Inventory enabled


---

### INTEGRATIONMODE_OCI_CACHE

- INTEGRATIONMODE_OCI_CACHE: [String](TopLevel.String.md) = "OCI_CACHE"
  - : Integration mode 'OCI\_CACHE' - using B2C inventory, initializing cache as preparation for integration with
      Omnichannel Inventory



---

## Property Details

### inventoryIntegrationMode
- inventoryIntegrationMode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the current inventory integration mode as one of
      
      - [INTEGRATIONMODE_B2C](dw.catalog.ProductInventoryMgr.md#integrationmode_b2c)
      - [INTEGRATIONMODE_OCI_CACHE](dw.catalog.ProductInventoryMgr.md#integrationmode_oci_cache)
      - [INTEGRATIONMODE_OCI](dw.catalog.ProductInventoryMgr.md#integrationmode_oci)



---

### inventoryList
- inventoryList: [ProductInventoryList](dw.catalog.ProductInventoryList.md) `(read-only)`
  - : Returns the inventory list assigned to the current site or null if no inventory list is assigned to the current
      site.



---

## Method Details

### getInventoryIntegrationMode()
- static getInventoryIntegrationMode(): [String](TopLevel.String.md)
  - : Returns the current inventory integration mode as one of
      
      - [INTEGRATIONMODE_B2C](dw.catalog.ProductInventoryMgr.md#integrationmode_b2c)
      - [INTEGRATIONMODE_OCI_CACHE](dw.catalog.ProductInventoryMgr.md#integrationmode_oci_cache)
      - [INTEGRATIONMODE_OCI](dw.catalog.ProductInventoryMgr.md#integrationmode_oci)


    **Returns:**
    - The current inventory integration mode as a constant String.


---

### getInventoryList()
- static getInventoryList(): [ProductInventoryList](dw.catalog.ProductInventoryList.md)
  - : Returns the inventory list assigned to the current site or null if no inventory list is assigned to the current
      site.


    **Returns:**
    - The ProductInventoryList assigned to the current site, or null.


---

### getInventoryList(String)
- static getInventoryList(listID: [String](TopLevel.String.md)): [ProductInventoryList](dw.catalog.ProductInventoryList.md)
  - : Returns the inventory list with the passed ID or null if no inventory list exists with that ID.

    **Parameters:**
    - listID - The ID of the inventory list to retrieve.

    **Returns:**
    - The ProductInventoryList identified by listID, or null.


---

<!-- prettier-ignore-end -->
