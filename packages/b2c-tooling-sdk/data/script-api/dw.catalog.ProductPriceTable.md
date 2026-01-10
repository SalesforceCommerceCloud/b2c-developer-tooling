<!-- prettier-ignore-start -->
# Class ProductPriceTable

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.catalog.ProductPriceTable](dw.catalog.ProductPriceTable.md)

A ProductPriceTable is a map of quantities to prices representing the
potentially tiered prices of a product in Commerce Cloud Digital. The price
of a product is the price associated with the largest quantity in
the ProductPriceTable which does not exceed the purchase quantity.



## Property Summary

| Property | Description |
| --- | --- |
| [quantities](#quantities): [Collection](dw.util.Collection.md) `(read-only)` | Returns all quantities stored in the price table. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getNextQuantity](dw.catalog.ProductPriceTable.md#getnextquantityquantity)([Quantity](dw.value.Quantity.md)) | Returns the quantity following the passed quantity in the price table. |
| [getPercentage](dw.catalog.ProductPriceTable.md#getpercentagequantity)([Quantity](dw.value.Quantity.md)) | Returns the percentage off value of the price related to the passed quantity,  calculated based on the price of the products minimum order quantity. |
| [getPrice](dw.catalog.ProductPriceTable.md#getpricequantity)([Quantity](dw.value.Quantity.md)) | Returns the monetary price for the passed order quantity. |
| [getPriceBook](dw.catalog.ProductPriceTable.md#getpricebookquantity)([Quantity](dw.value.Quantity.md)) | Returns the price book which defined the monetary price for the passed  order quantity. |
| [getQuantities](dw.catalog.ProductPriceTable.md#getquantities)() | Returns all quantities stored in the price table. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### quantities
- quantities: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all quantities stored in the price table.


---

## Method Details

### getNextQuantity(Quantity)
- getNextQuantity(quantity: [Quantity](dw.value.Quantity.md)): [Quantity](dw.value.Quantity.md)
  - : Returns the quantity following the passed quantity in the price table.
      If the passed quantity is the last entry in the price table, null is
      returned.


    **Parameters:**
    - quantity - the quantity to use to locate the next quantity in the price table.

    **Returns:**
    - the next quantity or null.


---

### getPercentage(Quantity)
- getPercentage(quantity: [Quantity](dw.value.Quantity.md)): [Number](TopLevel.Number.md)
  - : Returns the percentage off value of the price related to the passed quantity,
      calculated based on the price of the products minimum order quantity.


    **Parameters:**
    - quantity - the price quantity to compute the percentage off.

    **Returns:**
    - the percentage off value of the price related to the passed quantity.


---

### getPrice(Quantity)
- getPrice(quantity: [Quantity](dw.value.Quantity.md)): [Money](dw.value.Money.md)
  - : Returns the monetary price for the passed order quantity. If
      no price is defined for the passed quantity, null is returned. This
      can happen if for example no price is defined for a single item.


    **Parameters:**
    - quantity - the quantity to use to determine price.

    **Returns:**
    - price amount for the passed quantity


---

### getPriceBook(Quantity)
- getPriceBook(quantity: [Quantity](dw.value.Quantity.md)): [PriceBook](dw.catalog.PriceBook.md)
  - : Returns the price book which defined the monetary price for the passed
      order quantity. If no price is defined for the passed quantity, null is
      returned. This can happen if for example no price is defined for a single
      item.


    **Parameters:**
    - quantity - the quantity to use to determine price.

    **Returns:**
    - the price book defining this price, or null


---

### getQuantities()
- getQuantities(): [Collection](dw.util.Collection.md)
  - : Returns all quantities stored in the price table.

    **Returns:**
    - all price table quantities.


---

<!-- prettier-ignore-end -->
