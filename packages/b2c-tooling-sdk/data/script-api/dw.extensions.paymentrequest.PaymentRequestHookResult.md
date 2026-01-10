<!-- prettier-ignore-start -->
# Class PaymentRequestHookResult

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.paymentrequest.PaymentRequestHookResult](dw.extensions.paymentrequest.PaymentRequestHookResult.md)

Result of a hook handling a Payment Request request

**Deprecated:**
:::warning
Salesforce Payments includes support for Google Pay
:::

## Property Summary

| Property | Description |
| --- | --- |
| [eventDetail](#eventdetail): [Object](TopLevel.Object.md) `(read-only)` | Detail to the JS custom event to dispatch in response to this result. |
| [eventName](#eventname): [String](TopLevel.String.md) `(read-only)` | Name of the JS custom event to dispatch in response to this result. |
| [redirect](#redirect): [URL](dw.web.URL.md) `(read-only)` | URL to navigate to in response to this result. |
| [status](#status): [Status](dw.system.Status.md) `(read-only)` | Status describing the outcome of this result. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [PaymentRequestHookResult](#paymentrequesthookresultstatus-url)([Status](dw.system.Status.md), [URL](dw.web.URL.md)) | Constructs a result with the given outcome information. |

## Method Summary

| Method | Description |
| --- | --- |
| [getEventDetail](dw.extensions.paymentrequest.PaymentRequestHookResult.md#geteventdetail)() | Detail to the JS custom event to dispatch in response to this result. |
| [getEventName](dw.extensions.paymentrequest.PaymentRequestHookResult.md#geteventname)() | Name of the JS custom event to dispatch in response to this result. |
| [getRedirect](dw.extensions.paymentrequest.PaymentRequestHookResult.md#getredirect)() | URL to navigate to in response to this result. |
| [getStatus](dw.extensions.paymentrequest.PaymentRequestHookResult.md#getstatus)() | Status describing the outcome of this result. |
| [setEvent](dw.extensions.paymentrequest.PaymentRequestHookResult.md#seteventstring)([String](TopLevel.String.md)) | Sets the name of the JS custom event to dispatch in response to this result. |
| [setEvent](dw.extensions.paymentrequest.PaymentRequestHookResult.md#seteventstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Sets the name and detail of the JS custom event to dispatch in response to this result. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### eventDetail
- eventDetail: [Object](TopLevel.Object.md) `(read-only)`
  - : Detail to the JS custom event to dispatch in response to this result.


---

### eventName
- eventName: [String](TopLevel.String.md) `(read-only)`
  - : Name of the JS custom event to dispatch in response to this result.


---

### redirect
- redirect: [URL](dw.web.URL.md) `(read-only)`
  - : URL to navigate to in response to this result.


---

### status
- status: [Status](dw.system.Status.md) `(read-only)`
  - : Status describing the outcome of this result.


---

## Constructor Details

### PaymentRequestHookResult(Status, URL)
- PaymentRequestHookResult(status: [Status](dw.system.Status.md), redirect: [URL](dw.web.URL.md))
  - : Constructs a result with the given outcome information.

    **Parameters:**
    - status - status of the result
    - redirect - optional URL to which to navigate to in response to this outcome


---

## Method Details

### getEventDetail()
- getEventDetail(): [Object](TopLevel.Object.md)
  - : Detail to the JS custom event to dispatch in response to this result.

    **Returns:**
    - event detail


---

### getEventName()
- getEventName(): [String](TopLevel.String.md)
  - : Name of the JS custom event to dispatch in response to this result.

    **Returns:**
    - event name


---

### getRedirect()
- getRedirect(): [URL](dw.web.URL.md)
  - : URL to navigate to in response to this result.

    **Returns:**
    - redirect URL


---

### getStatus()
- getStatus(): [Status](dw.system.Status.md)
  - : Status describing the outcome of this result.

    **Returns:**
    - status of this result


---

### setEvent(String)
- setEvent(name: [String](TopLevel.String.md)): void
  - : Sets the name of the JS custom event to dispatch in response to this result.

    **Parameters:**
    - name - JS custom event name


---

### setEvent(String, Object)
- setEvent(name: [String](TopLevel.String.md), detail: [Object](TopLevel.Object.md)): void
  - : Sets the name and detail of the JS custom event to dispatch in response to this result.

    **Parameters:**
    - name - JS custom event name
    - detail - JS custom event detail


---

<!-- prettier-ignore-end -->
