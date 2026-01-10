<!-- prettier-ignore-start -->
# Class ProductListItemPurchase

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.customer.ProductListItemPurchase](dw.customer.ProductListItemPurchase.md)

A record of the purchase of an item contained in a product list.


## Property Summary

| Property | Description |
| --- | --- |
| [item](#item): [ProductListItem](dw.customer.ProductListItem.md) `(read-only)` | Returns the item that was purchased. |
| [orderNo](#orderno): [String](TopLevel.String.md) `(read-only)` | Returns the number of the order in which the  product list item was purchased. |
| [purchaseDate](#purchasedate): [Date](TopLevel.Date.md) `(read-only)` | Returns the date on which the product list item was purchased. |
| [purchaserName](#purchasername): [String](TopLevel.String.md) `(read-only)` | Returns the name of the purchaser of the product list item. |
| [quantity](#quantity): [Quantity](dw.value.Quantity.md) `(read-only)` | Returns the quantity of the product list item that was purchased. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getItem](dw.customer.ProductListItemPurchase.md#getitem)() | Returns the item that was purchased. |
| [getOrderNo](dw.customer.ProductListItemPurchase.md#getorderno)() | Returns the number of the order in which the  product list item was purchased. |
| [getPurchaseDate](dw.customer.ProductListItemPurchase.md#getpurchasedate)() | Returns the date on which the product list item was purchased. |
| [getPurchaserName](dw.customer.ProductListItemPurchase.md#getpurchasername)() | Returns the name of the purchaser of the product list item. |
| [getQuantity](dw.customer.ProductListItemPurchase.md#getquantity)() | Returns the quantity of the product list item that was purchased. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### item
- item: [ProductListItem](dw.customer.ProductListItem.md) `(read-only)`
  - : Returns the item that was purchased.


---

### orderNo
- orderNo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the number of the order in which the
      product list item was purchased.



---

### purchaseDate
- purchaseDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the date on which the product list item was purchased.


---

### purchaserName
- purchaserName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the purchaser of the product list item.


---

### quantity
- quantity: [Quantity](dw.value.Quantity.md) `(read-only)`
  - : Returns the quantity of the product list item that was purchased.


---

## Method Details

### getItem()
- getItem(): [ProductListItem](dw.customer.ProductListItem.md)
  - : Returns the item that was purchased.

    **Returns:**
    - the item that was purchased.


---

### getOrderNo()
- getOrderNo(): [String](TopLevel.String.md)
  - : Returns the number of the order in which the
      product list item was purchased.


    **Returns:**
    - the number of the order in which the
      product list item was purchased.



---

### getPurchaseDate()
- getPurchaseDate(): [Date](TopLevel.Date.md)
  - : Returns the date on which the product list item was purchased.

    **Returns:**
    - the date on which the product list item was purchased.


---

### getPurchaserName()
- getPurchaserName(): [String](TopLevel.String.md)
  - : Returns the name of the purchaser of the product list item.

    **Returns:**
    - the name of the purchaser of the product list item.


---

### getQuantity()
- getQuantity(): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity of the product list item that was purchased.

    **Returns:**
    - the quantity of the product list item that was purchased.


---

<!-- prettier-ignore-end -->
