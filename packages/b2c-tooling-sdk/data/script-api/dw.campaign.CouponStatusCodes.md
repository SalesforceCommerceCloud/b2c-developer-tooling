<!-- prettier-ignore-start -->
# Class CouponStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.CouponStatusCodes](dw.campaign.CouponStatusCodes.md)

Helper class containing status codes for why a coupon code cannot be added
to cart or why a coupon code already in cart is not longer valid for redemption.



## Constant Summary

| Constant | Description |
| --- | --- |
| [APPLIED](#applied): [String](TopLevel.String.md) = "APPLIED" | Coupon is currently applied in basket = Coupon code is valid for redemption and  Coupon is assigned to one or multiple applicable promotions. |
| [COUPON_ALREADY_IN_BASKET](#coupon_already_in_basket): [String](TopLevel.String.md) = "COUPON_ALREADY_IN_BASKET" | Indicates that another code of the same MultiCode/System coupon has already been added to basket. |
| [COUPON_CODE_ALREADY_IN_BASKET](#coupon_code_already_in_basket): [String](TopLevel.String.md) = "COUPON_CODE_ALREADY_IN_BASKET" | Indicates that coupon code has already been added to basket. |
| [COUPON_CODE_ALREADY_REDEEMED](#coupon_code_already_redeemed): [String](TopLevel.String.md) = "COUPON_CODE_ALREADY_REDEEMED" | Indicates that code of MultiCode/System coupon has already been redeemed. |
| [COUPON_CODE_UNKNOWN](#coupon_code_unknown): [String](TopLevel.String.md) = "COUPON_CODE_UNKNOWN" | Indicates that coupon not found for given coupon code or that the code itself was not found. |
| [COUPON_DISABLED](#coupon_disabled): [String](TopLevel.String.md) = "COUPON_DISABLED" | Indicates that coupon is not enabled. |
| [CUSTOMER_REDEMPTION_LIMIT_EXCEEDED](#customer_redemption_limit_exceeded): [String](TopLevel.String.md) = "CUSTOMER_REDEMPTION_LIMIT_EXCEEDED" | Indicates that No. |
| [NO_ACTIVE_PROMOTION](#no_active_promotion): [String](TopLevel.String.md) = "NO_ACTIVE_PROMOTION" | Indicates that coupon is not assigned to an active promotion. |
| [NO_APPLICABLE_PROMOTION](#no_applicable_promotion): [String](TopLevel.String.md) = "NO_APPLICABLE_PROMOTION" | Coupon is assigned to one or multiple active promotions, but none of these promotions is currently applicable. |
| [REDEMPTION_LIMIT_EXCEEDED](#redemption_limit_exceeded): [String](TopLevel.String.md) = "REDEMPTION_LIMIT_EXCEEDED" | Indicates that no. |
| [TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED](#timeframe_redemption_limit_exceeded): [String](TopLevel.String.md) = "TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED" | Indicates that No. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### APPLIED

- APPLIED: [String](TopLevel.String.md) = "APPLIED"
  - : Coupon is currently applied in basket = Coupon code is valid for redemption and
      Coupon is assigned to one or multiple applicable promotions.



---

### COUPON_ALREADY_IN_BASKET

- COUPON_ALREADY_IN_BASKET: [String](TopLevel.String.md) = "COUPON_ALREADY_IN_BASKET"
  - : Indicates that another code of the same MultiCode/System coupon has already been added to basket.


---

### COUPON_CODE_ALREADY_IN_BASKET

- COUPON_CODE_ALREADY_IN_BASKET: [String](TopLevel.String.md) = "COUPON_CODE_ALREADY_IN_BASKET"
  - : Indicates that coupon code has already been added to basket.


---

### COUPON_CODE_ALREADY_REDEEMED

- COUPON_CODE_ALREADY_REDEEMED: [String](TopLevel.String.md) = "COUPON_CODE_ALREADY_REDEEMED"
  - : Indicates that code of MultiCode/System coupon has already been redeemed.


---

### COUPON_CODE_UNKNOWN

- COUPON_CODE_UNKNOWN: [String](TopLevel.String.md) = "COUPON_CODE_UNKNOWN"
  - : Indicates that coupon not found for given coupon code or that the code itself was not found.


---

### COUPON_DISABLED

- COUPON_DISABLED: [String](TopLevel.String.md) = "COUPON_DISABLED"
  - : Indicates that coupon is not enabled.


---

### CUSTOMER_REDEMPTION_LIMIT_EXCEEDED

- CUSTOMER_REDEMPTION_LIMIT_EXCEEDED: [String](TopLevel.String.md) = "CUSTOMER_REDEMPTION_LIMIT_EXCEEDED"
  - : Indicates that No. of redemptions per code & customer exceeded.


---

### NO_ACTIVE_PROMOTION

- NO_ACTIVE_PROMOTION: [String](TopLevel.String.md) = "NO_ACTIVE_PROMOTION"
  - : Indicates that coupon is not assigned to an active promotion.


---

### NO_APPLICABLE_PROMOTION

- NO_APPLICABLE_PROMOTION: [String](TopLevel.String.md) = "NO_APPLICABLE_PROMOTION"
  - : Coupon is assigned to one or multiple active promotions, but none of these promotions is currently applicable.


---

### REDEMPTION_LIMIT_EXCEEDED

- REDEMPTION_LIMIT_EXCEEDED: [String](TopLevel.String.md) = "REDEMPTION_LIMIT_EXCEEDED"
  - : Indicates that no. of redemptions per code exceeded.
      Usually happens for single code coupons



---

### TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED

- TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: [String](TopLevel.String.md) = "TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED"
  - : Indicates that No. of redemptions per code,customer & time exceeded.


---

<!-- prettier-ignore-end -->
