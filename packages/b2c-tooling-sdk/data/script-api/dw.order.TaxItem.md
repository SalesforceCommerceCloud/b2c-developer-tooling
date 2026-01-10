<!-- prettier-ignore-start -->
# Class TaxItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.TaxItem](dw.order.TaxItem.md)

An item containing tax information allowing a tax breakdown between a number of [TaxGroup](dw.order.TaxGroup.md)s.


## Property Summary

| Property | Description |
| --- | --- |
| [amount](#amount): [Money](dw.value.Money.md) `(read-only)` | Gets the amount. |
| [taxGroup](#taxgroup): [TaxGroup](dw.order.TaxGroup.md) `(read-only)` | Returns the [tax group](dw.order.TaxGroup.md). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAmount](dw.order.TaxItem.md#getamount)() | Gets the amount. |
| [getTaxGroup](dw.order.TaxItem.md#gettaxgroup)() | Returns the [tax group](dw.order.TaxGroup.md). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### amount
- amount: [Money](dw.value.Money.md) `(read-only)`
  - : Gets the amount.


---

### taxGroup
- taxGroup: [TaxGroup](dw.order.TaxGroup.md) `(read-only)`
  - : Returns the [tax group](dw.order.TaxGroup.md).

    **See Also:**
    - [TaxGroup](dw.order.TaxGroup.md)


---

## Method Details

### getAmount()
- getAmount(): [Money](dw.value.Money.md)
  - : Gets the amount.

    **Returns:**
    - the amount


---

### getTaxGroup()
- getTaxGroup(): [TaxGroup](dw.order.TaxGroup.md)
  - : Returns the [tax group](dw.order.TaxGroup.md).

    **Returns:**
    - the tax rate

    **See Also:**
    - [TaxGroup](dw.order.TaxGroup.md)


---

<!-- prettier-ignore-end -->
