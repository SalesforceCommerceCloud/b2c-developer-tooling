<!-- prettier-ignore-start -->
# Class Coupon

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.campaign.Coupon](dw.campaign.Coupon.md)

Represents a coupon in Commerce Cloud Digital.


## Constant Summary

| Constant | Description |
| --- | --- |
| [TYPE_MULTIPLE_CODES](#type_multiple_codes): [String](TopLevel.String.md) = "MULTIPLE_CODES" | Constant representing coupon type _multiple-codes_. |
| [TYPE_SINGLE_CODE](#type_single_code): [String](TopLevel.String.md) = "SINGLE_CODE" | Constant representing coupon type _single-code_. |
| [TYPE_SYSTEM_CODES](#type_system_codes): [String](TopLevel.String.md) = "SYSTEM_CODES" | Constant representing coupon type _system-codes_. |

## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the ID of the coupon. |
| [codePrefix](#codeprefix): [String](TopLevel.String.md) `(read-only)` | Returns the prefix defined for coupons of type [TYPE_SYSTEM_CODES](dw.campaign.Coupon.md#type_system_codes)  If no prefix is defined, or coupon is of type [TYPE_SINGLE_CODE](dw.campaign.Coupon.md#type_single_code)  or [TYPE_MULTIPLE_CODES](dw.campaign.Coupon.md#type_multiple_codes), null is returned. |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns true if coupon is enabled, else false. |
| [nextCouponCode](#nextcouponcode): [String](TopLevel.String.md) `(read-only)` | Returns the next unissued code of this coupon. |
| [promotions](#promotions): [Collection](dw.util.Collection.md) `(read-only)` | Returns the coupon-based promotions directly or indirectly (through  campaigns) assigned to this coupon. |
| [redemptionLimitPerCode](#redemptionlimitpercode): [Number](TopLevel.Number.md) `(read-only)` | Returns the defined limit on redemption per coupon code. |
| [redemptionLimitPerCustomer](#redemptionlimitpercustomer): [Number](TopLevel.Number.md) `(read-only)` | Returns the defined limit on redemption of this coupon per customer. |
| [redemptionLimitPerTimeFrame](#redemptionlimitpertimeframe): [Number](TopLevel.Number.md) `(read-only)` | Returns the defined limit on redemption per customer per time-frame (see  [getRedemptionLimitTimeFrame()](dw.campaign.Coupon.md#getredemptionlimittimeframe). |
| [redemptionLimitTimeFrame](#redemptionlimittimeframe): [Number](TopLevel.Number.md) `(read-only)` | Returns the time-frame (in days) of the defined limit on redemption per  customer per time-frame. |
| [type](#type): [String](TopLevel.String.md) `(read-only)` | Returns the coupon type. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCodePrefix](dw.campaign.Coupon.md#getcodeprefix)() | Returns the prefix defined for coupons of type [TYPE_SYSTEM_CODES](dw.campaign.Coupon.md#type_system_codes)  If no prefix is defined, or coupon is of type [TYPE_SINGLE_CODE](dw.campaign.Coupon.md#type_single_code)  or [TYPE_MULTIPLE_CODES](dw.campaign.Coupon.md#type_multiple_codes), null is returned. |
| [getID](dw.campaign.Coupon.md#getid)() | Returns the ID of the coupon. |
| [getNextCouponCode](dw.campaign.Coupon.md#getnextcouponcode)() | Returns the next unissued code of this coupon. |
| [getPromotions](dw.campaign.Coupon.md#getpromotions)() | Returns the coupon-based promotions directly or indirectly (through  campaigns) assigned to this coupon. |
| [getRedemptionLimitPerCode](dw.campaign.Coupon.md#getredemptionlimitpercode)() | Returns the defined limit on redemption per coupon code. |
| [getRedemptionLimitPerCustomer](dw.campaign.Coupon.md#getredemptionlimitpercustomer)() | Returns the defined limit on redemption of this coupon per customer. |
| [getRedemptionLimitPerTimeFrame](dw.campaign.Coupon.md#getredemptionlimitpertimeframe)() | Returns the defined limit on redemption per customer per time-frame (see  [getRedemptionLimitTimeFrame()](dw.campaign.Coupon.md#getredemptionlimittimeframe). |
| [getRedemptionLimitTimeFrame](dw.campaign.Coupon.md#getredemptionlimittimeframe)() | Returns the time-frame (in days) of the defined limit on redemption per  customer per time-frame. |
| [getType](dw.campaign.Coupon.md#gettype)() | Returns the coupon type. |
| [isEnabled](dw.campaign.Coupon.md#isenabled)() | Returns true if coupon is enabled, else false. |

### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### TYPE_MULTIPLE_CODES

- TYPE_MULTIPLE_CODES: [String](TopLevel.String.md) = "MULTIPLE_CODES"
  - : Constant representing coupon type _multiple-codes_.


---

### TYPE_SINGLE_CODE

- TYPE_SINGLE_CODE: [String](TopLevel.String.md) = "SINGLE_CODE"
  - : Constant representing coupon type _single-code_.


---

### TYPE_SYSTEM_CODES

- TYPE_SYSTEM_CODES: [String](TopLevel.String.md) = "SYSTEM_CODES"
  - : Constant representing coupon type _system-codes_.


---

## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID of the coupon.


---

### codePrefix
- codePrefix: [String](TopLevel.String.md) `(read-only)`
  - : Returns the prefix defined for coupons of type [TYPE_SYSTEM_CODES](dw.campaign.Coupon.md#type_system_codes)
      If no prefix is defined, or coupon is of type [TYPE_SINGLE_CODE](dw.campaign.Coupon.md#type_single_code)
      or [TYPE_MULTIPLE_CODES](dw.campaign.Coupon.md#type_multiple_codes), null is returned.



---

### enabled
- enabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns true if coupon is enabled, else false.


---

### nextCouponCode
- nextCouponCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the next unissued code of this coupon.
      For single-code coupons, the single fixed coupon code is returned.
      For all multi-code coupons, the next available, unissued coupon code is returned.
      If all codes of the coupon have been issued, then there is no next code, and null is returned.
      
      A transaction is required when calling this method. This needs to be ensured by the calling script.



---

### promotions
- promotions: [Collection](dw.util.Collection.md) `(read-only)`
  - : Returns the coupon-based promotions directly or indirectly (through
      campaigns) assigned to this coupon.



---

### redemptionLimitPerCode
- redemptionLimitPerCode: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the defined limit on redemption per coupon code. Null is
      returned if no limit is defined, which means that each code can be
      redeemed an unlimited number of times.



---

### redemptionLimitPerCustomer
- redemptionLimitPerCustomer: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the defined limit on redemption of this coupon per customer.
      Null is returned if no limit is defined, which means that customers can
      redeem this coupon an unlimited number of times.



---

### redemptionLimitPerTimeFrame
- redemptionLimitPerTimeFrame: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the defined limit on redemption per customer per time-frame (see
      [getRedemptionLimitTimeFrame()](dw.campaign.Coupon.md#getredemptionlimittimeframe). Null is returned if no limit is
      defined, which means that there is no time-specific redemption limit for
      customers.


    **See Also:**
    - [getRedemptionLimitTimeFrame()](dw.campaign.Coupon.md#getredemptionlimittimeframe)


---

### redemptionLimitTimeFrame
- redemptionLimitTimeFrame: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the time-frame (in days) of the defined limit on redemption per
      customer per time-frame. Null is returned if no limit is defined, which
      means that there is no time-specific redemption limit for customers.


    **See Also:**
    - [getRedemptionLimitPerTimeFrame()](dw.campaign.Coupon.md#getredemptionlimitpertimeframe)


---

### type
- type: [String](TopLevel.String.md) `(read-only)`
  - : Returns the coupon type.
      Possible values are [TYPE_SINGLE_CODE](dw.campaign.Coupon.md#type_single_code), [TYPE_MULTIPLE_CODES](dw.campaign.Coupon.md#type_multiple_codes)
      and [TYPE_SYSTEM_CODES](dw.campaign.Coupon.md#type_system_codes).



---

## Method Details

### getCodePrefix()
- getCodePrefix(): [String](TopLevel.String.md)
  - : Returns the prefix defined for coupons of type [TYPE_SYSTEM_CODES](dw.campaign.Coupon.md#type_system_codes)
      If no prefix is defined, or coupon is of type [TYPE_SINGLE_CODE](dw.campaign.Coupon.md#type_single_code)
      or [TYPE_MULTIPLE_CODES](dw.campaign.Coupon.md#type_multiple_codes), null is returned.


    **Returns:**
    - Coupon code prefix or null


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the ID of the coupon.

    **Returns:**
    - Coupon ID


---

### getNextCouponCode()
- getNextCouponCode(): [String](TopLevel.String.md)
  - : Returns the next unissued code of this coupon.
      For single-code coupons, the single fixed coupon code is returned.
      For all multi-code coupons, the next available, unissued coupon code is returned.
      If all codes of the coupon have been issued, then there is no next code, and null is returned.
      
      A transaction is required when calling this method. This needs to be ensured by the calling script.


    **Returns:**
    - Next available code of this coupon, or null if there are no available codes.


---

### getPromotions()
- getPromotions(): [Collection](dw.util.Collection.md)
  - : Returns the coupon-based promotions directly or indirectly (through
      campaigns) assigned to this coupon.


    **Returns:**
    - Promotions assigned to the coupon in no particular order.


---

### getRedemptionLimitPerCode()
- getRedemptionLimitPerCode(): [Number](TopLevel.Number.md)
  - : Returns the defined limit on redemption per coupon code. Null is
      returned if no limit is defined, which means that each code can be
      redeemed an unlimited number of times.


    **Returns:**
    - The maximum number of redemption per coupon code


---

### getRedemptionLimitPerCustomer()
- getRedemptionLimitPerCustomer(): [Number](TopLevel.Number.md)
  - : Returns the defined limit on redemption of this coupon per customer.
      Null is returned if no limit is defined, which means that customers can
      redeem this coupon an unlimited number of times.


    **Returns:**
    - The maximum number of redemption per customer


---

### getRedemptionLimitPerTimeFrame()
- getRedemptionLimitPerTimeFrame(): [Number](TopLevel.Number.md)
  - : Returns the defined limit on redemption per customer per time-frame (see
      [getRedemptionLimitTimeFrame()](dw.campaign.Coupon.md#getredemptionlimittimeframe). Null is returned if no limit is
      defined, which means that there is no time-specific redemption limit for
      customers.


    **Returns:**
    - The maximum number of redemption per customer within time-frame

    **See Also:**
    - [getRedemptionLimitTimeFrame()](dw.campaign.Coupon.md#getredemptionlimittimeframe)


---

### getRedemptionLimitTimeFrame()
- getRedemptionLimitTimeFrame(): [Number](TopLevel.Number.md)
  - : Returns the time-frame (in days) of the defined limit on redemption per
      customer per time-frame. Null is returned if no limit is defined, which
      means that there is no time-specific redemption limit for customers.


    **Returns:**
    - Timeframe (days) of redemption per time

    **See Also:**
    - [getRedemptionLimitPerTimeFrame()](dw.campaign.Coupon.md#getredemptionlimitpertimeframe)


---

### getType()
- getType(): [String](TopLevel.String.md)
  - : Returns the coupon type.
      Possible values are [TYPE_SINGLE_CODE](dw.campaign.Coupon.md#type_single_code), [TYPE_MULTIPLE_CODES](dw.campaign.Coupon.md#type_multiple_codes)
      and [TYPE_SYSTEM_CODES](dw.campaign.Coupon.md#type_system_codes).


    **Returns:**
    - Coupon type


---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Returns true if coupon is enabled, else false.

    **Returns:**
    - true if coupon is enabled.


---

<!-- prettier-ignore-end -->
