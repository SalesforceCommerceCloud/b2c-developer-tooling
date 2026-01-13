<!-- prettier-ignore-start -->
# Class CampaignMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.CampaignMgr](dw.campaign.CampaignMgr.md)

CampaignMgr provides static methods for managing campaign-specific operations
such as accessing promotions or updating promotion line items.


**Deprecated:**
:::warning
Use [PromotionMgr](dw.campaign.PromotionMgr.md) instead.
:::

## Property Summary

| Property | Description |
| --- | --- |
| ~~[applicablePromotions](#applicablepromotions): [Collection](dw.util.Collection.md)~~ `(read-only)` | Returns the enabled promotions of active campaigns applicable for the  current customer and source code. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~static [applyBonusPromotions](dw.campaign.CampaignMgr.md#applybonuspromotionslineitemctnr-collection)([LineItemCtnr](dw.order.LineItemCtnr.md), [Collection](dw.util.Collection.md))~~ | This method has been deprecated and should not be used anymore. |
| ~~static [applyOrderPromotions](dw.campaign.CampaignMgr.md#applyorderpromotionslineitemctnr-collection)([LineItemCtnr](dw.order.LineItemCtnr.md), [Collection](dw.util.Collection.md))~~ | Applies the applicable order promotions in the specified collection to the  specified line item container. |
| ~~static [applyProductPromotions](dw.campaign.CampaignMgr.md#applyproductpromotionslineitemctnr-collection)([LineItemCtnr](dw.order.LineItemCtnr.md), [Collection](dw.util.Collection.md))~~ | Applies all applicable product promotions in the specified collection to the  specified line item container. |
| ~~static [applyShippingPromotions](dw.campaign.CampaignMgr.md#applyshippingpromotionslineitemctnr-collection)([LineItemCtnr](dw.order.LineItemCtnr.md), [Collection](dw.util.Collection.md))~~ | Applies all applicable shipping promotions in the specified collection to  the specified line item container. |
| ~~static [getApplicableConditionalPromotions](dw.campaign.CampaignMgr.md#getapplicableconditionalpromotionsproduct)([Product](dw.catalog.Product.md))~~ | Returns the enabled promotions of active campaigns applicable for the  current customer and source code for which the specified product  is a qualifiying product. |
| ~~static [getApplicablePromotions](dw.campaign.CampaignMgr.md#getapplicablepromotions)()~~ | Returns the enabled promotions of active campaigns applicable for the  current customer and source code. |
| ~~static [getApplicablePromotions](dw.campaign.CampaignMgr.md#getapplicablepromotionsproduct)([Product](dw.catalog.Product.md))~~ | Returns the enabled promotions of active campaigns applicable for the  current customer and source code for which the specified product is  a discounted product. |
| ~~static [getApplicablePromotions](dw.campaign.CampaignMgr.md#getapplicablepromotionslineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md))~~ | Returns the enabled promotions of active campaigns applicable for the  current customer, source code and any coupon contained in the specified  line item container. |
| ~~static [getCampaignByID](dw.campaign.CampaignMgr.md#getcampaignbyidstring)([String](TopLevel.String.md))~~ | Returns the campaign identified by the specified ID. |
| ~~static [getConditionalPromotions](dw.campaign.CampaignMgr.md#getconditionalpromotionsproduct)([Product](dw.catalog.Product.md))~~ | Returns the enabled promotions of active campaigns for which the  specified product is a qualifiying product. |
| ~~static [getPromotion](dw.campaign.CampaignMgr.md#getpromotionstring)([String](TopLevel.String.md))~~ | Returns the promotion associated with the specified coupon code. |
| ~~static [getPromotionByCouponCode](dw.campaign.CampaignMgr.md#getpromotionbycouponcodestring)([String](TopLevel.String.md))~~ | Returns the promotion associated with the specified coupon code. |
| ~~static [getPromotionByID](dw.campaign.CampaignMgr.md#getpromotionbyidstring)([String](TopLevel.String.md))~~ | Returns the promotion identified by the specified ID. |
| ~~static [getPromotions](dw.campaign.CampaignMgr.md#getpromotionsproduct)([Product](dw.catalog.Product.md))~~ | Returns the enabled promotions of active campaigns for which the  specified product is a discounted product. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### applicablePromotions
- ~~applicablePromotions: [Collection](dw.util.Collection.md)~~ `(read-only)`
  - : Returns the enabled promotions of active campaigns applicable for the
      current customer and source code.
      
      
      Note that this method does not return any coupon-based promotions.


    **Deprecated:**
:::warning
Use [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
             [PromotionPlan.getPromotions()](dw.campaign.PromotionPlan.md#getpromotions)

:::

---

## Method Details

### applyBonusPromotions(LineItemCtnr, Collection)
- ~~static applyBonusPromotions(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md), promotions: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)~~
  - : This method has been deprecated and should not be used anymore.
      Instead, use [PromotionMgr](dw.campaign.PromotionMgr.md) to apply promotions to
      line item containers.
      
      
      The method does nothing, since bonus promotions  are applied as product
      or order promotions using methods
      [applyProductPromotions(LineItemCtnr, Collection)](dw.campaign.CampaignMgr.md#applyproductpromotionslineitemctnr-collection) and
      [applyOrderPromotions(LineItemCtnr, Collection)](dw.campaign.CampaignMgr.md#applyorderpromotionslineitemctnr-collection).
      
      
      The method returns 'true' if any the line item container contains
      any bonus product line items, and otherwise false.


    **Parameters:**
    - lineItemCtnr - Basket or order
    - promotions - Parameter not used, can be null

    **Returns:**
    - True if line item container contains bonus product line items, else false

    **Deprecated:**
:::warning
Use [PromotionMgr](dw.campaign.PromotionMgr.md) instead.
:::

---

### applyOrderPromotions(LineItemCtnr, Collection)
- ~~static applyOrderPromotions(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md), promotions: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Applies the applicable order promotions in the specified collection to the
      specified line item container.
      
      
      This method has been deprecated and should not be used anymore.
      Instead, use [PromotionMgr](dw.campaign.PromotionMgr.md) to apply promotions to
      line item containers.
      
      
      Note that the method does also apply any bonus discounts defined
      as order promotions (see also [applyBonusPromotions(LineItemCtnr, Collection)](dw.campaign.CampaignMgr.md#applybonuspromotionslineitemctnr-collection)).


    **Parameters:**
    - lineItemCtnr - basket or order
    - promotions - list of all promotions to be applied

    **Returns:**
    - true if changes were made to the line item container, false otherwise.

    **Deprecated:**
:::warning
Use [PromotionMgr](dw.campaign.PromotionMgr.md)
:::

---

### applyProductPromotions(LineItemCtnr, Collection)
- ~~static applyProductPromotions(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md), promotions: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Applies all applicable product promotions in the specified collection to the
      specified line item container.
      
      
      This method has been deprecated and should not be used anymore.
      Instead, use [PromotionMgr](dw.campaign.PromotionMgr.md) to apply promotions to
      line item containers.
      
      
      Note that the method does also apply any bonus discounts defined
      as product promotions (see also [applyBonusPromotions(LineItemCtnr, Collection)](dw.campaign.CampaignMgr.md#applybonuspromotionslineitemctnr-collection)).


    **Parameters:**
    - lineItemCtnr - basket or order
    - promotions - list of all promotions to be applied

    **Returns:**
    - true if changes were made to the line item container, false otherwise.

    **Deprecated:**
:::warning
Use [PromotionMgr](dw.campaign.PromotionMgr.md)
:::

---

### applyShippingPromotions(LineItemCtnr, Collection)
- ~~static applyShippingPromotions(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md), promotions: [Collection](dw.util.Collection.md)): [Boolean](TopLevel.Boolean.md)~~
  - : Applies all applicable shipping promotions in the specified collection to
      the specified line item container.
      
      
      This method has been deprecated and should not be used anymore.
      Instead, use [PromotionMgr](dw.campaign.PromotionMgr.md) to apply promotions to
      line item containers.


    **Parameters:**
    - lineItemCtnr - basket or order
    - promotions - list of all promotions to be applied

    **Returns:**
    - true if changes were made to the line item container, false otherwise.

    **Deprecated:**
:::warning
Use [PromotionMgr](dw.campaign.PromotionMgr.md)
:::

---

### getApplicableConditionalPromotions(Product)
- ~~static getApplicableConditionalPromotions(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the enabled promotions of active campaigns applicable for the
      current customer and source code for which the specified product
      is a qualifiying product.
      
      
      As a replacement of this deprecated method, use
      [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct).
      Unlike [getApplicableConditionalPromotions(Product)](dw.campaign.CampaignMgr.md#getapplicableconditionalpromotionsproduct),
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)
      returns all promotions related to the specified product, regardless
      of whether the product is qualifying, discounted, or both, and
      also returns promotions where the product is a bonus product.


    **Parameters:**
    - product - Qualifying product

    **Returns:**
    - List of active promotions

    **Deprecated:**
:::warning
Use [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
                 [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)

:::

---

### getApplicablePromotions()
- ~~static getApplicablePromotions(): [Collection](dw.util.Collection.md)~~
  - : Returns the enabled promotions of active campaigns applicable for the
      current customer and source code.
      
      
      Note that this method does not return any coupon-based promotions.


    **Returns:**
    - List of active promotions

    **Deprecated:**
:::warning
Use [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
             [PromotionPlan.getPromotions()](dw.campaign.PromotionPlan.md#getpromotions)

:::

---

### getApplicablePromotions(Product)
- ~~static getApplicablePromotions(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the enabled promotions of active campaigns applicable for the
      current customer and source code for which the specified product is
      a discounted product.
      
      
      Note that this method does not return any coupon-based promotions.
      
      
      As a replacement of this deprecated method, use
      [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct).
      Unlike [getApplicablePromotions(Product)](dw.campaign.CampaignMgr.md#getapplicablepromotionsproduct),
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)
      returns all promotions related to the specified product, regardless
      of whether the product is qualifying, discounted, or both, and
      also returns promotions where the product is a bonus product.


    **Parameters:**
    - product - The product whose promotions are returned.

    **Returns:**
    - A list of promotions

    **Deprecated:**
:::warning
Use [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
                 [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)

:::

---

### getApplicablePromotions(LineItemCtnr)
- ~~static getApplicablePromotions(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the enabled promotions of active campaigns applicable for the
      current customer, source code and any coupon contained in the specified
      line item container.
      
      
      Note that although the method has been deprecated, no replacement
      method is provided.


    **Parameters:**
    - lineItemCtnr - the basket or order

    **Returns:**
    - list of all applicable promotion for the given basket or order

    **Deprecated:**
:::warning
There is no replacement for this method.
:::

---

### getCampaignByID(String)
- ~~static getCampaignByID(id: [String](TopLevel.String.md)): [Campaign](dw.campaign.Campaign.md)~~
  - : Returns the campaign identified by the specified ID.

    **Parameters:**
    - id - Campaign ID

    **Returns:**
    - Campaign or null if not found

    **Deprecated:**
:::warning
Use [PromotionMgr.getCampaign(String)](dw.campaign.PromotionMgr.md#getcampaignstring)
:::

---

### getConditionalPromotions(Product)
- ~~static getConditionalPromotions(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the enabled promotions of active campaigns for which the
      specified product is a qualifiying product. 
      
      Note that the method also returns coupon-based promotions.
      
      
      As a replacement of this deprecated method, use
      [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct).
      Unlike [getConditionalPromotions(Product)](dw.campaign.CampaignMgr.md#getconditionalpromotionsproduct),
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)
      returns all promotions related to the specified product, regardless
      of whether the product is qualifying, discounted, or both, and
      also returns promotions where the product is a bonus product.


    **Parameters:**
    - product - The product whose conditional promotions are returned.

    **Returns:**
    - A list of promotions

    **Deprecated:**
:::warning
Use [PromotionMgr.getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions) and
                 [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)

:::

---

### getPromotion(String)
- ~~static getPromotion(couponCode: [String](TopLevel.String.md)): [Promotion](dw.campaign.Promotion.md)~~
  - : Returns the promotion associated with the specified coupon code.

    **Parameters:**
    - couponCode - The coupon code used to lookup the promotion

    **Returns:**
    - The resolved promotion object or null if none was found

    **Deprecated:**
:::warning
Coupons are now related to multiple promotions. Method
                  returns the first promotion associated with the coupon
                  code in case of multiple assigned promotions.

:::

---

### getPromotionByCouponCode(String)
- ~~static getPromotionByCouponCode(couponCode: [String](TopLevel.String.md)): [Promotion](dw.campaign.Promotion.md)~~
  - : Returns the promotion associated with the specified coupon code.

    **Parameters:**
    - couponCode - Coupon code

    **Returns:**
    - The associated promotion or null

    **Deprecated:**
:::warning
Coupons are now related to multiple promotions. Method
                  returns the first promotion associated with the coupon
                  in case of multiple assigned promotions

:::

---

### getPromotionByID(String)
- ~~static getPromotionByID(id: [String](TopLevel.String.md)): [Promotion](dw.campaign.Promotion.md)~~
  - : Returns the promotion identified by the specified ID.

    **Parameters:**
    - id - Promotion ID

    **Returns:**
    - Promotion or null if not found

    **Deprecated:**
:::warning
Use [PromotionMgr.getPromotion(String)](dw.campaign.PromotionMgr.md#getpromotionstring)
:::

---

### getPromotions(Product)
- ~~static getPromotions(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the enabled promotions of active campaigns for which the
      specified product is a discounted product. 
      
      Note that method does only return promotions based on customer groups
      or source codes.
      
      
      As a replacement of this deprecated method, use
      [PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct).
      Unlike [getPromotions(Product)](dw.campaign.CampaignMgr.md#getpromotionsproduct),
      [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)
      returns all promotions related to the specified product, regardless
      of whether the product is qualifying, discounted, or both, and
      also returns promotions where the product is a bonus product.


    **Parameters:**
    - product - Discounted product

    **Returns:**
    - List of promotions

    **Deprecated:**
:::warning
Use [PromotionMgr.getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions) and
                 [PromotionPlan.getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)

:::

---

<!-- prettier-ignore-end -->
