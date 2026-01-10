<!-- prettier-ignore-start -->
# Class PromotionMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.PromotionMgr](dw.campaign.PromotionMgr.md)

[PromotionMgr](dw.campaign.PromotionMgr.md) is used to access campaigns and promotion
definitions, display active or upcoming promotions in a storefront, and to
calculate and apply promotional discounts to line item containers.


To access campaign and promotion definitions, use methods
[getCampaigns()](dw.campaign.PromotionMgr.md#getcampaigns), [getCampaign(String)](dw.campaign.PromotionMgr.md#getcampaignstring),
[getPromotions()](dw.campaign.PromotionMgr.md#getpromotions) and [getPromotion(String)](dw.campaign.PromotionMgr.md#getpromotionstring).


To display active or upcoming promotions in the storefront, e.g. on product
pages, various methods are provided. [getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions) returns
a [PromotionPlan](dw.campaign.PromotionPlan.md) with all enabled promotions scheduled for _now_.
[getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) returns a [PromotionPlan](dw.campaign.PromotionPlan.md) with
all enabled promotions scheduled for _now_ and applicable for the
session currency, current customer and active source code.
[getUpcomingPromotions(Number)](dw.campaign.PromotionMgr.md#getupcomingpromotionsnumber) returns a [PromotionPlan](dw.campaign.PromotionPlan.md) with all
promotions that are enabled, not scheduled for _now_, but scheduled for
any time between _now_ and _now + previewTime(hours)_.


Applying promotions to line item containers is a 3-step process, and
[PromotionMgr](dw.campaign.PromotionMgr.md) provides methods supporting each of these steps.
Convenience methods can be used that execute all three steps at once,
or the steps can be executed individually if you need to customize
the output of the steps due to specific business rules. 


- Step 1 - calculate active customer promotions: Determine the active  promotions for the session currency, current customer, source code and redeemed coupons.
- Step 2 - calculate applicable discounts: Based on the active promotions  determined in step 1, applicable discounts are calculated.
- Step 3 - apply discounts: applicable discounts are applied to a line  item container by creating price adjustment line items.



The simpliest way to execute steps 1-3 is to use method
[applyDiscounts(LineItemCtnr)](dw.campaign.PromotionMgr.md#applydiscountslineitemctnr). The method identifies all active
customer promotions, calculates and applies applicable discounts.


Due to specific business rules it might be necessary to manipulate
the set of applicable discounts calculated by the promotion engine
before applying them to the line item container. To implement such a scenario,
you want to use method [getDiscounts(LineItemCtnr)](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr), which
identifies all active customer promotions, and calculates and returns
applicable discounts in an instance of [DiscountPlan](dw.campaign.DiscountPlan.md). The discount
plan contains a description for all applicable discounts for the specified line
item container, and you can remove discounts from it if necessary.
The customized discount plan can then be passed on for application by
using method [applyDiscounts(DiscountPlan)](dw.campaign.PromotionMgr.md#applydiscountsdiscountplan).


Due to specific business rules it might be necessary to manipulate the
set of active customer promotions before calculating applicable discounts
from it. For example, you might want to add promotions to the
plan or remove promotions from it.
You want to use method [getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
[getActiveCustomerPromotions(Boolean)](dw.campaign.PromotionMgr.md#getactivecustomerpromotionsboolean), which
identifies all active customer promotions and returns an instance of
[PromotionPlan](dw.campaign.PromotionPlan.md). You can add promotions to the promotion plan
or remove promotions from the plan. The customized promotion plan can then be
passed on to calculate applicable discounts by using method
[getDiscounts(LineItemCtnr, PromotionPlan)](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr-promotionplan).



## Property Summary

| Property | Description |
| --- | --- |
| [activeCustomerPromotions](#activecustomerpromotions): [PromotionPlan](dw.campaign.PromotionPlan.md) `(read-only)` | Returns all promotions scheduled for _now_ and applicable for the  session currency, current customer, source code, or presented coupons.<br/>   The active promotions are returned in an instance of  [PromotionPlan](dw.campaign.PromotionPlan.md). |
| [activePromotions](#activepromotions): [PromotionPlan](dw.campaign.PromotionPlan.md) `(read-only)` | Returns all promotions scheduled for _now_, and applicable for the  session currency but regardless of current customer or source code.<br/>  The active promotions are returned in an instance of [PromotionPlan](dw.campaign.PromotionPlan.md). |
| [campaigns](#campaigns): [Collection](dw.util.Collection.md) `(read-only)` | Returns all campaigns of the current site in no specific order. |
| [promotions](#promotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns all promotions of the current site in no specific order. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [applyDiscounts](dw.campaign.PromotionMgr.md#applydiscountsdiscountplan)([DiscountPlan](dw.campaign.DiscountPlan.md)) | Applies the discounts contained in the specified discount plan  to the line item container associated with the discount  plan. |
| static [applyDiscounts](dw.campaign.PromotionMgr.md#applydiscountslineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | Identifies active promotions, calculates the applicable  discounts from these promotions and applies these discounts to the  specified line item container. |
| static [getActiveCustomerPromotions](dw.campaign.PromotionMgr.md#getactivecustomerpromotions)() | Returns all promotions scheduled for _now_ and applicable for the  session currency, current customer, source code, or presented coupons.<br/>   The active promotions are returned in an instance of  [PromotionPlan](dw.campaign.PromotionPlan.md). |
| static [getActiveCustomerPromotions](dw.campaign.PromotionMgr.md#getactivecustomerpromotionsboolean)([Boolean](TopLevel.Boolean.md)) | Returns all promotions scheduled for _now_ and applicable for the  session currency, current customer, source code, or presented coupons. |
| static [getActiveCustomerPromotionsForCampaign](dw.campaign.PromotionMgr.md#getactivecustomerpromotionsforcampaigncampaign-date-date)([Campaign](dw.campaign.Campaign.md), [Date](TopLevel.Date.md), [Date](TopLevel.Date.md)) | Returns all promotions assigned to the passed campaign, which are active  at some point within the specified date range, and are applicable for the  current customer, source code, or presented coupons. |
| static [getActivePromotions](dw.campaign.PromotionMgr.md#getactivepromotions)() | Returns all promotions scheduled for _now_, and applicable for the  session currency but regardless of current customer or source code.<br/>  The active promotions are returned in an instance of [PromotionPlan](dw.campaign.PromotionPlan.md). |
| static [getActivePromotionsForCampaign](dw.campaign.PromotionMgr.md#getactivepromotionsforcampaigncampaign-date-date)([Campaign](dw.campaign.Campaign.md), [Date](TopLevel.Date.md), [Date](TopLevel.Date.md)) | Returns all promotions assigned to the passed campaign which are active  at some point within the specified date range. |
| static [getCampaign](dw.campaign.PromotionMgr.md#getcampaignstring)([String](TopLevel.String.md)) | Returns the campaign identified by the specified ID. |
| static [getCampaigns](dw.campaign.PromotionMgr.md#getcampaigns)() | Returns all campaigns of the current site in no specific order. |
| static [getDiscounts](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | Returns the discounts applicable for the current customer, active  source code and specified line item container. |
| static [getDiscounts](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr-promotionplan)([LineItemCtnr](dw.order.LineItemCtnr.md), [PromotionPlan](dw.campaign.PromotionPlan.md)) | Returns the discounts applicable for the current customer, active  source code and specified line item container, based on the specified  promotion plan. |
| static [getPromotion](dw.campaign.PromotionMgr.md#getpromotionstring)([String](TopLevel.String.md)) | Returns the promotion identified by the specified ID. |
| static [getPromotions](dw.campaign.PromotionMgr.md#getpromotions)() | Returns all promotions of the current site in no specific order. |
| static [getUpcomingCustomerPromotions](dw.campaign.PromotionMgr.md#getupcomingcustomerpromotionsnumber)([Number](TopLevel.Number.md)) | Returns all promotions currently inactive, but scheduled  for any time between _now_ and _now + previewTime(hours)_,  and which are applicable based on the current customer, source code, and  coupons in the current basket.<br/>  The parameter _previewTime_ specifies for how many hours promotions  should be previewed. |
| static [getUpcomingPromotions](dw.campaign.PromotionMgr.md#getupcomingpromotionsnumber)([Number](TopLevel.Number.md)) | Returns all promotions currently inactive, but scheduled  for any time between _now_ and _now + previewTime(hours)_. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### activeCustomerPromotions
- activeCustomerPromotions: [PromotionPlan](dw.campaign.PromotionPlan.md) `(read-only)`
  - : Returns all promotions scheduled for _now_ and applicable for the
      session currency, current customer, source code, or presented coupons.
      
      
      The active promotions are returned in an instance of
      [PromotionPlan](dw.campaign.PromotionPlan.md). The promotion plan contains all
      promotions assigned to any customer group of the current customer, the
      current source code, or coupons in the current session basket.


    **See Also:**
    - [getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions)


---

### activePromotions
- activePromotions: [PromotionPlan](dw.campaign.PromotionPlan.md) `(read-only)`
  - : Returns all promotions scheduled for _now_, and applicable for the
      session currency but regardless of current customer or source code.
      
      The active promotions are returned in an instance of [PromotionPlan](dw.campaign.PromotionPlan.md).


    **See Also:**
    - [getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions)


---

### campaigns
- campaigns: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all campaigns of the current site in no specific order.


---

### promotions
- promotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all promotions of the current site in no specific order.


---

## Method Details

### applyDiscounts(DiscountPlan)
- static applyDiscounts(discountPlan: [DiscountPlan](dw.campaign.DiscountPlan.md)): void
  - : Applies the discounts contained in the specified discount plan
      to the line item container associated with the discount
      plan. 
      
      
      
      As a result of this method, the specified line item container
      contains price adjustments and/or bonus product line items for
      all discounts contained in the specified discount plan.
      The method also removes price adjustment and/or bonus product line items
      from the line item container if the specified discount plan does not
      contain the related discount.
      
      
      _Note that the method does not evaluate if the discounts in the specified
       discount plan are applicable nor that the promotions related to these
       discounts are active._


    **Parameters:**
    - discountPlan - Discount plan to apply to associated line item container

    **See Also:**
    - [getDiscounts(LineItemCtnr)](dw.campaign.PromotionMgr.md#getdiscountslineitemctnr)
    - [applyDiscounts(LineItemCtnr)](dw.campaign.PromotionMgr.md#applydiscountslineitemctnr)


---

### applyDiscounts(LineItemCtnr)
- static applyDiscounts(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): void
  - : Identifies active promotions, calculates the applicable
      discounts from these promotions and applies these discounts to the
      specified line item container.
      
      
      As a result of this method, the specified line item container
      contains price adjustments and/or bonus product line items for
      all applicable discounts. The method also removes price
      adjustment and/or bonus product line items from the line item
      container if the related to promotions/discounts are no longer
      applicable.


    **Parameters:**
    - lineItemCtnr - Line item ctnr to apply promotions on


---

### getActiveCustomerPromotions()
- static getActiveCustomerPromotions(): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions scheduled for _now_ and applicable for the
      session currency, current customer, source code, or presented coupons.
      
      
      The active promotions are returned in an instance of
      [PromotionPlan](dw.campaign.PromotionPlan.md). The promotion plan contains all
      promotions assigned to any customer group of the current customer, the
      current source code, or coupons in the current session basket.


    **Returns:**
    - [PromotionPlan](dw.campaign.PromotionPlan.md) with active customer promotions

    **See Also:**
    - [getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions)


---

### getActiveCustomerPromotions(Boolean)
- static getActiveCustomerPromotions(ignoreCouponCondition: [Boolean](TopLevel.Boolean.md)): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions scheduled for _now_ and applicable for the
      session currency, current customer, source code, or presented coupons. 
      
      
      The active promotions are returned in an instance of
      [PromotionPlan](dw.campaign.PromotionPlan.md). The promotion plan contains all
      promotions assigned to any customer group of the current customer, the
      current source code, or coupons in the current session basket.


    **Parameters:**
    - ignoreCouponCondition - true if coupon condition will be ignored when get active promotions.

    **Returns:**
    - [PromotionPlan](dw.campaign.PromotionPlan.md) with active customer promotions


---

### getActiveCustomerPromotionsForCampaign(Campaign, Date, Date)
- static getActiveCustomerPromotionsForCampaign(campaign: [Campaign](dw.campaign.Campaign.md), from: [Date](TopLevel.Date.md), to: [Date](TopLevel.Date.md)): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions assigned to the passed campaign, which are active
      at some point within the specified date range, and are applicable for the
      current customer, source code, or presented coupons. A promotion must be
      active for an actual time period within the passed date range, and not
      just a single point.
      
      
      The passed campaign and dates must not be null or an exception is thrown.
      It is valid for the from and to dates to be in the past. If an invalid
      time range is specified (i.e. from is after to), the returned
      PromotionPlan will be empty.


    **Parameters:**
    - campaign - The campaign, must not be null or an exception is thrown.
    - from - The start of the date range to consider. If null, this             signifies an open ended time period.
    - to - The end of the date range to consider. If null, this signifies             an open ended time period.

    **Returns:**
    - PromotionPlan with promotions matching all the criteria.


---

### getActivePromotions()
- static getActivePromotions(): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions scheduled for _now_, and applicable for the
      session currency but regardless of current customer or source code.
      
      The active promotions are returned in an instance of [PromotionPlan](dw.campaign.PromotionPlan.md).


    **Returns:**
    - [PromotionPlan](dw.campaign.PromotionPlan.md) with active promotions

    **See Also:**
    - [getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions)


---

### getActivePromotionsForCampaign(Campaign, Date, Date)
- static getActivePromotionsForCampaign(campaign: [Campaign](dw.campaign.Campaign.md), from: [Date](TopLevel.Date.md), to: [Date](TopLevel.Date.md)): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions assigned to the passed campaign which are active
      at some point within the specified date range. A promotion must be active
      for an actual time period within the passed date range, and not just a
      single point. A promotion must be applicable for the session currency.
      
      
      This method considers only the enabled flags and time conditions of the
      promotion and campaign. It does not consider whether the current customer
      satisfies the qualifiers of the promotion (customer group, source code,
      or coupon).
      
      
      The passed campaign and dates must not be null or an exception is thrown.
      It is valid for the from and/or to dates to be in the past. If an invalid
      time range is specified (i.e. from is after to), the returned
      PromotionPlan will be empty.


    **Parameters:**
    - campaign - The campaign. Must not be null.
    - from - The start of the date range to consider. Must not be null
    - to - The end of the date range to consider. Must not be null.

    **Returns:**
    - PromotionPlan with promotions matching all the criteria.


---

### getCampaign(String)
- static getCampaign(id: [String](TopLevel.String.md)): [Campaign](dw.campaign.Campaign.md)
  - : Returns the campaign identified by the specified ID.

    **Parameters:**
    - id - Campaign ID

    **Returns:**
    - Campaign or null if not found


---

### getCampaigns()
- static getCampaigns(): [Collection](dw.util.Collection.md)
  - : Returns all campaigns of the current site in no specific order.

    **Returns:**
    - All campaigns of current site


---

### getDiscounts(LineItemCtnr)
- static getDiscounts(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): [DiscountPlan](dw.campaign.DiscountPlan.md)
  - : Returns the discounts applicable for the current customer, active
      source code and specified line item container. 
      
      
      This method identifies all active  promotions assigned to the customer
      groups of the current customer, the active source code and any coupon
      contained in the specified line item container, and calculates applicable
      discounts from these promotions.
      
      
      The applicable discounts are contained in the returned instance of
      [DiscountPlan](dw.campaign.DiscountPlan.md).


    **Parameters:**
    - lineItemCtnr - Line item container

    **Returns:**
    - Discount plan with applicable discounts


---

### getDiscounts(LineItemCtnr, PromotionPlan)
- static getDiscounts(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md), promotionPlan: [PromotionPlan](dw.campaign.PromotionPlan.md)): [DiscountPlan](dw.campaign.DiscountPlan.md)
  - : Returns the discounts applicable for the current customer, active
      source code and specified line item container, based on the specified
      promotion plan. 
      
      
      This method calculates applicable discounts from the promotions in the
      specified promotion plan. Note that any promotion in the promotion
      plan that is inactive, or not applicable for the current customer
      or source code, is being ignored.
      
      
      The applicable discounts are contained in the returned instance of
      [DiscountPlan](dw.campaign.DiscountPlan.md).


    **Parameters:**
    - lineItemCtnr - Line item container
    - promotionPlan - Promotion plan with active promotions

    **Returns:**
    - Discount plan with applicable discounts


---

### getPromotion(String)
- static getPromotion(id: [String](TopLevel.String.md)): [Promotion](dw.campaign.Promotion.md)
  - : Returns the promotion identified by the specified ID. The same logical
      promotion may be assigned to multiple campaigns or AB-tests. In this
      case, the system returns the instance of highest rank. Some attributes of
      the returned Promotion may vary based on exactly which instance is
      returned. This method returns null if there is no promotion in the system
      with the given ID, or if a promotion with the given ID exists but it is
      not assigned to any campaign or AB-test.


    **Parameters:**
    - id - Promotion ID

    **Returns:**
    - Promotion or null if not found


---

### getPromotions()
- static getPromotions(): [Collection](dw.util.Collection.md)
  - : Returns all promotions of the current site in no specific order.

    **Returns:**
    - All promotions of current site


---

### getUpcomingCustomerPromotions(Number)
- static getUpcomingCustomerPromotions(previewTime: [Number](TopLevel.Number.md)): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions currently inactive, but scheduled
      for any time between _now_ and _now + previewTime(hours)_,
      and which are applicable based on the current customer, source code, and
      coupons in the current basket.
      
      The parameter _previewTime_ specifies for how many hours promotions
      should be previewed.


    **Parameters:**
    - previewTime - Preview time in hours

    **Returns:**
    - PromotionPlan with active promotions

    **See Also:**
    - [getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions)


---

### getUpcomingPromotions(Number)
- static getUpcomingPromotions(previewTime: [Number](TopLevel.Number.md)): [PromotionPlan](dw.campaign.PromotionPlan.md)
  - : Returns all promotions currently inactive, but scheduled
      for any time between _now_ and _now + previewTime(hours)_. 
      
      The upcoming promotions are returned in an instance of
      [PromotionPlan](dw.campaign.PromotionPlan.md) and might not necessarily be applicable for
      the current customer or source code. 
      
      The parameter _previewTime_ specifies for how many hours promotions
      should be previewed.


    **Parameters:**
    - previewTime - Preview time in hours

    **Returns:**
    - PromotionPlan with active promotions

    **See Also:**
    - [getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions)


---

<!-- prettier-ignore-end -->
