<!-- prettier-ignore-start -->
# Class ProductInventoryList

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.ProductInventoryList](dw.catalog.ProductInventoryList.md)

The ProductInventoryList provides access to ID, description and defaultInStockFlag of the list. Furthermore inventory
records can be accessed by product or product ID.


When using Omnichannel Inventory (OCI):

- B2C Commerce uses ProductInventoryLists to reference and expose OCI Locations and Location Groups. They're  required for synchronizing availability data and creating reservations.
- Create a ProductInventoryList in B2C Commerce for each OCI Location and Location Group that B2C Commerce will  access. The ProductInventoryList ID must match the External Reference field on the corresponding Location or Location  Group.
- A ProductInventoryList ID/External Reference must have between 2 and 128 characters (inclusive). It can include  only lowercase letters, uppercase letters, digits, hyphens, and underscores.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the inventory list. |
| [defaultInStockFlag](#defaultinstockflag): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the default in-stock flag of the inventory list. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the description of the inventory list. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDefaultInStockFlag](dw.catalog.ProductInventoryList.md#getdefaultinstockflag)() | Returns the default in-stock flag of the inventory list. |
| [getDescription](dw.catalog.ProductInventoryList.md#getdescription)() | Returns the description of the inventory list. |
| [getID](dw.catalog.ProductInventoryList.md#getid)() | Returns the ID of the inventory list. |
| [getRecord](dw.catalog.ProductInventoryList.md#getrecordproduct)([Product](dw.catalog.Product.md)) | Returns the inventory record for the specified product or null  if there is no record for the product in this list. |
| [getRecord](dw.catalog.ProductInventoryList.md#getrecordstring)([String](TopLevel.String.md)) | Returns the inventory record for the specified product ID or null  if there is no record for the product id in this list. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the inventory list.


---

### defaultInStockFlag
- defaultInStockFlag: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the default in-stock flag of the inventory list.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the description of the inventory list.


---

## Method Details

### getDefaultInStockFlag()
- getDefaultInStockFlag(): [Boolean](TopLevel.Boolean.md)
  - : Returns the default in-stock flag of the inventory list.

    **Returns:**
    - Default in-stock flag of inventory list.


---

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the description of the inventory list.

    **Returns:**
    - Description of inventory list.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the inventory list.

    **Returns:**
    - ID of inventory list.


---

### getRecord(Product)
- getRecord(product: [Product](dw.catalog.Product.md)): [ProductInventoryRecord](dw.catalog.ProductInventoryRecord.md)
  - : Returns the inventory record for the specified product or null
      if there is no record for the product in this list.


    **Parameters:**
    - product - The product to lookup inventory record.

    **Returns:**
    - Inventory record or `null` if not found.


---

### getRecord(String)
- getRecord(productID: [String](TopLevel.String.md)): [ProductInventoryRecord](dw.catalog.ProductInventoryRecord.md)
  - : Returns the inventory record for the specified product ID or null
      if there is no record for the product id in this list.


    **Parameters:**
    - productID - The product ID to lookup inventory record.

    **Returns:**
    - Inventory record or `null` if not found.


---

<!-- prettier-ignore-end -->
