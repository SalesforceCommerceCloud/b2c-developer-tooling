<!-- prettier-ignore-start -->
# Class Discount

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.Discount](dw.campaign.Discount.md)

Superclass of all specific discount classes.


## All Known Subclasses
[AmountDiscount](dw.campaign.AmountDiscount.md), [BonusChoiceDiscount](dw.campaign.BonusChoiceDiscount.md), [BonusDiscount](dw.campaign.BonusDiscount.md), [FixedPriceDiscount](dw.campaign.FixedPriceDiscount.md), [FixedPriceShippingDiscount](dw.campaign.FixedPriceShippingDiscount.md), [FreeDiscount](dw.campaign.FreeDiscount.md), [FreeShippingDiscount](dw.campaign.FreeShippingDiscount.md), [PercentageDiscount](dw.campaign.PercentageDiscount.md), [PercentageOptionDiscount](dw.campaign.PercentageOptionDiscount.md), [PriceBookPriceDiscount](dw.campaign.PriceBookPriceDiscount.md), [TotalFixedPriceDiscount](dw.campaign.TotalFixedPriceDiscount.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| [TYPE_AMOUNT](#type_amount): [String](TopLevel.String.md) = "AMOUNT" | Constant representing discounts of type _amount_. |
| [TYPE_BONUS](#type_bonus): [String](TopLevel.String.md) = "BONUS" | Constant representing discounts of type _bonus_. |
| [TYPE_BONUS_CHOICE](#type_bonus_choice): [String](TopLevel.String.md) = "BONUS_CHOICE" | Constant representing discounts of type _bonus choice_. |
| [TYPE_FIXED_PRICE](#type_fixed_price): [String](TopLevel.String.md) = "FIXED_PRICE" | Constant representing discounts of type _fixed-price_. |
| [TYPE_FIXED_PRICE_SHIPPING](#type_fixed_price_shipping): [String](TopLevel.String.md) = "FIXED_PRICE_SHIPPING" | Constant representing discounts of type _fixed price shipping_. |
| [TYPE_FREE](#type_free): [String](TopLevel.String.md) = "FREE" | Constant representing discounts of type _free_. |
| [TYPE_FREE_SHIPPING](#type_free_shipping): [String](TopLevel.String.md) = "FREE_SHIPPING" | Constant representing discounts of type _free shipping_. |
| [TYPE_PERCENTAGE](#type_percentage): [String](TopLevel.String.md) = "PERCENTAGE" | Constant representing discounts of type _percentage_. |
| [TYPE_PERCENTAGE_OFF_OPTIONS](#type_percentage_off_options): [String](TopLevel.String.md) = "PERCENTAGE_OFF_OPTIONS" | Constant representing discounts of type _percent off options_. |
| [TYPE_PRICEBOOK_PRICE](#type_pricebook_price): [String](TopLevel.String.md) = "PRICE_BOOK_PRICE" | Constant representing discounts of type _price book price_. |
| [TYPE_TOTAL_FIXED_PRICE](#type_total_fixed_price): [String](TopLevel.String.md) = "TOTAL_FIXED_PRICE" | Constant representing discounts of type _total fixed price_. |

## Property Summary

| Property | Description |
| --- | --- |
| [itemPromotionTiers](#itempromotiontiers): [Map](dw.util.Map.md) `(read-only)` | Returns the tier index by quantity Id of Product promotion. |
| [promotion](#promotion): [Promotion](dw.campaign.Promotion.md) `(read-only)` | Returns the promotion this discount is based on. |
| [promotionTier](#promotiontier): [Number](TopLevel.Number.md) `(read-only)` | Returns the tier index for promotion at order level or bonus product. |
| [quantity](#quantity): [Number](TopLevel.Number.md) `(read-only)` | Returns the quantity of the discount. |
| [type](#type): [String](TopLevel.String.md) `(read-only)` | Returns the type of the discount. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getItemPromotionTiers](dw.campaign.Discount.md#getitempromotiontiers)() | Returns the tier index by quantity Id of Product promotion. |
| [getPromotion](dw.campaign.Discount.md#getpromotion)() | Returns the promotion this discount is based on. |
| [getPromotionTier](dw.campaign.Discount.md#getpromotiontier)() | Returns the tier index for promotion at order level or bonus product. |
| [getQuantity](dw.campaign.Discount.md#getquantity)() | Returns the quantity of the discount. |
| [getType](dw.campaign.Discount.md#gettype)() | Returns the type of the discount. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TYPE_AMOUNT

- TYPE_AMOUNT: [String](TopLevel.String.md) = "AMOUNT"
  - : Constant representing discounts of type _amount_.


---

### TYPE_BONUS

- TYPE_BONUS: [String](TopLevel.String.md) = "BONUS"
  - : Constant representing discounts of type _bonus_.


---

### TYPE_BONUS_CHOICE

- TYPE_BONUS_CHOICE: [String](TopLevel.String.md) = "BONUS_CHOICE"
  - : Constant representing discounts of type _bonus choice_.


---

### TYPE_FIXED_PRICE

- TYPE_FIXED_PRICE: [String](TopLevel.String.md) = "FIXED_PRICE"
  - : Constant representing discounts of type _fixed-price_.


---

### TYPE_FIXED_PRICE_SHIPPING

- TYPE_FIXED_PRICE_SHIPPING: [String](TopLevel.String.md) = "FIXED_PRICE_SHIPPING"
  - : Constant representing discounts of type _fixed price shipping_.


---

### TYPE_FREE

- TYPE_FREE: [String](TopLevel.String.md) = "FREE"
  - : Constant representing discounts of type _free_.


---

### TYPE_FREE_SHIPPING

- TYPE_FREE_SHIPPING: [String](TopLevel.String.md) = "FREE_SHIPPING"
  - : Constant representing discounts of type _free shipping_.


---

### TYPE_PERCENTAGE

- TYPE_PERCENTAGE: [String](TopLevel.String.md) = "PERCENTAGE"
  - : Constant representing discounts of type _percentage_.


---

### TYPE_PERCENTAGE_OFF_OPTIONS

- TYPE_PERCENTAGE_OFF_OPTIONS: [String](TopLevel.String.md) = "PERCENTAGE_OFF_OPTIONS"
  - : Constant representing discounts of type _percent off options_.


---

### TYPE_PRICEBOOK_PRICE

- TYPE_PRICEBOOK_PRICE: [String](TopLevel.String.md) = "PRICE_BOOK_PRICE"
  - : Constant representing discounts of type _price book price_.


---

### TYPE_TOTAL_FIXED_PRICE

- TYPE_TOTAL_FIXED_PRICE: [String](TopLevel.String.md) = "TOTAL_FIXED_PRICE"
  - : Constant representing discounts of type _total fixed price_.


---

## Property Details

### itemPromotionTiers
- itemPromotionTiers: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the tier index by quantity Id of Product promotion. ProductLineItems may have more than one quantity, but
      not all items of that SKU may have received the same tier of promotion. Each quantity of the ProductLineItem is
      indexed from 1 to n, where n is the quantity of the ProductLineItem, and this method returns a mapping from that
      quantity index to the index of tier of the promotion that item received. For more information about tier indexes,
      see [getPromotionTier()](dw.campaign.Discount.md#getpromotiontier)  method.


    **See Also:**
    - [getPromotionTier()](dw.campaign.Discount.md#getpromotiontier)


---

### promotion
- promotion: [Promotion](dw.campaign.Promotion.md) `(read-only)`
  - : Returns the promotion this discount is based on.


---

### promotionTier
- promotionTier: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the tier index for promotion at order level or bonus product.
      Promotion tiers are always evaluated in the order of the highest threshold (e.g. quantity, or amount)
      to the lowest threshold. The tier that is evaluated first (i.e. the highest quantity or amount) is indexed as 0,
      the next tier 1, etc. The lowest tier will have index n - 1, where n is the total number of tiers.



---

### quantity
- quantity: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the quantity of the discount. This quantity specifies how often
      this discount applies to its target object. For example, a 10% off
      discount with quantity 2 associated to a product line item with
      quantity 3 is applied to two items of the product line item. 
      
      Discounts of order and shipping promotions, and bonus discounts
      have a fix quantity of 1.



---

### type
- type: [String](TopLevel.String.md) `(read-only)`
  - : Returns the type of the discount.


---

## Method Details

### getItemPromotionTiers()
- getItemPromotionTiers(): [Map](dw.util.Map.md)
  - : Returns the tier index by quantity Id of Product promotion. ProductLineItems may have more than one quantity, but
      not all items of that SKU may have received the same tier of promotion. Each quantity of the ProductLineItem is
      indexed from 1 to n, where n is the quantity of the ProductLineItem, and this method returns a mapping from that
      quantity index to the index of tier of the promotion that item received. For more information about tier indexes,
      see [getPromotionTier()](dw.campaign.Discount.md#getpromotiontier)  method.


    **Returns:**
    - Map of Tier index by quantity Id or `empty map`

    **See Also:**
    - [getPromotionTier()](dw.campaign.Discount.md#getpromotiontier)


---

### getPromotion()
- getPromotion(): [Promotion](dw.campaign.Promotion.md)
  - : Returns the promotion this discount is based on.

    **Returns:**
    - Promotion related to this discount


---

### getPromotionTier()
- getPromotionTier(): [Number](TopLevel.Number.md)
  - : Returns the tier index for promotion at order level or bonus product.
      Promotion tiers are always evaluated in the order of the highest threshold (e.g. quantity, or amount)
      to the lowest threshold. The tier that is evaluated first (i.e. the highest quantity or amount) is indexed as 0,
      the next tier 1, etc. The lowest tier will have index n - 1, where n is the total number of tiers.


    **Returns:**
    - Tier index or `null`


---

### getQuantity()
- getQuantity(): [Number](TopLevel.Number.md)
  - : Returns the quantity of the discount. This quantity specifies how often
      this discount applies to its target object. For example, a 10% off
      discount with quantity 2 associated to a product line item with
      quantity 3 is applied to two items of the product line item. 
      
      Discounts of order and shipping promotions, and bonus discounts
      have a fix quantity of 1.


    **Returns:**
    - Discount quantity


---

### getType()
- getType(): [String](TopLevel.String.md)
  - : Returns the type of the discount.

    **Returns:**
    - Discount type


---

<!-- prettier-ignore-end -->
