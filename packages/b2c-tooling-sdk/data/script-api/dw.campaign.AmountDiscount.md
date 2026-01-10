<!-- prettier-ignore-start -->
# Class AmountDiscount

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.Discount](dw.campaign.Discount.md)
    - [dw.campaign.AmountDiscount](dw.campaign.AmountDiscount.md)

Represents an _amount-off_ discount in the discount plan, for example
"$10 off all orders $100 or more".



## Property Summary

| Property | Description |
| --- | --- |
| [amount](#amount): [Number](TopLevel.Number.md) `(read-only)` | Returns the discount amount, for example 10.00 for a "$10 off" discount. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [AmountDiscount](#amountdiscountnumber)([Number](TopLevel.Number.md)) | Create an amount-discount on the fly. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAmount](dw.campaign.AmountDiscount.md#getamount)() | Returns the discount amount, for example 10.00 for a "$10 off" discount. |

### Methods inherited from class Discount

[getItemPromotionTiers](dw.campaign.Discount.md#getitempromotiontiers), [getPromotion](dw.campaign.Discount.md#getpromotion), [getPromotionTier](dw.campaign.Discount.md#getpromotiontier), [getQuantity](dw.campaign.Discount.md#getquantity), [getType](dw.campaign.Discount.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### amount
- amount: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the discount amount, for example 10.00 for a "$10 off" discount.


---

## Constructor Details

### AmountDiscount(Number)
- AmountDiscount(amount: [Number](TopLevel.Number.md))
  - : Create an amount-discount on the fly. Can be used to create a custom price adjustment.

    **Parameters:**
    - amount - amount off, e.g. 15.00 for a "15$ off" discount


---

## Method Details

### getAmount()
- getAmount(): [Number](TopLevel.Number.md)
  - : Returns the discount amount, for example 10.00 for a "$10 off" discount.

    **Returns:**
    - Discount amount


---

<!-- prettier-ignore-end -->
