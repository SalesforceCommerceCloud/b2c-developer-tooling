<!-- prettier-ignore-start -->
# Class ApproachingDiscount

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.ApproachingDiscount](dw.campaign.ApproachingDiscount.md)

Transient class representing a discount that a [LineItemCtnr](dw.order.LineItemCtnr.md)
"almost" qualifies for based on the amount of merchandise in it. Storefronts
can display information about approaching discounts to customers in order to
entice them to buy more merchandise.


Approaching discounts are calculated on the basis of a
[DiscountPlan](dw.campaign.DiscountPlan.md) instead of a LineItemCtnr itself. When one
of [PromotionMgr.getDiscounts(LineItemCtnr)](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr) or
[PromotionMgr.getDiscounts(LineItemCtnr, PromotionPlan)](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr-promotionplan) is
called, the promotions engine calculates the discounts the LineItemCtnr
receives based on the promotions in context, and also tries to determine the
discounts the LineItemCtnr would receive if additional merchandise were
added. DiscountPlan provides different methods to retrieve this approaching
discount info. Merchants can use these fine-grained methods to display
information about approaching order discounts on the cart page, and
approaching shipping discounts on the shipping method page during checkout,
for example.


The merchant may include or exclude individual promotions from being included
in this list, and define distance thresholds when configuring their
promotions.



## Property Summary

| Property | Description |
| --- | --- |
| [conditionThreshold](#conditionthreshold): [Money](dw.value.Money.md) `(read-only)` | The amount of merchandise required in the cart in order to receive the  discount. |
| [discount](#discount): [Discount](dw.campaign.Discount.md) `(read-only)` | The discount that the customer will receive if he adds more merchandise  to the cart. |
| [distanceFromConditionThreshold](#distancefromconditionthreshold): [Money](dw.value.Money.md) `(read-only)` | Convenience method that returns  `getConditionThreshold().subtract(getMerchandiseValue())` |
| [merchandiseTotal](#merchandisetotal): [Money](dw.value.Money.md) `(read-only)` | The amount of merchandise in the cart contributing towards the condition  threshold. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getConditionThreshold](dw.campaign.ApproachingDiscount.md#getconditionthreshold)() | The amount of merchandise required in the cart in order to receive the  discount. |
| [getDiscount](dw.campaign.ApproachingDiscount.md#getdiscount)() | The discount that the customer will receive if he adds more merchandise  to the cart. |
| [getDistanceFromConditionThreshold](dw.campaign.ApproachingDiscount.md#getdistancefromconditionthreshold)() | Convenience method that returns  `getConditionThreshold().subtract(getMerchandiseValue())` |
| [getMerchandiseTotal](dw.campaign.ApproachingDiscount.md#getmerchandisetotal)() | The amount of merchandise in the cart contributing towards the condition  threshold. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### conditionThreshold
- conditionThreshold: [Money](dw.value.Money.md) `(read-only)`
  - : The amount of merchandise required in the cart in order to receive the
      discount. For an order promotion "Get 15% off orders of $100 or more",
      the condition threshold is $100.00.



---

### discount
- discount: [Discount](dw.campaign.Discount.md) `(read-only)`
  - : The discount that the customer will receive if he adds more merchandise
      to the cart. For an order promotion "Get 15% off orders of $100 or more",
      the discount is a PercentageDiscount object.



---

### distanceFromConditionThreshold
- distanceFromConditionThreshold: [Money](dw.value.Money.md) `(read-only)`
  - : Convenience method that returns
      `getConditionThreshold().subtract(getMerchandiseValue())`



---

### merchandiseTotal
- merchandiseTotal: [Money](dw.value.Money.md) `(read-only)`
  - : The amount of merchandise in the cart contributing towards the condition
      threshold. This will always be less than the condition threshold.



---

## Method Details

### getConditionThreshold()
- getConditionThreshold(): [Money](dw.value.Money.md)
  - : The amount of merchandise required in the cart in order to receive the
      discount. For an order promotion "Get 15% off orders of $100 or more",
      the condition threshold is $100.00.


    **Returns:**
    - The amount of merchandise required in the cart in order to
              receive the discount.



---

### getDiscount()
- getDiscount(): [Discount](dw.campaign.Discount.md)
  - : The discount that the customer will receive if he adds more merchandise
      to the cart. For an order promotion "Get 15% off orders of $100 or more",
      the discount is a PercentageDiscount object.


    **Returns:**
    - The discount that the customer will receive if he adds more
              merchandise to the cart.



---

### getDistanceFromConditionThreshold()
- getDistanceFromConditionThreshold(): [Money](dw.value.Money.md)
  - : Convenience method that returns
      `getConditionThreshold().subtract(getMerchandiseValue())`


    **Returns:**
    - The amount of money needed to add to the order or shipment in
              order to receive the discount.



---

### getMerchandiseTotal()
- getMerchandiseTotal(): [Money](dw.value.Money.md)
  - : The amount of merchandise in the cart contributing towards the condition
      threshold. This will always be less than the condition threshold.


    **Returns:**
    - The amount of merchandise in the cart contributing towards the
              condition threshold.



---

<!-- prettier-ignore-end -->
