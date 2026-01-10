<!-- prettier-ignore-start -->
# Class CouponLineItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.order.CouponLineItem](dw.order.CouponLineItem.md)

The CouponLineItem class is used to store redeemed coupons in the Basket.


## Property Summary

| Property | Description |
| --- | --- |
| [applied](#applied): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the coupon is currently applied in the basket. |
| [basedOnCampaign](#basedoncampaign): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if the line item represents a coupon of a campaign. |
| [bonusDiscountLineItems](#bonusdiscountlineitems): [Collection](dw.util.Collection.md) `(read-only)` | Returns the bonus discount line items of the line item container triggered  by this coupon. |
| [couponCode](#couponcode): [String](TopLevel.String.md) `(read-only)` | Returns the coupon code. |
| [priceAdjustments](#priceadjustments): [Collection](dw.util.Collection.md) `(read-only)` | Returns the price adjustments of the line item container triggered  by this coupon. |
| ~~[promotion](#promotion): [Promotion](dw.campaign.Promotion.md)~~ `(read-only)` | Returns the promotion related to the coupon line item. |
| ~~[promotionID](#promotionid): [String](TopLevel.String.md)~~ `(read-only)` | Returns the id of the related promotion. |
| [statusCode](#statuscode): [String](TopLevel.String.md) `(read-only)` | This method provides a detailed error status in case the coupon code of  this coupon line item instance became invalid. |
| [valid](#valid): [Boolean](TopLevel.Boolean.md) `(read-only)` | Allows to check whether the coupon code of this coupon line item instance  is valid. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [associatePriceAdjustment](dw.order.CouponLineItem.md#associatepriceadjustmentpriceadjustment)([PriceAdjustment](dw.order.PriceAdjustment.md)) | Associates the specified price adjustment with the coupon line item. |
| [getBonusDiscountLineItems](dw.order.CouponLineItem.md#getbonusdiscountlineitems)() | Returns the bonus discount line items of the line item container triggered  by this coupon. |
| [getCouponCode](dw.order.CouponLineItem.md#getcouponcode)() | Returns the coupon code. |
| [getPriceAdjustments](dw.order.CouponLineItem.md#getpriceadjustments)() | Returns the price adjustments of the line item container triggered  by this coupon. |
| ~~[getPromotion](dw.order.CouponLineItem.md#getpromotion)()~~ | Returns the promotion related to the coupon line item. |
| ~~[getPromotionID](dw.order.CouponLineItem.md#getpromotionid)()~~ | Returns the id of the related promotion. |
| [getStatusCode](dw.order.CouponLineItem.md#getstatuscode)() | This method provides a detailed error status in case the coupon code of  this coupon line item instance became invalid. |
| [isApplied](dw.order.CouponLineItem.md#isapplied)() | Identifies if the coupon is currently applied in the basket. |
| [isBasedOnCampaign](dw.order.CouponLineItem.md#isbasedoncampaign)() | Returns true if the line item represents a coupon of a campaign. |
| [isValid](dw.order.CouponLineItem.md#isvalid)() | Allows to check whether the coupon code of this coupon line item instance  is valid. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### applied
- applied: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the coupon is currently applied in the basket. A coupon
      line is applied if there exists at least one price adjustment related
      to the coupon line item.



---

### basedOnCampaign
- basedOnCampaign: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if the line item represents a coupon of a campaign. If the coupon line item represents a custom
      coupon code, the method returns false.



---

### bonusDiscountLineItems
- bonusDiscountLineItems: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the bonus discount line items of the line item container triggered
      by this coupon.



---

### couponCode
- couponCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the coupon code.


---

### priceAdjustments
- priceAdjustments: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the price adjustments of the line item container triggered
      by this coupon.



---

### promotion
- ~~promotion: [Promotion](dw.campaign.Promotion.md)~~ `(read-only)`
  - : Returns the promotion related to the coupon line item.

    **Deprecated:**
:::warning
A coupon code and its coupon can be associated with
            multiple promotions. Therefore, this method is not
            appropriate anymore. For backward-compatibility, the method
            returns one of the promotions associated with the coupon
            code.

:::

---

### promotionID
- ~~promotionID: [String](TopLevel.String.md)~~ `(read-only)`
  - : Returns the id of the related promotion.

    **Deprecated:**
:::warning
A coupon code and it's coupon can be associated with
            multiple promotions. Therefore, this method is not
            appropriate anymore. For backward-compatibility, the method
            returns the ID of one of the promotions associated with
            the coupon code.

:::

---

### statusCode
- statusCode: [String](TopLevel.String.md) `(read-only)`
  - : This method provides a detailed error status in case the coupon code of
      this coupon line item instance became invalid.



---

### valid
- valid: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Allows to check whether the coupon code of this coupon line item instance
      is valid. Coupon line item is valid, if status code is one of the following:
      
      - [CouponStatusCodes.APPLIED](dw.campaign.CouponStatusCodes.md#applied)
      - [CouponStatusCodes.NO_APPLICABLE_PROMOTION](dw.campaign.CouponStatusCodes.md#no_applicable_promotion)



---

## Method Details

### associatePriceAdjustment(PriceAdjustment)
- associatePriceAdjustment(priceAdjustment: [PriceAdjustment](dw.order.PriceAdjustment.md)): void
  - : Associates the specified price adjustment with the coupon line item. This method is only applicable if used for
      price adjustments and coupon line items NOT based on B2C Commerce campaigns.


    **Parameters:**
    - priceAdjustment - Price adjustment to be associated with coupon line item.


---

### getBonusDiscountLineItems()
- getBonusDiscountLineItems(): [Collection](dw.util.Collection.md)
  - : Returns the bonus discount line items of the line item container triggered
      by this coupon.


    **Returns:**
    - Price adjustments triggered by the coupon


---

### getCouponCode()
- getCouponCode(): [String](TopLevel.String.md)
  - : Returns the coupon code.

    **Returns:**
    - Coupon code


---

### getPriceAdjustments()
- getPriceAdjustments(): [Collection](dw.util.Collection.md)
  - : Returns the price adjustments of the line item container triggered
      by this coupon.


    **Returns:**
    - Price adjustments triggered by the coupon


---

### getPromotion()
- ~~getPromotion(): [Promotion](dw.campaign.Promotion.md)~~
  - : Returns the promotion related to the coupon line item.

    **Returns:**
    - Promotion related to coupon represented by line item

    **Deprecated:**
:::warning
A coupon code and its coupon can be associated with
            multiple promotions. Therefore, this method is not
            appropriate anymore. For backward-compatibility, the method
            returns one of the promotions associated with the coupon
            code.

:::

---

### getPromotionID()
- ~~getPromotionID(): [String](TopLevel.String.md)~~
  - : Returns the id of the related promotion.

    **Returns:**
    - the id of the related promotion.

    **Deprecated:**
:::warning
A coupon code and it's coupon can be associated with
            multiple promotions. Therefore, this method is not
            appropriate anymore. For backward-compatibility, the method
            returns the ID of one of the promotions associated with
            the coupon code.

:::

---

### getStatusCode()
- getStatusCode(): [String](TopLevel.String.md)
  - : This method provides a detailed error status in case the coupon code of
      this coupon line item instance became invalid.


    **Returns:**
    - Returns APPLIED if coupon is applied, and otherwise one of the
      codes defined in [CouponStatusCodes](dw.campaign.CouponStatusCodes.md)



---

### isApplied()
- isApplied(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the coupon is currently applied in the basket. A coupon
      line is applied if there exists at least one price adjustment related
      to the coupon line item.


    **Returns:**
    - true if the coupon is currently applied in the basket.


---

### isBasedOnCampaign()
- isBasedOnCampaign(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if the line item represents a coupon of a campaign. If the coupon line item represents a custom
      coupon code, the method returns false.



---

### isValid()
- isValid(): [Boolean](TopLevel.Boolean.md)
  - : Allows to check whether the coupon code of this coupon line item instance
      is valid. Coupon line item is valid, if status code is one of the following:
      
      - [CouponStatusCodes.APPLIED](dw.campaign.CouponStatusCodes.md#applied)
      - [CouponStatusCodes.NO_APPLICABLE_PROMOTION](dw.campaign.CouponStatusCodes.md#no_applicable_promotion)


    **Returns:**
    - true if the coupon code is valid, false otherwise.


---

<!-- prettier-ignore-end -->
