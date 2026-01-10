<!-- prettier-ignore-start -->
# Class ShopperContextException

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.shoppercontext.ShopperContextException](dw.customer.shoppercontext.ShopperContextException.md)

This exception could be thrown by
[ShopperContextMgr.setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean),
[ShopperContextMgr.getShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext) and
[ShopperContextMgr.removeShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext) when an error occurs.


'errorCode' property is set to one of the following values:

- [ShopperContextErrorCodes.FEATURE_DISABLED](dw.customer.shoppercontext.ShopperContextErrorCodes.md#feature_disabled)= Indicates that the Shopper Context  Feature is not enabled.
- [ShopperContextErrorCodes.CUSTOM_QUALIFIERS_LIMIT_EXCEEDED](dw.customer.shoppercontext.ShopperContextErrorCodes.md#custom_qualifiers_limit_exceeded)= Indicates that the  number of custom qualifiers in [ShopperContext](dw.customer.shoppercontext.ShopperContext.md)has exceeded the allowed limit.
- [ShopperContextErrorCodes.ASSIGNMENT_QUALIFIERS_LIMIT_EXCEEDED](dw.customer.shoppercontext.ShopperContextErrorCodes.md#assignment_qualifiers_limit_exceeded)= Indicates that  the number of assignment qualifiers in [ShopperContext](dw.customer.shoppercontext.ShopperContext.md)has exceeded the allowed  limit.
- [ShopperContextErrorCodes.QUOTA_LIMIT_EXCEEDED](dw.customer.shoppercontext.ShopperContextErrorCodes.md#quota_limit_exceeded)= Indicates that the quota limit  for the Shopper Context has been reached.  
For more information on shopper context quota limits please refer to:  [Shopper Context Quota Limits](https://developer.salesforce.com/docs/commerce/commerce-api/guide/shopper-context-api.html\#constraints)

- [ShopperContextErrorCodes.INTERNAL_ERROR](dw.customer.shoppercontext.ShopperContextErrorCodes.md#internal_error)= Indicates that an error occurred  while setting, retrieving or deleting the shopper context.
- [ShopperContextErrorCodes.INVALID_ARGUMENT](dw.customer.shoppercontext.ShopperContextErrorCodes.md#invalid_argument)= Indicates that an invalid client  IP address was set in the Shopper Context.
- [ShopperContextErrorCodes.INVALID_REQUEST_TYPE](dw.customer.shoppercontext.ShopperContextErrorCodes.md#invalid_request_type)= Indicates that the request  type is invalid. Request must be a SCAPI request, or a hybrid storefront request, or an OCAPI request using a SLAS  token.



## Property Summary

| Property | Description |
| --- | --- |
| [errorCode](#errorcode): [String](TopLevel.String.md) `(read-only)` | Indicates reason why the following methods failed:  [ShopperContextMgr.setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean) or  [ShopperContextMgr.getShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext) or  [ShopperContextMgr.removeShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext) failed. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getErrorCode](dw.customer.shoppercontext.ShopperContextException.md#geterrorcode)() | Indicates reason why the following methods failed:  [ShopperContextMgr.setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean) or  [ShopperContextMgr.getShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext) or  [ShopperContextMgr.removeShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext) failed. |

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### errorCode
- errorCode: [String](TopLevel.String.md) `(read-only)`
  - : Indicates reason why the following methods failed:
      [ShopperContextMgr.setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean) or
      [ShopperContextMgr.getShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext) or
      [ShopperContextMgr.removeShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext) failed.



---

## Method Details

### getErrorCode()
- getErrorCode(): [String](TopLevel.String.md)
  - : Indicates reason why the following methods failed:
      [ShopperContextMgr.setShopperContext(ShopperContext, Boolean)](dw.customer.shoppercontext.ShopperContextMgr.md#setshoppercontextshoppercontext-boolean) or
      [ShopperContextMgr.getShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#getshoppercontext) or
      [ShopperContextMgr.removeShopperContext()](dw.customer.shoppercontext.ShopperContextMgr.md#removeshoppercontext) failed.


    **Returns:**
    - The error code.


---

<!-- prettier-ignore-end -->
