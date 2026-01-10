<!-- prettier-ignore-start -->
# Class FixedPriceShippingDiscount

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.Discount](dw.campaign.Discount.md)
    - [dw.campaign.FixedPriceShippingDiscount](dw.campaign.FixedPriceShippingDiscount.md)

Represents a _fixed price shipping_ discount in the discount plan, for
example "Shipping only 0.99 for iPods."



## Property Summary

| Property | Description |
| --- | --- |
| [fixedPrice](#fixedprice): [Number](TopLevel.Number.md) `(read-only)` | Returns the fixed price amount, for example 0.99 for a "Shipping only $0.99"  discount. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [FixedPriceShippingDiscount](#fixedpriceshippingdiscountnumber)([Number](TopLevel.Number.md)) | Create a fixed-price-shipping-discount on the fly. |

## Method Summary

| Method | Description |
| --- | --- |
| [getFixedPrice](dw.campaign.FixedPriceShippingDiscount.md#getfixedprice)() | Returns the fixed price amount, for example 0.99 for a "Shipping only $0.99"  discount. |

### Methods inherited from class Discount

[getItemPromotionTiers](dw.campaign.Discount.md#getitempromotiontiers), [getPromotion](dw.campaign.Discount.md#getpromotion), [getPromotionTier](dw.campaign.Discount.md#getpromotiontier), [getQuantity](dw.campaign.Discount.md#getquantity), [getType](dw.campaign.Discount.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### fixedPrice
- fixedPrice: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the fixed price amount, for example 0.99 for a "Shipping only $0.99"
      discount.



---

## Constructor Details

### FixedPriceShippingDiscount(Number)
- FixedPriceShippingDiscount(amount: [Number](TopLevel.Number.md))
  - : Create a fixed-price-shipping-discount on the fly. Can be used to create a custom price adjustment.

    **Parameters:**
    - amount - fixed price for shipping e.g. 10.00


---

## Method Details

### getFixedPrice()
- getFixedPrice(): [Number](TopLevel.Number.md)
  - : Returns the fixed price amount, for example 0.99 for a "Shipping only $0.99"
      discount.


    **Returns:**
    - Fixed price amount


---

<!-- prettier-ignore-end -->
