<!-- prettier-ignore-start -->
# Class DiscountPlan

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.DiscountPlan](dw.campaign.DiscountPlan.md)

DiscountPlan represents a set of [Discount](dw.campaign.Discount.md)s. Instances of the class are
returned by the [PromotionMgr](dw.campaign.PromotionMgr.md) when requesting applicable discounts
for a specified set of promotions and a line item container
(see [PromotionMgr.getDiscounts(LineItemCtnr, PromotionPlan)](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr-promotionplan)).


DiscountPlan provides methods to access the discounts contained in the plan,
add additional discounts to the plan (future) or remove discounts from the plan.


**See Also:**
- [PromotionMgr](dw.campaign.PromotionMgr.md)


## Property Summary

| Property | Description |
| --- | --- |
| [approachingOrderDiscounts](#approachingorderdiscounts): [Collection](dw.util.Collection.md) `(read-only)` | Get the collection of order discounts that the LineItemCtnr "almost"  qualifies for based on the merchandise total in the cart. |
| [bonusDiscounts](#bonusdiscounts): [Collection](dw.util.Collection.md) `(read-only)` | Returns all bonus discounts contained in the discount plan. |
| [lineItemCtnr](#lineitemctnr): [LineItemCtnr](dw.order.LineItemCtnr.md) `(read-only)` | Returns line item container associated with discount plan. |
| [orderDiscounts](#orderdiscounts): [Collection](dw.util.Collection.md) `(read-only)` | Returns the percentage and amount order discounts contained in the  discount plan. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getApproachingOrderDiscounts](dw.campaign.DiscountPlan.md#getapproachingorderdiscounts)() | Get the collection of order discounts that the LineItemCtnr "almost"  qualifies for based on the merchandise total in the cart. |
| [getApproachingShippingDiscounts](dw.campaign.DiscountPlan.md#getapproachingshippingdiscountsshipment)([Shipment](dw.order.Shipment.md)) | Get the collection of shipping discounts that the passed shipment  "almost" qualifies for based on the merchandise total in the shipment. |
| [getApproachingShippingDiscounts](dw.campaign.DiscountPlan.md#getapproachingshippingdiscountsshipment-shippingmethod)([Shipment](dw.order.Shipment.md), [ShippingMethod](dw.order.ShippingMethod.md)) | Get the collection of shipping discounts that the passed shipment  "almost" qualifies for based on the merchandise total in the shipment. |
| [getApproachingShippingDiscounts](dw.campaign.DiscountPlan.md#getapproachingshippingdiscountsshipment-collection)([Shipment](dw.order.Shipment.md), [Collection](dw.util.Collection.md)) | Get the collection of shipping discounts that the passed shipment  "almost" qualifies for based on the merchandise total in the shipment. |
| [getBonusDiscounts](dw.campaign.DiscountPlan.md#getbonusdiscounts)() | Returns all bonus discounts contained in the discount plan. |
| [getLineItemCtnr](dw.campaign.DiscountPlan.md#getlineitemctnr)() | Returns line item container associated with discount plan. |
| [getOrderDiscounts](dw.campaign.DiscountPlan.md#getorderdiscounts)() | Returns the percentage and amount order discounts contained in the  discount plan. |
| [getProductDiscounts](dw.campaign.DiscountPlan.md#getproductdiscountsproductlineitem)([ProductLineItem](dw.order.ProductLineItem.md)) | Returns the percentage, amount and fix price discounts associated  with the specified product line item. |
| [getProductShippingDiscounts](dw.campaign.DiscountPlan.md#getproductshippingdiscountsproductlineitem)([ProductLineItem](dw.order.ProductLineItem.md)) | Returns the product-shipping discounts associated with the specified  product line item. |
| [getShippingDiscounts](dw.campaign.DiscountPlan.md#getshippingdiscountsshipment)([Shipment](dw.order.Shipment.md)) | Returns the percentage, amount and fix price discounts associated with  the specified shipment. |
| [removeDiscount](dw.campaign.DiscountPlan.md#removediscountdiscount)([Discount](dw.campaign.Discount.md)) | Removes the specified discount from the discount plan. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### approachingOrderDiscounts
- approachingOrderDiscounts: [Collection](dw.util.Collection.md) `(read-only)`
  - : Get the collection of order discounts that the LineItemCtnr "almost"
      qualifies for based on the merchandise total in the cart. Nearness is
      controlled by thresholds configured at the promotion level.
      
      
      The collection of returned approaching discounts is ordered by the
      condition threshold of the promotion (e.g. "spend $100 and get 10% off"
      discount is returned before "spend $150 and get 15% off" discount.) A
      discount is not returned if it would be prevented from applying (because
      of compatibility rules) by an order discount already in the DiscountPlan
      or an approaching order discount with a lower condition threshold.



---

### bonusDiscounts
- bonusDiscounts: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all bonus discounts contained in the discount plan.


---

### lineItemCtnr
- lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md) `(read-only)`
  - : Returns line item container associated with discount plan. 
      
      A discount plan is created from and associated with a line item container.
      This method returns the line item container associated with this discount plan.



---

### orderDiscounts
- orderDiscounts: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the percentage and amount order discounts contained in the
      discount plan.



---

## Method Details

### getApproachingOrderDiscounts()
- getApproachingOrderDiscounts(): [Collection](dw.util.Collection.md)
  - : Get the collection of order discounts that the LineItemCtnr "almost"
      qualifies for based on the merchandise total in the cart. Nearness is
      controlled by thresholds configured at the promotion level.
      
      
      The collection of returned approaching discounts is ordered by the
      condition threshold of the promotion (e.g. "spend $100 and get 10% off"
      discount is returned before "spend $150 and get 15% off" discount.) A
      discount is not returned if it would be prevented from applying (because
      of compatibility rules) by an order discount already in the DiscountPlan
      or an approaching order discount with a lower condition threshold.


    **Returns:**
    - Collection of approaching order discounts ordered by the
              condition threshold of the promotion ascending.



---

### getApproachingShippingDiscounts(Shipment)
- getApproachingShippingDiscounts(shipment: [Shipment](dw.order.Shipment.md)): [Collection](dw.util.Collection.md)
  - : Get the collection of shipping discounts that the passed shipment
      "almost" qualifies for based on the merchandise total in the shipment.
      Nearness is controlled by thresholds configured at the promotion level.
      
      
      The collection of returned approaching discounts is ordered by the
      condition threshold of the promotion (e.g.
      "spend $100 and get free standard shipping" discount is returned before
      "spend $150 and get free standard shipping" discount.) A discount is not
      returned if it would be prevented from applying (because of compatibility
      rules) by a shipping discount already in the DiscountPlan or an
      approaching shipping discount with a lower condition threshold.


    **Parameters:**
    - shipment - The shipment to calculate approaching discounts for.

    **Returns:**
    - Collection of approaching shipping discounts ordered by the
              condition threshold of the promotion ascending.



---

### getApproachingShippingDiscounts(Shipment, ShippingMethod)
- getApproachingShippingDiscounts(shipment: [Shipment](dw.order.Shipment.md), shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md)): [Collection](dw.util.Collection.md)
  - : Get the collection of shipping discounts that the passed shipment
      "almost" qualifies for based on the merchandise total in the shipment.
      Here "almost" is controlled by thresholds configured at the promotion
      level.
      
      
      This method only returns discounts for shipping promotions which apply to
      the passed shipping method.
      
      
      The collection of returned approaching discounts is ordered by the
      condition threshold of the promotion (e.g.
      "spend $100 and get free standard shipping" discount is returned before
      "spend $150 and get free standard shipping" discount.) A discount is not
      returned if it would be prevented from applying (because of compatibility
      rules) by a shipping discount already in the DiscountPlan or an
      approaching shipping discount with a lower condition threshold.


    **Parameters:**
    - shipment - The shipment to calculate approaching discounts for.
    - shippingMethod - The shipping method to filter by.

    **Returns:**
    - Collection of approaching shipping discounts ordered by the
              condition threshold of the promotion, ascending.



---

### getApproachingShippingDiscounts(Shipment, Collection)
- getApproachingShippingDiscounts(shipment: [Shipment](dw.order.Shipment.md), shippingMethods: [Collection](dw.util.Collection.md)): [Collection](dw.util.Collection.md)
  - : Get the collection of shipping discounts that the passed shipment
      "almost" qualifies for based on the merchandise total in the shipment.
      Here "almost" is controlled by thresholds configured at the promotion
      level.
      
      
      This method only returns discounts for shipping promotions which apply to
      one of the passed shipping methods.
      
      
      The collection of returned approaching discounts is ordered by the
      condition threshold of the promotion (e.g.
      "spend $100 and get free standard shipping" discount is returned before
      "spend $150 and get free standard shipping" discount.) A discount is not
      returned if it would be prevented from applying (because of compatibility
      rules) by a shipping discount already in the DiscountPlan or an
      approaching shipping discount with a lower condition threshold.


    **Parameters:**
    - shipment - The shipment to calculate approaching discounts for.
    - shippingMethods - The shipping methods to filter by.

    **Returns:**
    - Collection of approaching shipping discounts ordered by the
              condition threshold of the promotion ascending.



---

### getBonusDiscounts()
- getBonusDiscounts(): [Collection](dw.util.Collection.md)
  - : Returns all bonus discounts contained in the discount plan.

    **Returns:**
    - All bonus discounts contained in discount plan


---

### getLineItemCtnr()
- getLineItemCtnr(): [LineItemCtnr](dw.order.LineItemCtnr.md)
  - : Returns line item container associated with discount plan. 
      
      A discount plan is created from and associated with a line item container.
      This method returns the line item container associated with this discount plan.


    **Returns:**
    - Line item container associated with plan


---

### getOrderDiscounts()
- getOrderDiscounts(): [Collection](dw.util.Collection.md)
  - : Returns the percentage and amount order discounts contained in the
      discount plan.


    **Returns:**
    - Order discounts contained in the discount plan


---

### getProductDiscounts(ProductLineItem)
- getProductDiscounts(productLineItem: [ProductLineItem](dw.order.ProductLineItem.md)): [Collection](dw.util.Collection.md)
  - : Returns the percentage, amount and fix price discounts associated
      with the specified product line item. If the specified product line
      item is not contained in the discount plan, an empty collection is
      returned.


    **Parameters:**
    - productLineItem - Product line item

    **Returns:**
    - Discounts associated with specified product line item


---

### getProductShippingDiscounts(ProductLineItem)
- getProductShippingDiscounts(productLineItem: [ProductLineItem](dw.order.ProductLineItem.md)): [Collection](dw.util.Collection.md)
  - : Returns the product-shipping discounts associated with the specified
      product line item. If the specified product line item is not contained in
      the discount plan, an empty collection is returned.


    **Parameters:**
    - productLineItem - Product line item

    **Returns:**
    - Product-shipping discounts associated with specified product line
              item



---

### getShippingDiscounts(Shipment)
- getShippingDiscounts(shipment: [Shipment](dw.order.Shipment.md)): [Collection](dw.util.Collection.md)
  - : Returns the percentage, amount and fix price discounts associated with
      the specified shipment. If the specified shipment is not contained in
      the discount plan, an empty collection is returned.


    **Parameters:**
    - shipment - the shipment for which to fetch discounts.

    **Returns:**
    - Discounts associated with specified shipment


---

### removeDiscount(Discount)
- removeDiscount(discount: [Discount](dw.campaign.Discount.md)): void
  - : Removes the specified discount from the discount plan. 
      
      
      This method should only be used for very simple discount scenarios. It
      is not recommended to use the method in case of stacked discounts
      (i.e. multiple order or product discounts), or complex discount types
      like Buy X Get Y or Total Fixed Price, since correct re-calculation of the
      discount plan based on the promotion rules is not guaranteed.


    **Parameters:**
    - discount - Discount to be removed


---

<!-- prettier-ignore-end -->
