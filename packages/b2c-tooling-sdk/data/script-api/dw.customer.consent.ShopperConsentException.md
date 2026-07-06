<!-- prettier-ignore-start -->
# Class ShopperConsentException

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.consent.ShopperConsentException](dw.customer.consent.ShopperConsentException.md)

This exception is thrown by [ShopperConsentMgr](dw.customer.consent.ShopperConsentMgr.md) methods when an error occurs
during consent subscription operations.


The 'errorCode' property is set to one of the following values:

- [ShopperConsentErrorCodes.FEATURE_DISABLED](dw.customer.consent.ShopperConsentErrorCodes.md#feature_disabled)- Indicates that the Marketing Consent  feature is not enabled.
- [ShopperConsentErrorCodes.RETRIEVAL_ERROR](dw.customer.consent.ShopperConsentErrorCodes.md#retrieval_error)- Indicates that an error occurred while  retrieving consent subscriptions.
- [ShopperConsentErrorCodes.UPDATE_ERROR](dw.customer.consent.ShopperConsentErrorCodes.md#update_error)- Indicates that an error occurred while  updating consent subscriptions.
- [ShopperConsentErrorCodes.CUSTOMER_NOT_AUTHENTICATED](dw.customer.consent.ShopperConsentErrorCodes.md#customer_not_authenticated)- Indicates that the customer  is not authenticated (required for consent status retrieval).
- [ShopperConsentErrorCodes.INTERNAL_ERROR](dw.customer.consent.ShopperConsentErrorCodes.md#internal_error)- Indicates that an internal error occurred.



## Property Summary

| Property | Description |
| --- | --- |
| [errorCode](#errorcode): [String](TopLevel.String.md) `(read-only)` | Returns the error code indicating the reason for the failure. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getErrorCode](dw.customer.consent.ShopperConsentException.md#geterrorcode)() | Returns the error code indicating the reason for the failure. |

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### errorCode
- errorCode: [String](TopLevel.String.md) `(read-only)`
  - : Returns the error code indicating the reason for the failure.


---

## Method Details

### getErrorCode()
- getErrorCode(): [String](TopLevel.String.md)
  - : Returns the error code indicating the reason for the failure.

    **Returns:**
    - The error code.


---

<!-- prettier-ignore-end -->
