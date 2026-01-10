<!-- prettier-ignore-start -->
# Class CreateBasketFromOrderException

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.CreateBasketFromOrderException](dw.order.CreateBasketFromOrderException.md)

This APIException is thrown by method [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder)
to indicate no Basket could be created from the Order.



## Property Summary

| Property | Description |
| --- | --- |
| [errorCode](#errorcode): [String](TopLevel.String.md) `(read-only)` | Indicates reason why [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder) failed. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getErrorCode](dw.order.CreateBasketFromOrderException.md#geterrorcode)() | Indicates reason why [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder) failed. |

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### errorCode
- errorCode: [String](TopLevel.String.md) `(read-only)`
  - : Indicates reason why [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder) failed.


---

## Method Details

### getErrorCode()
- getErrorCode(): [String](TopLevel.String.md)
  - : Indicates reason why [BasketMgr.createBasketFromOrder(Order)](dw.order.BasketMgr.md#createbasketfromorderorder) failed.

    **Returns:**
    - the error code.


---

<!-- prettier-ignore-end -->
