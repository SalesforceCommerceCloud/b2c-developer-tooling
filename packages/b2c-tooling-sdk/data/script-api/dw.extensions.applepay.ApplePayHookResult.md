<!-- prettier-ignore-start -->
# Class ApplePayHookResult

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.applepay.ApplePayHookResult](dw.extensions.applepay.ApplePayHookResult.md)



Result of a hook handling an Apple Pay request.





Use the constants in this type to indicate specific error reasons to be provided
to Apple Pay JS. For example, the following code creates a [Status](dw.system.Status.md)
that indicates the shipping contact information provided by Apple Pay is invalid:




```
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var Status = require('dw/system/Status');

var error = new Status(Status.ERROR);
error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_CONTACT);
```




If a specific error reason is not provided, the generic Apple Pay `STATUS_FAILURE`
reason will be used when necessary.



## Constant Summary

| Constant | Description |
| --- | --- |
| [REASON_BILLING_ADDRESS](#reason_billing_address): [String](TopLevel.String.md) = "InvalidBillingPostalAddress" | Error reason code representing an invalid billing address. |
| [REASON_FAILURE](#reason_failure): [String](TopLevel.String.md) = "Failure" | Error reason code representing an error or failure not otherwise specified. |
| [REASON_PIN_INCORRECT](#reason_pin_incorrect): [String](TopLevel.String.md) = "PINIncorrect" | Error reason code representing the PIN is incorrect. |
| [REASON_PIN_LOCKOUT](#reason_pin_lockout): [String](TopLevel.String.md) = "PINLockout" | Error reason code representing a PIN lockout. |
| [REASON_PIN_REQUIRED](#reason_pin_required): [String](TopLevel.String.md) = "PINRequired" | Error reason code representing a PIN is required. |
| [REASON_SHIPPING_ADDRESS](#reason_shipping_address): [String](TopLevel.String.md) = "InvalidShippingPostalAddress" | Error reason code representing an invalid shipping address. |
| [REASON_SHIPPING_CONTACT](#reason_shipping_contact): [String](TopLevel.String.md) = "InvalidShippingContact" | Error reason code representing invalid shipping contact information. |
| [STATUS_REASON_DETAIL_KEY](#status_reason_detail_key): [String](TopLevel.String.md) = "reason" | Key for the detail to be used in [Status](dw.system.Status.md) objects to indicate  the reason to communicate to Apple Pay for errors. |

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
| [ApplePayHookResult](#applepayhookresultstatus-url)([Status](dw.system.Status.md), [URL](dw.web.URL.md)) | Constructs a result with the given outcome information. |

## Method Summary

| Method | Description |
| --- | --- |
| [getEventDetail](dw.extensions.applepay.ApplePayHookResult.md#geteventdetail)() | Detail to the JS custom event to dispatch in response to this result. |
| [getEventName](dw.extensions.applepay.ApplePayHookResult.md#geteventname)() | Name of the JS custom event to dispatch in response to this result. |
| [getRedirect](dw.extensions.applepay.ApplePayHookResult.md#getredirect)() | URL to navigate to in response to this result. |
| [getStatus](dw.extensions.applepay.ApplePayHookResult.md#getstatus)() | Status describing the outcome of this result. |
| [setEvent](dw.extensions.applepay.ApplePayHookResult.md#seteventstring)([String](TopLevel.String.md)) | Sets the name of the JS custom event to dispatch in response to this result. |
| [setEvent](dw.extensions.applepay.ApplePayHookResult.md#seteventstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Sets the name and detail of the JS custom event to dispatch in response to this result. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### REASON_BILLING_ADDRESS

- REASON_BILLING_ADDRESS: [String](TopLevel.String.md) = "InvalidBillingPostalAddress"
  - : Error reason code representing an invalid billing address.


---

### REASON_FAILURE

- REASON_FAILURE: [String](TopLevel.String.md) = "Failure"
  - : Error reason code representing an error or failure not otherwise specified.


---

### REASON_PIN_INCORRECT

- REASON_PIN_INCORRECT: [String](TopLevel.String.md) = "PINIncorrect"
  - : Error reason code representing the PIN is incorrect.


---

### REASON_PIN_LOCKOUT

- REASON_PIN_LOCKOUT: [String](TopLevel.String.md) = "PINLockout"
  - : Error reason code representing a PIN lockout.


---

### REASON_PIN_REQUIRED

- REASON_PIN_REQUIRED: [String](TopLevel.String.md) = "PINRequired"
  - : Error reason code representing a PIN is required.


---

### REASON_SHIPPING_ADDRESS

- REASON_SHIPPING_ADDRESS: [String](TopLevel.String.md) = "InvalidShippingPostalAddress"
  - : Error reason code representing an invalid shipping address.


---

### REASON_SHIPPING_CONTACT

- REASON_SHIPPING_CONTACT: [String](TopLevel.String.md) = "InvalidShippingContact"
  - : Error reason code representing invalid shipping contact information.


---

### STATUS_REASON_DETAIL_KEY

- STATUS_REASON_DETAIL_KEY: [String](TopLevel.String.md) = "reason"
  - : Key for the detail to be used in [Status](dw.system.Status.md) objects to indicate
      the reason to communicate to Apple Pay for errors.



---

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

### ApplePayHookResult(Status, URL)
- ApplePayHookResult(status: [Status](dw.system.Status.md), redirect: [URL](dw.web.URL.md))
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
