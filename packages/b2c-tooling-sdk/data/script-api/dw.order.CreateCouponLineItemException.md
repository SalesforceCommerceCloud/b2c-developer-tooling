<!-- prettier-ignore-start -->
# Class CreateCouponLineItemException

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.CreateCouponLineItemException](dw.order.CreateCouponLineItemException.md)

This exception could be thrown by [LineItemCtnr.createCouponLineItem(String, Boolean)](dw.order.LineItemCtnr.md#createcouponlineitemstring-boolean)
when the provided coupon code is invalid.


'errorCode' property is set to one of the following values:

- [CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET](dw.campaign.CouponStatusCodes.md#coupon_code_already_in_basket)= Indicates that coupon code has already been added to basket.
- [CouponStatusCodes.COUPON_ALREADY_IN_BASKET](dw.campaign.CouponStatusCodes.md#coupon_already_in_basket)= Indicates that another code of the same MultiCode/System coupon has already been added to basket.
- [CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED](dw.campaign.CouponStatusCodes.md#coupon_code_already_redeemed)= Indicates that code of MultiCode/System coupon has already been redeemed.
- [CouponStatusCodes.COUPON_CODE_UNKNOWN](dw.campaign.CouponStatusCodes.md#coupon_code_unknown)= Indicates that coupon not found for given coupon code or that the code itself was not found.
- [CouponStatusCodes.COUPON_DISABLED](dw.campaign.CouponStatusCodes.md#coupon_disabled)= Indicates that coupon is not enabled.
- [CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#redemption_limit_exceeded)= Indicates that number of redemptions per code exceeded.
- [CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#customer_redemption_limit_exceeded)= Indicates that number of redemptions per code and customer exceeded.
- [CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#timeframe_redemption_limit_exceeded)= Indicates that number of redemptions per code, customer and time exceeded.
- [CouponStatusCodes.NO_ACTIVE_PROMOTION](dw.campaign.CouponStatusCodes.md#no_active_promotion)= Indicates that coupon is not assigned to an active promotion.



## Property Summary

| Property | Description |
| --- | --- |
| [errorCode](#errorcode): [String](TopLevel.String.md) `(read-only)` | Returns one of the error codes listed in the class doc. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getErrorCode](dw.order.CreateCouponLineItemException.md#geterrorcode)() | Returns one of the error codes listed in the class doc. |

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### errorCode
- errorCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns one of the error codes listed in the class doc.


---

## Method Details

### getErrorCode()
- getErrorCode(): [String](TopLevel.String.md)
  - : Returns one of the error codes listed in the class doc.

    **Returns:**
    - the error code


---

<!-- prettier-ignore-end -->
