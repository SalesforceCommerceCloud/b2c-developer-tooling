<!-- prettier-ignore-start -->
# Class CampaignStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.campaign.CampaignStatusCodes](dw.campaign.CampaignStatusCodes.md)

Deprecated. Formerly used to contain the various statuses that a coupon may
be in.


**Deprecated:**
:::warning
Use [CouponStatusCodes](dw.campaign.CouponStatusCodes.md) instead.
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[COUPON_ALREADY_APPLIED](#coupon_already_applied): [String](TopLevel.String.md) = "COUPON_ALREADY_APPLIED"~~ | Indicates that the coupon has already been applied to the basket. |
| ~~[COUPON_ALREADY_REDEEMED](#coupon_already_redeemed): [String](TopLevel.String.md) = "COUPON_ALREADY_REDEEMED"~~ | Indicates that the coupon has already been redeemed. |
| ~~[COUPON_NOT_REDEEMABLE](#coupon_not_redeemable): [String](TopLevel.String.md) = "COUPON_NOT_REDEEMABLE"~~ | Indicates that the coupon is not currently redeemable. |
| ~~[COUPON_UNKNOWN](#coupon_unknown): [String](TopLevel.String.md) = "COUPON_UNKNOWN"~~ | Indicates that the coupon code is not valid. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [CampaignStatusCodes](#campaignstatuscodes)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### COUPON_ALREADY_APPLIED

- ~~COUPON_ALREADY_APPLIED: [String](TopLevel.String.md) = "COUPON_ALREADY_APPLIED"~~
  - : Indicates that the coupon has already been applied to the basket.

    **Deprecated:**
:::warning
Use [CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET](dw.campaign.CouponStatusCodes.md#coupon_code_already_in_basket),
[CouponStatusCodes.COUPON_ALREADY_IN_BASKET](dw.campaign.CouponStatusCodes.md#coupon_already_in_basket) instead.

:::

---

### COUPON_ALREADY_REDEEMED

- ~~COUPON_ALREADY_REDEEMED: [String](TopLevel.String.md) = "COUPON_ALREADY_REDEEMED"~~
  - : Indicates that the coupon has already been redeemed.

    **Deprecated:**
:::warning
Use [CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED](dw.campaign.CouponStatusCodes.md#coupon_code_already_redeemed) instead.
:::

---

### COUPON_NOT_REDEEMABLE

- ~~COUPON_NOT_REDEEMABLE: [String](TopLevel.String.md) = "COUPON_NOT_REDEEMABLE"~~
  - : Indicates that the coupon is not currently redeemable.

    **Deprecated:**
:::warning
Use [CouponStatusCodes.COUPON_DISABLED](dw.campaign.CouponStatusCodes.md#coupon_disabled),
[CouponStatusCodes.COUPON_CODE_UNKNOWN](dw.campaign.CouponStatusCodes.md#coupon_code_unknown),
[CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#redemption_limit_exceeded),
[CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#customer_redemption_limit_exceeded),
[CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED](dw.campaign.CouponStatusCodes.md#timeframe_redemption_limit_exceeded) or
[CouponStatusCodes.NO_APPLICABLE_PROMOTION](dw.campaign.CouponStatusCodes.md#no_applicable_promotion)

:::

---

### COUPON_UNKNOWN

- ~~COUPON_UNKNOWN: [String](TopLevel.String.md) = "COUPON_UNKNOWN"~~
  - : Indicates that the coupon code is not valid.

    **Deprecated:**
:::warning
Use [CouponStatusCodes.COUPON_CODE_UNKNOWN](dw.campaign.CouponStatusCodes.md#coupon_code_unknown) instead
:::

---

## Constructor Details

### CampaignStatusCodes()
- CampaignStatusCodes()
  - : 


---

<!-- prettier-ignore-end -->
