<!-- prettier-ignore-start -->
# Class ProductInventoryRecord

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.ProductInventoryRecord](dw.catalog.ProductInventoryRecord.md)

The ProductInventoryRecord holds information about a Product's inventory, and availability.


When using Omnichannel Inventory (OCI):

- All ProductInventoryRecord properties are read-only. Calling any setter method throws an  IllegalStateException.
- The ProductInventoryRecord class does not support custom properties.
- [isPerpetual()](dw.catalog.ProductInventoryRecord.md#isperpetual)and [isPreorderable()](dw.catalog.ProductInventoryRecord.md#ispreorderable)always return false.



## Property Summary

| Property | Description |
| --- | --- |
| [ATS](#ats): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity of items available to sell (ATS). |
| [allocation](#allocation): [Quantity](dw.value.Quantity.md) | Returns the allocation quantity that is currently set. |
| [allocationResetDate](#allocationresetdate): [Date](TopLevel.Date.md) `(read-only)` | Returns the date the allocation quantity was initialized or reset. |
| [backorderable](#backorderable): [Boolean](TopLevel.Boolean.md) | Determines if the product is backorderable. |
| [custom](#custom): [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)` | Returns the custom attributes for this object. |
| [inStockDate](#instockdate): [Date](TopLevel.Date.md) | Returns the date that the item is expected to be in stock. |
| ~~[onHand](#onhand): [Quantity](dw.value.Quantity.md)~~ `(read-only)` | Returns the on-hand quantity, the actual quantity of available (on-hand) items. |
| [onOrder](#onorder): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity that is currently on order. |
| [perpetual](#perpetual): [Boolean](TopLevel.Boolean.md) | Determines if the product is perpetually in stock. |
| [preorderBackorderAllocation](#preorderbackorderallocation): [Quantity](dw.value.Quantity.md) | Returns the quantity of items that are allocated for sale, beyond the initial stock allocation. |
| [preorderable](#preorderable): [Boolean](TopLevel.Boolean.md) | Determines if the product is preorderable. |
| [reserved](#reserved): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity of items that are reserved. |
| [stockLevel](#stocklevel): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the current stock level. |
| [turnover](#turnover): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the sum of all inventory transactions (decrements and increments) recorded after the allocation reset  date. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [describe](dw.catalog.ProductInventoryRecord.md#describe)() | Returns the meta data of this object. |
| [getATS](dw.catalog.ProductInventoryRecord.md#getats)() | Returns the quantity of items available to sell (ATS). |
| [getAllocation](dw.catalog.ProductInventoryRecord.md#getallocation)() | Returns the allocation quantity that is currently set. |
| [getAllocationResetDate](dw.catalog.ProductInventoryRecord.md#getallocationresetdate)() | Returns the date the allocation quantity was initialized or reset. |
| [getCustom](dw.catalog.ProductInventoryRecord.md#getcustom)() | Returns the custom attributes for this object. |
| [getInStockDate](dw.catalog.ProductInventoryRecord.md#getinstockdate)() | Returns the date that the item is expected to be in stock. |
| ~~[getOnHand](dw.catalog.ProductInventoryRecord.md#getonhand)()~~ | Returns the on-hand quantity, the actual quantity of available (on-hand) items. |
| [getOnOrder](dw.catalog.ProductInventoryRecord.md#getonorder)() | Returns the quantity that is currently on order. |
| [getPreorderBackorderAllocation](dw.catalog.ProductInventoryRecord.md#getpreorderbackorderallocation)() | Returns the quantity of items that are allocated for sale, beyond the initial stock allocation. |
| [getReserved](dw.catalog.ProductInventoryRecord.md#getreserved)() | Returns the quantity of items that are reserved. |
| [getStockLevel](dw.catalog.ProductInventoryRecord.md#getstocklevel)() | Returns the current stock level. |
| [getTurnover](dw.catalog.ProductInventoryRecord.md#getturnover)() | Returns the sum of all inventory transactions (decrements and increments) recorded after the allocation reset  date. |
| [isBackorderable](dw.catalog.ProductInventoryRecord.md#isbackorderable)() | Determines if the product is backorderable. |
| [isPerpetual](dw.catalog.ProductInventoryRecord.md#isperpetual)() | Determines if the product is perpetually in stock. |
| [isPreorderable](dw.catalog.ProductInventoryRecord.md#ispreorderable)() | Determines if the product is preorderable. |
| [setAllocation](dw.catalog.ProductInventoryRecord.md#setallocationnumber)([Number](TopLevel.Number.md)) | Sets the allocation quantity. |
| [setAllocation](dw.catalog.ProductInventoryRecord.md#setallocationnumber-date)([Number](TopLevel.Number.md), [Date](TopLevel.Date.md)) | Sets the allocation quantity. |
| [setBackorderable](dw.catalog.ProductInventoryRecord.md#setbackorderableboolean)([Boolean](TopLevel.Boolean.md)) | The method is used to set whether the product is backorderable. |
| [setInStockDate](dw.catalog.ProductInventoryRecord.md#setinstockdatedate)([Date](TopLevel.Date.md)) | Sets the date that the item is expected to be in stock. |
| [setPerpetual](dw.catalog.ProductInventoryRecord.md#setperpetualboolean)([Boolean](TopLevel.Boolean.md)) | Sets if the product is perpetually in stock. |
| [setPreorderBackorderAllocation](dw.catalog.ProductInventoryRecord.md#setpreorderbackorderallocationnumber)([Number](TopLevel.Number.md)) | Sets the quantity of items that are allocated for sale, beyond the initial stock allocation. |
| [setPreorderable](dw.catalog.ProductInventoryRecord.md#setpreorderableboolean)([Boolean](TopLevel.Boolean.md)) | The method is used to set whether the product is preorderable. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ATS
- ATS: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity of items available to sell (ATS). This is calculated as the allocation
      ([getAllocation()](dw.catalog.ProductInventoryRecord.md#getallocation)) plus the preorderBackorderAllocation ([getPreorderBackorderAllocation()](dw.catalog.ProductInventoryRecord.md#getpreorderbackorderallocation)) minus
      the turnover ([getTurnover()](dw.catalog.ProductInventoryRecord.md#getturnover)) minus the on order quantity ([getOnOrder()](dw.catalog.ProductInventoryRecord.md#getonorder)).
      
      
      When using OCI, corresponds to the ATO (Available To Order) quantity in OCI.



---

### allocation
- allocation: [Quantity](dw.value.Quantity.md)
  - : Returns the allocation quantity that is currently set. The quantity unit is the same unit as the product itself.
      
      
      When using OCI, returns the physically available quantity. Corresponds to the On Hand quantity in OCI.



---

### allocationResetDate
- allocationResetDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date the allocation quantity was initialized or reset.
      
      
      When using OCI, corresponds to the Effective Date in OCI. The value can be null.



---

### backorderable
- backorderable: [Boolean](TopLevel.Boolean.md)
  - : Determines if the product is backorderable.
      
      
      When using OCI, returns true if the product has at least one Future quantity in OCI.



---

### custom
- custom: [CustomAttributes](dw.object.CustomAttributes.md) `(read-only)`
  - : Returns the custom attributes for this object. The returned object is used for retrieving and storing attribute
      values. See [CustomAttributes](dw.object.CustomAttributes.md) for a detailed example of the syntax for working with custom
      attributes.
      
      
      When using Omnichannel Inventory (OCI), this class doesn't support custom attributes. If OCI is enabled, then
      attempting to set or modify a custom attribute value throws an UnsupportedOperationException.



---

### inStockDate
- inStockDate: [Date](TopLevel.Date.md)
  - : Returns the date that the item is expected to be in stock.
      
      
      When using OCI, returns the date of the earliest Future quantity. If the product has no Future quantities, it
      returns null.



---

### onHand
- ~~onHand: [Quantity](dw.value.Quantity.md)~~ `(read-only)`
  - : Returns the on-hand quantity, the actual quantity of available (on-hand) items.

    **Deprecated:**
:::warning
Use [getStockLevel()](dw.catalog.ProductInventoryRecord.md#getstocklevel) instead.
:::
    **API Version:**
:::note
No longer available as of version 21.7.
:::

---

### onOrder
- onOrder: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity that is currently on order.
      
      
      This is only relevant when On Order Inventory is turned on for the related inventory list. On Order is a bucket
      of inventory used for the time between order creation and order export to external (warehouse) systems. On Order
      value is increased when an order is created. It will be decreased and with that turnover will be increased when
      the order is exported, see [getTurnover()](dw.catalog.ProductInventoryRecord.md#getturnover). Notice that [Order.setExportStatus(Number)](dw.order.Order.md#setexportstatusnumber) and
      [OrderItem.allocateInventory(Boolean)](dw.order.OrderItem.md#allocateinventoryboolean) will decrease the On Order value. On order will be included
      in the ATS calculation, see [getATS()](dw.catalog.ProductInventoryRecord.md#getats).
      
      
      
      
      When using OCI, always returns zero. OCI doesn't support On Order inventory.



---

### perpetual
- perpetual: [Boolean](TopLevel.Boolean.md)
  - : Determines if the product is perpetually in stock.
      
      
      When using OCI, always returns false.



---

### preorderBackorderAllocation
- preorderBackorderAllocation: [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of items that are allocated for sale, beyond the initial stock allocation.
      
      
      When using OCI, returns the sum of all Future quantities. If the product has no Future quantities, it returns
      zero.



---

### preorderable
- preorderable: [Boolean](TopLevel.Boolean.md)
  - : Determines if the product is preorderable.
      
      
      When using OCI, always returns false.



---

### reserved
- reserved: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity of items that are reserved.
      
      
      Note that for products with high velocity and concurrency, the return value is extremely volatile and the
      retrieval will be expensive.
      
      
      When using OCI, always returns zero.



---

### stockLevel
- stockLevel: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the current stock level. This is calculated as the allocation minus the turnover.
      
      
      When using OCI, corresponds to the ATF (Available To Fulfill) quantity in OCI.



---

### turnover
- turnover: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the sum of all inventory transactions (decrements and increments) recorded after the allocation reset
      date. If the total decremented quantity is greater than the total incremented quantity, then this value is
      negative.
      
      
      When using OCI, returns the total reserved quantity, including order, basket, and temporary reservations.



---

## Method Details

### describe()
- describe(): [ObjectTypeDefinition](dw.object.ObjectTypeDefinition.md)
  - : Returns the meta data of this object. If no meta data is available the method returns null. The returned
      ObjectTypeDefinition can be used to retrieve the metadata for any of the custom attributes.
      
      
      When using Omnichannel Inventory (OCI), this class doesn't support custom attributes. If OCI is enabled, then
      attempting to set or modify a custom attribute value throws an UnsupportedOperationException.


    **Returns:**
    - the meta data of this object. If no meta data is available the method returns null.


---

### getATS()
- getATS(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of items available to sell (ATS). This is calculated as the allocation
      ([getAllocation()](dw.catalog.ProductInventoryRecord.md#getallocation)) plus the preorderBackorderAllocation ([getPreorderBackorderAllocation()](dw.catalog.ProductInventoryRecord.md#getpreorderbackorderallocation)) minus
      the turnover ([getTurnover()](dw.catalog.ProductInventoryRecord.md#getturnover)) minus the on order quantity ([getOnOrder()](dw.catalog.ProductInventoryRecord.md#getonorder)).
      
      
      When using OCI, corresponds to the ATO (Available To Order) quantity in OCI.


    **Returns:**
    - the quantity or quantity N/A if not available.


---

### getAllocation()
- getAllocation(): [Quantity](dw.value.Quantity.md)
  - : Returns the allocation quantity that is currently set. The quantity unit is the same unit as the product itself.
      
      
      When using OCI, returns the physically available quantity. Corresponds to the On Hand quantity in OCI.


    **Returns:**
    - the allocation quantity or quantity N/A if not available.


---

### getAllocationResetDate()
- getAllocationResetDate(): [Date](TopLevel.Date.md)
  - : Returns the date the allocation quantity was initialized or reset.
      
      
      When using OCI, corresponds to the Effective Date in OCI. The value can be null.


    **Returns:**
    - the allocation reset date.


---

### getCustom()
- getCustom(): [CustomAttributes](dw.object.CustomAttributes.md)
  - : Returns the custom attributes for this object. The returned object is used for retrieving and storing attribute
      values. See [CustomAttributes](dw.object.CustomAttributes.md) for a detailed example of the syntax for working with custom
      attributes.
      
      
      When using Omnichannel Inventory (OCI), this class doesn't support custom attributes. If OCI is enabled, then
      attempting to set or modify a custom attribute value throws an UnsupportedOperationException.


    **Returns:**
    - the custom attributes for this object.


---

### getInStockDate()
- getInStockDate(): [Date](TopLevel.Date.md)
  - : Returns the date that the item is expected to be in stock.
      
      
      When using OCI, returns the date of the earliest Future quantity. If the product has no Future quantities, it
      returns null.


    **Returns:**
    - the date that the item is expected to be in stock.


---

### getOnHand()
- ~~getOnHand(): [Quantity](dw.value.Quantity.md)~~
  - : Returns the on-hand quantity, the actual quantity of available (on-hand) items.

    **Returns:**
    - the on-hand quantity or quantity N/A if not available.

    **Deprecated:**
:::warning
Use [getStockLevel()](dw.catalog.ProductInventoryRecord.md#getstocklevel) instead.
:::
    **API Version:**
:::note
No longer available as of version 21.7.
:::

---

### getOnOrder()
- getOnOrder(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity that is currently on order.
      
      
      This is only relevant when On Order Inventory is turned on for the related inventory list. On Order is a bucket
      of inventory used for the time between order creation and order export to external (warehouse) systems. On Order
      value is increased when an order is created. It will be decreased and with that turnover will be increased when
      the order is exported, see [getTurnover()](dw.catalog.ProductInventoryRecord.md#getturnover). Notice that [Order.setExportStatus(Number)](dw.order.Order.md#setexportstatusnumber) and
      [OrderItem.allocateInventory(Boolean)](dw.order.OrderItem.md#allocateinventoryboolean) will decrease the On Order value. On order will be included
      in the ATS calculation, see [getATS()](dw.catalog.ProductInventoryRecord.md#getats).
      
      
      
      
      When using OCI, always returns zero. OCI doesn't support On Order inventory.


    **Returns:**
    - the quantity or quantity N/A if not available.


---

### getPreorderBackorderAllocation()
- getPreorderBackorderAllocation(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of items that are allocated for sale, beyond the initial stock allocation.
      
      
      When using OCI, returns the sum of all Future quantities. If the product has no Future quantities, it returns
      zero.


    **Returns:**
    - the quantity or quantity N/A if not available.


---

### getReserved()
- getReserved(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of items that are reserved.
      
      
      Note that for products with high velocity and concurrency, the return value is extremely volatile and the
      retrieval will be expensive.
      
      
      When using OCI, always returns zero.


    **Returns:**
    - the quantity of items reserved for this product.


---

### getStockLevel()
- getStockLevel(): [Quantity](dw.value.Quantity.md)
  - : Returns the current stock level. This is calculated as the allocation minus the turnover.
      
      
      When using OCI, corresponds to the ATF (Available To Fulfill) quantity in OCI.


    **Returns:**
    - the stock level or quantity N/A if not available.


---

### getTurnover()
- getTurnover(): [Quantity](dw.value.Quantity.md)
  - : Returns the sum of all inventory transactions (decrements and increments) recorded after the allocation reset
      date. If the total decremented quantity is greater than the total incremented quantity, then this value is
      negative.
      
      
      When using OCI, returns the total reserved quantity, including order, basket, and temporary reservations.


    **Returns:**
    - the turnover or quantity N/A if not available.


---

### isBackorderable()
- isBackorderable(): [Boolean](TopLevel.Boolean.md)
  - : Determines if the product is backorderable.
      
      
      When using OCI, returns true if the product has at least one Future quantity in OCI.


    **Returns:**
    - true if the product is backorderable.


---

### isPerpetual()
- isPerpetual(): [Boolean](TopLevel.Boolean.md)
  - : Determines if the product is perpetually in stock.
      
      
      When using OCI, always returns false.


    **Returns:**
    - true if the product is perpetually in stock.


---

### isPreorderable()
- isPreorderable(): [Boolean](TopLevel.Boolean.md)
  - : Determines if the product is preorderable.
      
      
      When using OCI, always returns false.


    **Returns:**
    - true if the product is preorderable.


---

### setAllocation(Number)
- setAllocation(quantity: [Number](TopLevel.Number.md)): void
  - : Sets the allocation quantity. This also updates the allocation reset date. 
      
      All final reservations will be considered as expired and will therefore no longer be considered for ATS.
      
      
      When using OCI, throws an IllegalStateException.
      
      This method should **not** be called within a storefront request.


    **Parameters:**
    - quantity - the allocation quantity to set (must be greater than or equal to zero).

    **API Version:**
:::note
No longer available as of version 21.7.
:::

---

### setAllocation(Number, Date)
- setAllocation(quantity: [Number](TopLevel.Number.md), allocationResetDate: [Date](TopLevel.Date.md)): void
  - : Sets the allocation quantity. This also updates the allocation reset date.
      
      Any final reservations made prior to the allocation reset date will be considered as expired and will therefore
      no longer be considered for ATS.
      
      
      When using OCI, throws an IllegalStateException.
      
      This method must **not** be called within a storefront request.


    **Parameters:**
    - quantity - the allocation quantity to set (must be greater than or equal to zero).
    - allocationResetDate - the date allocation quantity was effectively calculated                          <li>the reset date must not be older than 48 hours</li>             <li>the reset date must not be older than the prior reset date. see             [getAllocationResetDate()](dw.catalog.ProductInventoryRecord.md#getallocationresetdate)</li>             </ul>


---

### setBackorderable(Boolean)
- setBackorderable(backorderableFlag: [Boolean](TopLevel.Boolean.md)): void
  - : The method is used to set whether the product is backorderable. Setting the backorderable flag to true will clear
      the preorderable flag. If the record's preorderable flag is set to true, calling this method with
      backorderableFlag==false will have no effect.
      
      
      When using OCI, throws an IllegalStateException. 
      
      This method should **not** be called within a storefront request.
      
      This method must **not** be called within a storefront request when the API version is 21.7 or later.


    **Parameters:**
    - backorderableFlag - the flag to set backorderable status.


---

### setInStockDate(Date)
- setInStockDate(inStockDate: [Date](TopLevel.Date.md)): void
  - : Sets the date that the item is expected to be in stock.
      
      
      When using OCI, throws an IllegalStateException. 
      
      This method should **not** be called within a storefront request.
      
      This method must **not** be called within a storefront request when the API version is 21.7 or later.


    **Parameters:**
    - inStockDate - the date that the item is expected to be in stock.


---

### setPerpetual(Boolean)
- setPerpetual(perpetualFlag: [Boolean](TopLevel.Boolean.md)): void
  - : Sets if the product is perpetually in stock.
      
      
      When using OCI, throws an IllegalStateException. 
      
      This method should **not** be called within a storefront request.
      
      This method must **not** be called within a storefront request when the API version is 21.7 or later.


    **Parameters:**
    - perpetualFlag - true to set the product perpetually in stock.


---

### setPreorderBackorderAllocation(Number)
- setPreorderBackorderAllocation(quantity: [Number](TopLevel.Number.md)): void
  - : Sets the quantity of items that are allocated for sale, beyond the initial stock allocation.
      
      
      When using OCI, throws an IllegalStateException.
      
      This method should **not** be called within a storefront request.
      
      This method must **not** be called within a storefront request when the API version is 21.7 or later.


    **Parameters:**
    - quantity - the quantity to set.


---

### setPreorderable(Boolean)
- setPreorderable(preorderableFlag: [Boolean](TopLevel.Boolean.md)): void
  - : The method is used to set whether the product is preorderable. Setting the preorderable flag to true will clear
      the backorderable flag. If the record's backorderable flag is set to true, calling this method with
      preorderableFlag==false will have no effect.
      
      
      When using OCI, throws an IllegalStateException. 
      
      This method should **not** be called within a storefront request.
      
      This method must **not** be called within a storefront request when the API version is 21.7 or later.


    **Parameters:**
    - preorderableFlag - the flag to set preorderable status.


---

<!-- prettier-ignore-end -->
