<!-- prettier-ignore-start -->
# Class CouponMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.CouponMgr](dw.campaign.CouponMgr.md)

Manager to access coupons.


## Constant Summary

| Constant | Description |
| --- | --- |
| [MR_ERROR_INVALID_SITE_ID](#mr_error_invalid_site_id): [String](TopLevel.String.md) = "MASKREDEMPTIONS_SITE_NOT_FOUND" | Indicates that an error occurred because a valid data domain cannot be found for given siteID. |

## Property Summary

| Property | Description |
| --- | --- |
| [coupons](#coupons): [Collection](dw.util.Collection.md) `(read-only)` | Returns all coupons in the current site in no specific order. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getCoupon](dw.campaign.CouponMgr.md#getcouponstring)([String](TopLevel.String.md)) | Returns the coupon with the specified ID. |
| static [getCouponByCode](dw.campaign.CouponMgr.md#getcouponbycodestring)([String](TopLevel.String.md)) | Tries to find a coupon for the given coupon code. |
| static [getCoupons](dw.campaign.CouponMgr.md#getcoupons)() | Returns all coupons in the current site in no specific order. |
| static [getRedemptions](dw.campaign.CouponMgr.md#getredemptionsstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns list of CouponRedemptions for the specified coupon and coupon code,  sorted by redemption date descending (i.e. |
| static [maskRedemptions](dw.campaign.CouponMgr.md#maskredemptionsstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Mask customer email address in coupon redemptions for the given siteID and email address |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### MR_ERROR_INVALID_SITE_ID

- MR_ERROR_INVALID_SITE_ID: [String](TopLevel.String.md) = "MASKREDEMPTIONS_SITE_NOT_FOUND"
  - : Indicates that an error occurred because a valid data domain cannot be found for given siteID.


---

## Property Details

### coupons
- coupons: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns all coupons in the current site in no specific order.


---

## Method Details

### getCoupon(String)
- static getCoupon(couponID: [String](TopLevel.String.md)): [Coupon](dw.campaign.Coupon.md)
  - : Returns the coupon with the specified ID.

    **Parameters:**
    - couponID - the coupon identifier.

    **Returns:**
    - Coupon with specified ID or null


---

### getCouponByCode(String)
- static getCouponByCode(couponCode: [String](TopLevel.String.md)): [Coupon](dw.campaign.Coupon.md)
  - : Tries to find a coupon for the given coupon code. The method first
      searches for a coupon with a fixed code matching the passed value. If no
      such fixed coupon is found, it searches for a coupon with a
      system-generated code matching the passed value. If found, the coupon is
      returned. Otherwise, the method returns null.


    **Parameters:**
    - couponCode - The coupon code to get the coupon for.

    **Returns:**
    - The coupon with the matching coupon code or null if no coupon was
              found.



---

### getCoupons()
- static getCoupons(): [Collection](dw.util.Collection.md)
  - : Returns all coupons in the current site in no specific order.

    **Returns:**
    - Coupons in current site


---

### getRedemptions(String, String)
- static getRedemptions(couponID: [String](TopLevel.String.md), couponCode: [String](TopLevel.String.md)): [Collection](dw.util.Collection.md)
  - : Returns list of CouponRedemptions for the specified coupon and coupon code,
      sorted by redemption date descending (i.e. last redemption first).
      Usually, there should only either be 0 or 1 redemption. But if a coupon and code
      is removed and recreated and re-issued later, there might be multiple such redemption records.
      Returns an empty list if no redemption record exists in system for the specified coupon and code.


    **Parameters:**
    - couponID - The coupon id to find redemption for.
    - couponCode - The coupon code to find redemption for.

    **Returns:**
    - A sorted list of CouponRedemptions for the specified coupon and coupon code or
      an empty list if no redemption record exists.



---

### maskRedemptions(String, String)
- static maskRedemptions(siteID: [String](TopLevel.String.md), email: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : Mask customer email address in coupon redemptions for the given siteID and email address

    **Parameters:**
    - siteID - the site ID
    - email - the customer email address

    **Returns:**
    - The status of the masking result


---

<!-- prettier-ignore-end -->
