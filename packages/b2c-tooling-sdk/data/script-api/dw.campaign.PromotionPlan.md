<!-- prettier-ignore-start -->
# Class PromotionPlan

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.PromotionPlan](dw.campaign.PromotionPlan.md)

PromotionPlan represents a set of [Promotion](dw.campaign.Promotion.md) instances and
is used to display active or upcoming promotions on storefront pages, or to
pass it to the [PromotionMgr](dw.campaign.PromotionMgr.md) to calculate a
[DiscountPlan](dw.campaign.DiscountPlan.md) and subsequently apply discounts to a line
item container. Instances of the class are returned by the
[PromotionMgr.getActivePromotions()](dw.campaign.PromotionMgr.md#getactivepromotions),
[PromotionMgr.getActiveCustomerPromotions()](dw.campaign.PromotionMgr.md#getactivecustomerpromotions) and
[PromotionMgr.getUpcomingPromotions(Number)](dw.campaign.PromotionMgr.md#getupcomingpromotionsnumber).


PromotionPlan provides methods to access the promotions in the plan and to
remove promotions from the plan. All methods which return a collection of
promotions sort them by the following ordered criteria:




1. Exclusivity: GLOBAL exclusive promotions first, followed by CLASS   exclusive promotions, and NO exclusive promotions last.
2. Rank: sorted ascending
3. Promotion Class: PRODUCT promotions first, followed by ORDER promotions,   and SHIPPING promotions last.
4. Discount type: Fixed price promotions first, followed by free,   amount-off, percentage-off, and bonus product promotions last.
5. Best discount: Sorted descending. For example, 30% off comes before 20%   off.
6. ID: alphanumeric ascending.


**See Also:**
- [PromotionMgr](dw.campaign.PromotionMgr.md)


## Constant Summary

| Constant | Description |
| --- | --- |
| [SORT_BY_EXCLUSIVITY](#sort_by_exclusivity): [Number](TopLevel.Number.md) = 1 | Constant indicating that a collection of promotions should be sorted  first by exclusivity, then rank, promotion class, etc. |
| [SORT_BY_START_DATE](#sort_by_start_date): [Number](TopLevel.Number.md) = 2 | Constant indicating that a collection of promotions should be sorted by  start date ascending. |

## Property Summary

| Property | Description |
| --- | --- |
| [orderPromotions](#orderpromotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns all order promotions contained in this plan. |
| [productPromotions](#productpromotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns all product promotions contained in this plan. |
| [promotions](#promotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns all promotions contained in this plan sorted by exclusivity. |
| [shippingPromotions](#shippingpromotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns all shipping promotions contained in this plan. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getOrderPromotions](dw.campaign.PromotionPlan.md#getorderpromotions)() | Returns all order promotions contained in this plan. |
| [getPaymentCardPromotions](dw.campaign.PromotionPlan.md#getpaymentcardpromotionspaymentcard)([PaymentCard](dw.order.PaymentCard.md)) | Returns the order promotions explicitly associated to the specified  discounted payment card. |
| [getPaymentMethodPromotions](dw.campaign.PromotionPlan.md#getpaymentmethodpromotionspaymentmethod)([PaymentMethod](dw.order.PaymentMethod.md)) | Returns the order promotions explicitly associated to the specified  discounted payment method. |
| [getProductPromotions](dw.campaign.PromotionPlan.md#getproductpromotions)() | Returns all product promotions contained in this plan. |
| [getProductPromotions](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)([Product](dw.catalog.Product.md)) | Returns the promotions related to the specified product. |
| [getProductPromotionsForDiscountedProduct](dw.campaign.PromotionPlan.md#getproductpromotionsfordiscountedproductproduct)([Product](dw.catalog.Product.md)) | Returns the product promotions for which the specified product is a  discounted (and possibly also a qualifying) product. |
| [getProductPromotionsForQualifyingProduct](dw.campaign.PromotionPlan.md#getproductpromotionsforqualifyingproductproduct)([Product](dw.catalog.Product.md)) | Returns the product promotions for which the specified product is a  qualifying but NOT a discounted product. |
| [getPromotions](dw.campaign.PromotionPlan.md#getpromotions)() | Returns all promotions contained in this plan sorted by exclusivity. |
| ~~[getPromotions](dw.campaign.PromotionPlan.md#getpromotionsproduct)([Product](dw.catalog.Product.md))~~ | Returns the promotions related to the specified product. |
| [getPromotions](dw.campaign.PromotionPlan.md#getpromotionsnumber)([Number](TopLevel.Number.md)) | Returns all promotions contained in this plan sorted according to the  specified sort order. |
| [getShippingPromotions](dw.campaign.PromotionPlan.md#getshippingpromotions)() | Returns all shipping promotions contained in this plan. |
| [getShippingPromotions](dw.campaign.PromotionPlan.md#getshippingpromotionsshippingmethod)([ShippingMethod](dw.order.ShippingMethod.md)) | Returns the shipping promotions related to the specified discounted  shipping method, i.e. |
| [removePromotion](dw.campaign.PromotionPlan.md#removepromotionpromotion)([Promotion](dw.campaign.Promotion.md)) | Remove promotion from promotion plan. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### SORT_BY_EXCLUSIVITY

- SORT_BY_EXCLUSIVITY: [Number](TopLevel.Number.md) = 1
  - : Constant indicating that a collection of promotions should be sorted
      first by exclusivity, then rank, promotion class, etc.  See class-level
      javadoc for details.  This is the default sort order for methods that
      return a collection of promotions.



---

### SORT_BY_START_DATE

- SORT_BY_START_DATE: [Number](TopLevel.Number.md) = 2
  - : Constant indicating that a collection of promotions should be sorted by
      start date ascending. If there is no explicit start date for a promotion
      the start date of its containing Campaign or AB-test is used instead.
      Promotions without a start date are sorted before promotions with a start
      date in the future and after promotions with a start date in the past. In
      case two promotion assignments have the same start date, they are sorted
      by their ID.



---

## Property Details

### orderPromotions
- orderPromotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all order promotions contained in this plan.


---

### productPromotions
- productPromotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all product promotions contained in this plan.


---

### promotions
- promotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all promotions contained in this plan sorted by exclusivity.


---

### shippingPromotions
- shippingPromotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all shipping promotions contained in this plan.


---

## Method Details

### getOrderPromotions()
- getOrderPromotions(): [Collection](dw.util.Collection.md)
  - : Returns all order promotions contained in this plan.

    **Returns:**
    - The sorted collection of order promotions contained in the promotion plan.


---

### getPaymentCardPromotions(PaymentCard)
- getPaymentCardPromotions(paymentCard: [PaymentCard](dw.order.PaymentCard.md)): [Collection](dw.util.Collection.md)
  - : Returns the order promotions explicitly associated to the specified
      discounted payment card.
      
      
      This method is usually used to display order promotions along with
      payment card choices.


    **Parameters:**
    - paymentCard - Discounted payment card

    **Returns:**
    - The sorted collection of order promotions associated with the
              specified payment card.



---

### getPaymentMethodPromotions(PaymentMethod)
- getPaymentMethodPromotions(paymentMethod: [PaymentMethod](dw.order.PaymentMethod.md)): [Collection](dw.util.Collection.md)
  - : Returns the order promotions explicitly associated to the specified
      discounted payment method.
      
      
      This method is usually used to display order promotions along with
      payment method choices.


    **Parameters:**
    - paymentMethod - Discounted payment method

    **Returns:**
    - The sorted collection of order promotions associated with the
              specified payment method.



---

### getProductPromotions()
- getProductPromotions(): [Collection](dw.util.Collection.md)
  - : Returns all product promotions contained in this plan.

    **Returns:**
    - The sorted collection of product promotions contained in the promotion plan.


---

### getProductPromotions(Product)
- getProductPromotions(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)
  - : Returns the promotions related to the specified product. 
      
      The method returns all promotions where the product is either a
      qualifying product, or a discounted product, or both. It also returns
      promotions where the specified product is a bonus product.
      
      
      This method is usually used to display product promotions on a product
      details page.
      
      
      If a master product is passed, then this method will return promotions
      which are relevant for the master itself or at least one of its variants.


    **Parameters:**
    - product - Product associated with promotion

    **Returns:**
    - The sorted collection of promotions related to specified
              discounted product.



---

### getProductPromotionsForDiscountedProduct(Product)
- getProductPromotionsForDiscountedProduct(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)
  - : Returns the product promotions for which the specified product is a
      discounted (and possibly also a qualifying) product. It also returns
      promotions where the specified product is a bonus product.
      
      
      This method is usually used to display product promotions on a product
      details page when separate callout messages are defined depending on if
      the product is a qualifying or discounted product for the promotion.
      
      
      If a master product is passed, then this method will return promotions
      for which the master product itself or at least one of its product's
      variants is a discounted product.


    **Parameters:**
    - product - The discounted product.

    **Returns:**
    - Product promotions related to the specified discounted product.


---

### getProductPromotionsForQualifyingProduct(Product)
- getProductPromotionsForQualifyingProduct(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)
  - : Returns the product promotions for which the specified product is a
      qualifying but NOT a discounted product.
      
      
      This method is usually used to display product promotions on a product
      details page when separate callout messages are defined depending on if
      the product is a qualifying or discounted product for the promotion.
      
      
      If a master product is passed, then this method will return promotions
      for which the master product itself or at least one of its product's
      variants is a qualifying product.


    **Parameters:**
    - product - The qualifying product.

    **Returns:**
    - Product promotions related to the specified qualifying product.


---

### getPromotions()
- getPromotions(): [Collection](dw.util.Collection.md)
  - : Returns all promotions contained in this plan sorted by exclusivity.

    **Returns:**
    - The sorted collection of promotions contained in the promotion plan.


---

### getPromotions(Product)
- ~~getPromotions(product: [Product](dw.catalog.Product.md)): [Collection](dw.util.Collection.md)~~
  - : Returns the promotions related to the specified product. 
      
      The method returns all promotions where the product is either
      a qualifying product, or a discounted product, or both. It also
      returns promotions where the specified product is a bonus product.
      
      
      This method is usually used to display product promotions on a
      product details page.


    **Parameters:**
    - product - Product associated with promotion

    **Returns:**
    - The sorted collection of promotions related to the specified discounted product.

    **Deprecated:**
:::warning
Use [getProductPromotions(Product)](dw.campaign.PromotionPlan.md#getproductpromotionsproduct)
:::

---

### getPromotions(Number)
- getPromotions(sortOrder: [Number](TopLevel.Number.md)): [Collection](dw.util.Collection.md)
  - : Returns all promotions contained in this plan sorted according to the
      specified sort order. If the passed sort order is invalid, then the
      returned promotions will be sorted by exclusivity.


    **Parameters:**
    - sortOrder - the sort order to use. Must be SORT\_BY\_EXCLUSIVITY or             SORT\_BY\_START\_DATE. If an invalid value is passed,             SORT\_BY\_EXCLUSIVITY is used.

    **Returns:**
    - The sorted collection of promotions contained in the promotion
              plan.



---

### getShippingPromotions()
- getShippingPromotions(): [Collection](dw.util.Collection.md)
  - : Returns all shipping promotions contained in this plan.

    **Returns:**
    - The sorted collection of shipping promotions contained in promotion plan.


---

### getShippingPromotions(ShippingMethod)
- getShippingPromotions(shippingMethod: [ShippingMethod](dw.order.ShippingMethod.md)): [Collection](dw.util.Collection.md)
  - : Returns the shipping promotions related to the specified discounted
      shipping method, i.e. the returned promotions apply a discount on
      the specified shipping method.
      
      
      This method is usually used to display shipping promotions along with
      shipping methods.


    **Parameters:**
    - shippingMethod - Discounted shipping method

    **Returns:**
    - The sorted collection of shipping promotions with specified method as discounted method.


---

### removePromotion(Promotion)
- removePromotion(promotion: [Promotion](dw.campaign.Promotion.md)): void
  - : Remove promotion from promotion plan. 
      
      Please note that this is the only way to remove promotions from the
      plan, i.e. removing promotions from the collections returned
      by methods such as [getProductPromotions()](dw.campaign.PromotionPlan.md#getproductpromotions) has no effect
      on the promotion plan.


    **Parameters:**
    - promotion - Promotion to remove from promotion plan


---

<!-- prettier-ignore-end -->
