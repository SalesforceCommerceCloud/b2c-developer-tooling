<!-- prettier-ignore-start -->
# Class BonusChoiceDiscount

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.Discount](dw.campaign.Discount.md)
    - [dw.campaign.BonusChoiceDiscount](dw.campaign.BonusChoiceDiscount.md)

Represents a _choice of bonus products_ discount in the discount plan,
for example "Choose 3 DVDs from a list of 20 options with your purchase of
any DVD player."



## Property Summary

| Property | Description |
| --- | --- |
| [bonusProducts](#bonusproducts): [List](dw.util.List.md) `(read-only)` | Get the list of bonus products which the customer is allowed to choose  from for this discount. |
| [maxBonusItems](#maxbonusitems): [Number](TopLevel.Number.md) `(read-only)` | Returns the maximum number of bonus items that a customer is entitled to  select for this discount. |
| [ruleBased](#rulebased): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if this is a "rule based" bonus choice discount. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBonusProductPrice](dw.campaign.BonusChoiceDiscount.md#getbonusproductpriceproduct)([Product](dw.catalog.Product.md)) | Get the effective price for the passed bonus product. |
| [getBonusProducts](dw.campaign.BonusChoiceDiscount.md#getbonusproducts)() | Get the list of bonus products which the customer is allowed to choose  from for this discount. |
| [getMaxBonusItems](dw.campaign.BonusChoiceDiscount.md#getmaxbonusitems)() | Returns the maximum number of bonus items that a customer is entitled to  select for this discount. |
| [isRuleBased](dw.campaign.BonusChoiceDiscount.md#isrulebased)() | Returns true if this is a "rule based" bonus choice discount. |

### Methods inherited from class Discount

[getItemPromotionTiers](dw.campaign.Discount.md#getitempromotiontiers), [getPromotion](dw.campaign.Discount.md#getpromotion), [getPromotionTier](dw.campaign.Discount.md#getpromotiontier), [getQuantity](dw.campaign.Discount.md#getquantity), [getType](dw.campaign.Discount.md#gettype)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### bonusProducts
- bonusProducts: [List](dw.util.List.md) `(read-only)`
  - : Get the list of bonus products which the customer is allowed to choose
      from for this discount. This list is configured by a merchant entering a
      list of SKUs for the discount. Products which do not exist in the system,
      or are offline, or are not assigned to a category in the site catalog are
      filtered out. Unavailable (i.e. out-of-stock) products are NOT filtered
      out. This allows merchants to display out-of-stock bonus products with
      appropriate messaging.
      
      
      If a returned product is a master product, the customer is entitled to
      choose from any variant. If the product is an option product, the
      customer is entitled to choose any value for each option. Since the
      promotions engine does not touch the value of the product option line
      items, it is the responsibility of custom code to set option prices.
      
      
      If the promotion is rule based, then this method will return an empty list.
      A ProductSearchModel should be used to return the bonus products the
      customer may choose from instead. See
      [ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS](dw.catalog.ProductSearchModel.md#promotion_product_type_bonus) and
      [ProductSearchModel.setPromotionID(String)](dw.catalog.ProductSearchModel.md#setpromotionidstring)



---

### maxBonusItems
- maxBonusItems: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the maximum number of bonus items that a customer is entitled to
      select for this discount.



---

### ruleBased
- ruleBased: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if this is a "rule based" bonus choice discount.
      For such discounts, there is no static list of bonus products
      associated with the discount but rather a discounted product
      rule associated with the promotion which defines the bonus
      products. To retrieve the list of selectable bonus products for
      display in the storefront, it is necessary to search for the
      bonus products using the [ProductSearchModel](dw.catalog.ProductSearchModel.md)
      API since the method [getBonusProducts()](dw.campaign.BonusChoiceDiscount.md#getbonusproducts) in this class
      will always return an empty list. Furthermore, for rule based
      bonus-choice discounts, [getBonusProductPrice(Product)](dw.campaign.BonusChoiceDiscount.md#getbonusproductpriceproduct)
      will always return a price of 0.00 for bonus products.



---

## Method Details

### getBonusProductPrice(Product)
- getBonusProductPrice(product: [Product](dw.catalog.Product.md)): [Number](TopLevel.Number.md)
  - : Get the effective price for the passed bonus product. This is expected to
      be one of the products returned by [getBonusProducts()](dw.campaign.BonusChoiceDiscount.md#getbonusproducts) with one
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
      
      
      If a returned product is a master product, the customer is entitled to
      choose from any variant. If the product is an option product, the
      customer is entitled to choose any value for each option. Since the
      promotions engine does not touch the value of the product option line
      items, it is the responsibility of custom code to set option prices.
      
      
      If the promotion is rule based, then this method will return an empty list.
      A ProductSearchModel should be used to return the bonus products the
      customer may choose from instead. See
      [ProductSearchModel.PROMOTION_PRODUCT_TYPE_BONUS](dw.catalog.ProductSearchModel.md#promotion_product_type_bonus) and
      [ProductSearchModel.setPromotionID(String)](dw.catalog.ProductSearchModel.md#setpromotionidstring)


    **Returns:**
    - An ordered list of bonus products that the customer may choose
              from for this discount.



---

### getMaxBonusItems()
- getMaxBonusItems(): [Number](TopLevel.Number.md)
  - : Returns the maximum number of bonus items that a customer is entitled to
      select for this discount.


    **Returns:**
    - The maximum number of bonus items that this discount permits a
              customer to select.



---

### isRuleBased()
- isRuleBased(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if this is a "rule based" bonus choice discount.
      For such discounts, there is no static list of bonus products
      associated with the discount but rather a discounted product
      rule associated with the promotion which defines the bonus
      products. To retrieve the list of selectable bonus products for
      display in the storefront, it is necessary to search for the
      bonus products using the [ProductSearchModel](dw.catalog.ProductSearchModel.md)
      API since the method [getBonusProducts()](dw.campaign.BonusChoiceDiscount.md#getbonusproducts) in this class
      will always return an empty list. Furthermore, for rule based
      bonus-choice discounts, [getBonusProductPrice(Product)](dw.campaign.BonusChoiceDiscount.md#getbonusproductpriceproduct)
      will always return a price of 0.00 for bonus products.


    **Returns:**
    - True if this is a rule-based bonus-choice discount, or
              false if this discount defines a simple static list of
              bonus products.



---

<!-- prettier-ignore-end -->
