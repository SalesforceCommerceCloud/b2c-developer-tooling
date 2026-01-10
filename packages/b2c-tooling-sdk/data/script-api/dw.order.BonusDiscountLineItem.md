<!-- prettier-ignore-start -->
# Class BonusDiscountLineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.BonusDiscountLineItem](dw.order.BonusDiscountLineItem.md)

Line item representing an applied [BonusChoiceDiscount](dw.campaign.BonusChoiceDiscount.md) in a LineItemCtnr. This type of line item
can only be created by the B2C Commerce promotions engine when applying a BonusChoiceDiscount.
A BonusDiscountLineItem is basically a placeholder in the cart which entitles a customer to add one or more bonus
products to his basket from a configured list of products. Merchants typically display this type of line item in the
cart by showing the corresponding promotion callout message. They typically provide links to the bonus products that
the customer can choose from. This line item can be removed from the cart but will be re-added each time the
promotions engine re-applies discounts. Merchants may however add custom logic to show/hide this line item since it
just a placeholder and not an actual product line item.


The number of products that a customer is allowed to choose from is determined by [getMaxBonusItems()](dw.order.BonusDiscountLineItem.md#getmaxbonusitems). The
collection of products the customer can choose from is determined by [getBonusProducts()](dw.order.BonusDiscountLineItem.md#getbonusproducts). When a customer
chooses a bonus product in the storefront, it is necessary to use the `AddBonusProductToBasket` pipelet
instead of the usual `AddProductToBasket` pipelet, in order to associate this BonusDiscountLineItem with
the newly created bonus ProductLineItem. Alternatively, the API method
[LineItemCtnr.createBonusProductLineItem(BonusDiscountLineItem, Product, ProductOptionModel, Shipment)](dw.order.LineItemCtnr.md#createbonusproductlineitembonusdiscountlineitem-product-productoptionmodel-shipment)
can be used instead. The system does proper validations in order to prevent incorrect or too many bonus products from
being associated with this BonusDiscountLineItem. Once a customer has selected bonus products, the product line items
representing the chosen bonus products can be retrieved with [getBonusProductLineItems()](dw.order.BonusDiscountLineItem.md#getbonusproductlineitems).


**See Also:**
- [BonusChoiceDiscount](dw.campaign.BonusChoiceDiscount.md)


## Property Summary

| Property | Description |
| --- | --- |
| [bonusChoiceRuleBased](#bonuschoicerulebased): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether the promotion that triggered the creation of this line item uses a rule to determine the list of  bonus products. |
| [bonusProductLineItems](#bonusproductlineitems): [List](dw.util.List.md) `(read-only)` | Get the product line items in the current LineItemCtnr representing the  bonus products that the customer has selected for this discount. |
| [bonusProducts](#bonusproducts): [List](dw.util.List.md) `(read-only)` | Get the list of bonus products which the customer is allowed to choose  from for this discount. |
| [couponLineItem](#couponlineitem): [CouponLineItem](dw.order.CouponLineItem.md) `(read-only)` | Get the coupon line item associated with this discount. |
| [maxBonusItems](#maxbonusitems): [Number](TopLevel.Number.md) `(read-only)` | Get the maximum number of bonus items that the customer is permitted to  select for this bonus discount. |
| [promotion](#promotion): [Promotion](dw.campaign.Promotion.md) `(read-only)` | Get the promotion associated with this discount. |
| [promotionID](#promotionid): [String](TopLevel.String.md) `(read-only)` | Get the promotion ID associated with this discount. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBonusProductLineItems](dw.order.BonusDiscountLineItem.md#getbonusproductlineitems)() | Get the product line items in the current LineItemCtnr representing the  bonus products that the customer has selected for this discount. |
| [getBonusProductPrice](dw.order.BonusDiscountLineItem.md#getbonusproductpriceproduct)([Product](dw.catalog.Product.md)) | Get the effective price for the passed bonus product. |
| [getBonusProducts](dw.order.BonusDiscountLineItem.md#getbonusproducts)() | Get the list of bonus products which the customer is allowed to choose  from for this discount. |
| [getCouponLineItem](dw.order.BonusDiscountLineItem.md#getcouponlineitem)() | Get the coupon line item associated with this discount. |
| [getMaxBonusItems](dw.order.BonusDiscountLineItem.md#getmaxbonusitems)() | Get the maximum number of bonus items that the customer is permitted to  select for this bonus discount. |
| [getPromotion](dw.order.BonusDiscountLineItem.md#getpromotion)() | Get the promotion associated with this discount. |
| [getPromotionID](dw.order.BonusDiscountLineItem.md#getpromotionid)() | Get the promotion ID associated with this discount. |
| [isBonusChoiceRuleBased](dw.order.BonusDiscountLineItem.md#isbonuschoicerulebased)() | Returns whether the promotion that triggered the creation of this line item uses a rule to determine the list of  bonus products. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### bonusChoiceRuleBased
- bonusChoiceRuleBased: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether the promotion that triggered the creation of this line item uses a rule to determine the list of
      bonus products.
      
      
      If the promotion is rule based, then a ProductSearchModel should be used to return the bonus products the
      customer may choose from, as the methods that return lists will return nothing. See [getBonusProducts()](dw.order.BonusDiscountLineItem.md#getbonusproducts)



---

### bonusProductLineItems
- bonusProductLineItems: [List](dw.util.List.md) `(read-only)`
  - : Get the product line items in the current LineItemCtnr representing the
      bonus products that the customer has selected for this discount.


    **See Also:**
    - [LineItemCtnr.createBonusProductLineItem(BonusDiscountLineItem, Product, ProductOptionModel, Shipment)](dw.order.LineItemCtnr.md#createbonusproductlineitembonusdiscountlineitem-product-productoptionmodel-shipment)


---

### bonusProducts
- bonusProducts: [List](dw.util.List.md) `(read-only)`
  - : Get the list of bonus products which the customer is allowed to choose
      from for this discount. This list is configured by a merchant entering a
      list of SKUs for the discount. Products which do not exist in the system,
      or are offline, or are not assigned to a category in the site catalog are
      filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
      out. This allows merchants to display out-of-stock bonus products with
      appropriate messaging.
      
      
      If the promotion which triggered this discount does not exist, or this
      promotion is rule based, then this method returns an empty list.
      
      
      If the promotion is rule based, then this method will return an empty list.
      A ProductSearchModel should be used to return the bonus products the
      customer may choose from instead. See
      [ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS](dw.catalog.ProductSearchModel.md#promotion_product_type_bonus) and
      [ProductSearchModel.setPromotionID(String)](dw.catalog.ProductSearchModel.md#setpromotionidstring)
      
      
      If a returned product is a master product, the customer is entitled to
      choose from any variant. If the product is an option product, the
      customer is entitled to choose any value for each option. Since the
      promotions engine does not touch the value of the product option line
      items, it is the responsibility of custom code to set option prices.



---

### couponLineItem
- couponLineItem: [CouponLineItem](dw.order.CouponLineItem.md) `(read-only)`
  - : Get the coupon line item associated with this discount.


---

### maxBonusItems
- maxBonusItems: [Number](TopLevel.Number.md) `(read-only)`
  - : Get the maximum number of bonus items that the customer is permitted to
      select for this bonus discount.
      
      
      If the promotion which triggered this discount does not exist, then this
      method returns 0.



---

### promotion
- promotion: [Promotion](dw.campaign.Promotion.md) `(read-only)`
  - : Get the promotion associated with this discount.


---

### promotionID
- promotionID: [String](TopLevel.String.md) `(read-only)`
  - : Get the promotion ID associated with this discount.


---

## Method Details

### getBonusProductLineItems()
- getBonusProductLineItems(): [List](dw.util.List.md)
  - : Get the product line items in the current LineItemCtnr representing the
      bonus products that the customer has selected for this discount.


    **Returns:**
    - The selected product line items, never null.

    **See Also:**
    - [LineItemCtnr.createBonusProductLineItem(BonusDiscountLineItem, Product, ProductOptionModel, Shipment)](dw.order.LineItemCtnr.md#createbonusproductlineitembonusdiscountlineitem-product-productoptionmodel-shipment)


---

### getBonusProductPrice(Product)
- getBonusProductPrice(product: [Product](dw.catalog.Product.md)): [Money](dw.value.Money.md)
  - : Get the effective price for the passed bonus product. This is expected to
      be one of the products returned by [getBonusProducts()](dw.order.BonusDiscountLineItem.md#getbonusproducts) with one
      exception: If a master product is configured as a bonus product, this
      implies that a customer may choose from any of its variants. In this
      case, it is allowed to pass in a variant to this method and a price will
      be returned. If the passed product is not a valid bonus product, this
      method throws an exception.


    **Parameters:**
    - product - The bonus product to retrieve a price for, must not be             null.

    **Returns:**
    - The price of the passed bonus product as a Number.


---

### getBonusProducts()
- getBonusProducts(): [List](dw.util.List.md)
  - : Get the list of bonus products which the customer is allowed to choose
      from for this discount. This list is configured by a merchant entering a
      list of SKUs for the discount. Products which do not exist in the system,
      or are offline, or are not assigned to a category in the site catalog are
      filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
      out. This allows merchants to display out-of-stock bonus products with
      appropriate messaging.
      
      
      If the promotion which triggered this discount does not exist, or this
      promotion is rule based, then this method returns an empty list.
      
      
      If the promotion is rule based, then this method will return an empty list.
      A ProductSearchModel should be used to return the bonus products the
      customer may choose from instead. See
      [ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS](dw.catalog.ProductSearchModel.md#promotion_product_type_bonus) and
      [ProductSearchModel.setPromotionID(String)](dw.catalog.ProductSearchModel.md#setpromotionidstring)
      
      
      If a returned product is a master product, the customer is entitled to
      choose from any variant. If the product is an option product, the
      customer is entitled to choose any value for each option. Since the
      promotions engine does not touch the value of the product option line
      items, it is the responsibility of custom code to set option prices.


    **Returns:**
    - An ordered list of bonus products that the customer may choose
              from for this discount.



---

### getCouponLineItem()
- getCouponLineItem(): [CouponLineItem](dw.order.CouponLineItem.md)
  - : Get the coupon line item associated with this discount.

    **Returns:**
    - The coupon line item associated with this discount, or null if it no
              longer exists or there is no one.



---

### getMaxBonusItems()
- getMaxBonusItems(): [Number](TopLevel.Number.md)
  - : Get the maximum number of bonus items that the customer is permitted to
      select for this bonus discount.
      
      
      If the promotion which triggered this discount does not exist, then this
      method returns 0.


    **Returns:**
    - The maximum number of bonus items that the customer is permitted
              to select for this bonus discount, or 0 if the promotion no
              longer exists.



---

### getPromotion()
- getPromotion(): [Promotion](dw.campaign.Promotion.md)
  - : Get the promotion associated with this discount.

    **Returns:**
    - The promotion associated with this discount, or null if it no
              longer exists.



---

### getPromotionID()
- getPromotionID(): [String](TopLevel.String.md)
  - : Get the promotion ID associated with this discount.

    **Returns:**
    - The promotion ID associated with this discount, never null.


---

### isBonusChoiceRuleBased()
- isBonusChoiceRuleBased(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether the promotion that triggered the creation of this line item uses a rule to determine the list of
      bonus products.
      
      
      If the promotion is rule based, then a ProductSearchModel should be used to return the bonus products the
      customer may choose from, as the methods that return lists will return nothing. See [getBonusProducts()](dw.order.BonusDiscountLineItem.md#getbonusproducts)


    **Returns:**
    - If the promotion no longer exists, then null, otherwise, true if the promotion that triggered the
              creation of this line item uses a rule to determine the bonus products to choose from.



---

<!-- prettier-ignore-end -->
