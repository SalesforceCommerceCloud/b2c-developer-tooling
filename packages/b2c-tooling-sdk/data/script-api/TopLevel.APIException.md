<!-- prettier-ignore-start -->
# Class APIException

- [TopLevel.Object](TopLevel.Object.md)
  - [TopLevel.Error](TopLevel.Error.md)
    - [TopLevel.APIException](TopLevel.APIException.md)

This error indicates an exceptional outcome of some business logic. Instances of
this exception in general provide additional information about the reason of this case.
See the actual type referred by the type property for the description of the properties
with this additional information.



Limitation: The sub classes of this APIException shown in this documentation actually do not exist.
All instances are of type APIException, but with different property sets as listed in the sub classes.



The APIException is always related to a systems internal Java exception. The class provides
access to some more details about this internal Java exception.



## All Known Subclasses
[AspectAttributeValidationException](dw.experience.AspectAttributeValidationException.md), [CreateAgentBasketLimitExceededException](dw.order.CreateAgentBasketLimitExceededException.md), [CreateBasketFromOrderException](dw.order.CreateBasketFromOrderException.md), [CreateCouponLineItemException](dw.order.CreateCouponLineItemException.md), [CreateOrderException](dw.order.CreateOrderException.md), [CreateTemporaryBasketLimitExceededException](dw.order.CreateTemporaryBasketLimitExceededException.md), [ShopperContextException](dw.customer.shoppercontext.ShopperContextException.md)
## Property Summary

| Property | Description |
| --- | --- |
| [causeFullName](#causefullname): [String](TopLevel.String.md) | If the exception is associated with a root cause, the property  contains the full name of the associated Java exception. |
| [causeMessage](#causemessage): [String](TopLevel.String.md) | If the exception is associated with a root cause, the property  contains the message of the associated Java exception. |
| [causeName](#causename): [String](TopLevel.String.md) | If the exception is associated with a root cause, the property  contains the simplified name of the associated Java exception. |
| [javaFullName](#javafullname): [String](TopLevel.String.md) | The full name of the underlying Java exception. |
| [javaMessage](#javamessage): [String](TopLevel.String.md) | The message of the underlying Java exception. |
| [javaName](#javaname): [String](TopLevel.String.md) | The simplified name of the underlying Java exception. |
| [type](#type): [String](TopLevel.String.md) | The name of the actual APIException type, without the package name. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [APIException](#apiexception)() |  |

## Method Summary

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### causeFullName
- causeFullName: [String](TopLevel.String.md)
  - : If the exception is associated with a root cause, the property
      contains the full name of the associated Java exception.



---

### causeMessage
- causeMessage: [String](TopLevel.String.md)
  - : If the exception is associated with a root cause, the property
      contains the message of the associated Java exception.



---

### causeName
- causeName: [String](TopLevel.String.md)
  - : If the exception is associated with a root cause, the property
      contains the simplified name of the associated Java exception.



---

### javaFullName
- javaFullName: [String](TopLevel.String.md)
  - : The full name of the underlying Java exception.


---

### javaMessage
- javaMessage: [String](TopLevel.String.md)
  - : The message of the underlying Java exception.


---

### javaName
- javaName: [String](TopLevel.String.md)
  - : The simplified name of the underlying Java exception.


---

### type
- type: [String](TopLevel.String.md)
  - : The name of the actual APIException type, without the package name.


---

## Constructor Details

### APIException()
- APIException()
  - : 


---

<!-- prettier-ignore-end -->
