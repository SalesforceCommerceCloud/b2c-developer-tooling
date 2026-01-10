<!-- prettier-ignore-start -->
# Class Result

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.svc.Result](dw.svc.Result.md)

Represents the result of a service call.


## Constant Summary

| Constant | Description |
| --- | --- |
| [ERROR](#error): [String](TopLevel.String.md) = "ERROR" | Status indicating a general service error. |
| [OK](#ok): [String](TopLevel.String.md) = "OK" | Status indicating a successful service call. |
| [SERVICE_UNAVAILABLE](#service_unavailable): [String](TopLevel.String.md) = "SERVICE_UNAVAILABLE" | Status indicating the service is unavailable. |
| [UNAVAILABLE_CIRCUIT_BROKEN](#unavailable_circuit_broken): [String](TopLevel.String.md) = "CIRCUIT_BROKEN" | Unavailable reason: No call was made because the circuit breaker prevented it. |
| [UNAVAILABLE_CONFIG_PROBLEM](#unavailable_config_problem): [String](TopLevel.String.md) = "CONFIG_PROBLEM" | Unavailable reason: No call was made because the service was not configured correctly. |
| [UNAVAILABLE_DISABLED](#unavailable_disabled): [String](TopLevel.String.md) = "DISABLED" | Unavailable reason: No call was made because the service is disabled. |
| [UNAVAILABLE_RATE_LIMITED](#unavailable_rate_limited): [String](TopLevel.String.md) = "RATE_LIMITED" | Unavailable reason: No call was made because the rate limit was hit. |
| [UNAVAILABLE_TIMEOUT](#unavailable_timeout): [String](TopLevel.String.md) = "TIMEOUT" | Unavailable reason: A real call was made but a timeout occurred. |

## Property Summary

| Property | Description |
| --- | --- |
| [error](#error): [Number](TopLevel.Number.md) `(read-only)` | Returns an error-specific code if applicable. |
| [errorMessage](#errormessage): [String](TopLevel.String.md) `(read-only)` | Returns an error message on a non-OK status. |
| [mockResult](#mockresult): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the status of whether the response is the result of a "mock" service call. |
| [msg](#msg): [String](TopLevel.String.md) `(read-only)` | Returns an extra error message on failure (if any). |
| [object](#object): [Object](TopLevel.Object.md) `(read-only)` | Returns the actual object returned by the service when the status is OK. |
| [ok](#ok): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns the status of whether the service call was successful. |
| [status](#status): [String](TopLevel.String.md) `(read-only)` | Returns the status. |
| [unavailableReason](#unavailablereason): [String](TopLevel.String.md) `(read-only)` | Returns the reason the status is SERVICE\_UNAVAILABLE. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Result](#result)() | Constructs a new result instance. |

## Method Summary

| Method | Description |
| --- | --- |
| [getError](dw.svc.Result.md#geterror)() | Returns an error-specific code if applicable. |
| [getErrorMessage](dw.svc.Result.md#geterrormessage)() | Returns an error message on a non-OK status. |
| [getMsg](dw.svc.Result.md#getmsg)() | Returns an extra error message on failure (if any). |
| [getObject](dw.svc.Result.md#getobject)() | Returns the actual object returned by the service when the status is OK. |
| [getStatus](dw.svc.Result.md#getstatus)() | Returns the status. |
| [getUnavailableReason](dw.svc.Result.md#getunavailablereason)() | Returns the reason the status is SERVICE\_UNAVAILABLE. |
| [isMockResult](dw.svc.Result.md#ismockresult)() | Returns the status of whether the response is the result of a "mock" service call. |
| [isOk](dw.svc.Result.md#isok)() | Returns the status of whether the service call was successful. |
| [toString](dw.svc.Result.md#tostring)() | Returns a string representation of the result. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ERROR

- ERROR: [String](TopLevel.String.md) = "ERROR"
  - : Status indicating a general service error.


---

### OK

- OK: [String](TopLevel.String.md) = "OK"
  - : Status indicating a successful service call.


---

### SERVICE_UNAVAILABLE

- SERVICE_UNAVAILABLE: [String](TopLevel.String.md) = "SERVICE_UNAVAILABLE"
  - : Status indicating the service is unavailable. This includes timeouts, rate limits, and remote server issues.


---

### UNAVAILABLE_CIRCUIT_BROKEN

- UNAVAILABLE_CIRCUIT_BROKEN: [String](TopLevel.String.md) = "CIRCUIT_BROKEN"
  - : Unavailable reason: No call was made because the circuit breaker prevented it.


---

### UNAVAILABLE_CONFIG_PROBLEM

- UNAVAILABLE_CONFIG_PROBLEM: [String](TopLevel.String.md) = "CONFIG_PROBLEM"
  - : Unavailable reason: No call was made because the service was not configured correctly.


---

### UNAVAILABLE_DISABLED

- UNAVAILABLE_DISABLED: [String](TopLevel.String.md) = "DISABLED"
  - : Unavailable reason: No call was made because the service is disabled.


---

### UNAVAILABLE_RATE_LIMITED

- UNAVAILABLE_RATE_LIMITED: [String](TopLevel.String.md) = "RATE_LIMITED"
  - : Unavailable reason: No call was made because the rate limit was hit.


---

### UNAVAILABLE_TIMEOUT

- UNAVAILABLE_TIMEOUT: [String](TopLevel.String.md) = "TIMEOUT"
  - : Unavailable reason: A real call was made but a timeout occurred.


---

## Property Details

### error
- error: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns an error-specific code if applicable. For example, this is the HTTP response code for an
      [HTTPService](dw.svc.HTTPService.md).



---

### errorMessage
- errorMessage: [String](TopLevel.String.md) `(read-only)`
  - : Returns an error message on a non-OK status.


---

### mockResult
- mockResult: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the status of whether the response is the result of a "mock" service call.


---

### msg
- msg: [String](TopLevel.String.md) `(read-only)`
  - : Returns an extra error message on failure (if any).


---

### object
- object: [Object](TopLevel.Object.md) `(read-only)`
  - : Returns the actual object returned by the service when the status is OK.


---

### ok
- ok: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns the status of whether the service call was successful.


---

### status
- status: [String](TopLevel.String.md) `(read-only)`
  - : Returns the status. This is "OK" on success. Failure codes include "ERROR" and "SERVICE\_UNAVAILABLE".
      
      
      If the status is "SERVICE\_UNAVAILABLE", then the unavailableReason is guaranteed to be non-null.


    **See Also:**
    - [OK](dw.svc.Result.md#ok)
    - [ERROR](dw.svc.Result.md#error)
    - [SERVICE_UNAVAILABLE](dw.svc.Result.md#service_unavailable)


---

### unavailableReason
- unavailableReason: [String](TopLevel.String.md) `(read-only)`
  - : Returns the reason the status is SERVICE\_UNAVAILABLE.

    **See Also:**
    - [UNAVAILABLE_TIMEOUT](dw.svc.Result.md#unavailable_timeout)
    - [UNAVAILABLE_CIRCUIT_BROKEN](dw.svc.Result.md#unavailable_circuit_broken)
    - [UNAVAILABLE_RATE_LIMITED](dw.svc.Result.md#unavailable_rate_limited)
    - [UNAVAILABLE_DISABLED](dw.svc.Result.md#unavailable_disabled)
    - [UNAVAILABLE_CONFIG_PROBLEM](dw.svc.Result.md#unavailable_config_problem)


---

## Constructor Details

### Result()
- Result()
  - : Constructs a new result instance.


---

## Method Details

### getError()
- getError(): [Number](TopLevel.Number.md)
  - : Returns an error-specific code if applicable. For example, this is the HTTP response code for an
      [HTTPService](dw.svc.HTTPService.md).


    **Returns:**
    - Error-specific code (if applicable).


---

### getErrorMessage()
- getErrorMessage(): [String](TopLevel.String.md)
  - : Returns an error message on a non-OK status.

    **Returns:**
    - Error message.


---

### getMsg()
- getMsg(): [String](TopLevel.String.md)
  - : Returns an extra error message on failure (if any).

    **Returns:**
    - Error message, or null.


---

### getObject()
- getObject(): [Object](TopLevel.Object.md)
  - : Returns the actual object returned by the service when the status is OK.

    **Returns:**
    - Object returned by the service.


---

### getStatus()
- getStatus(): [String](TopLevel.String.md)
  - : Returns the status. This is "OK" on success. Failure codes include "ERROR" and "SERVICE\_UNAVAILABLE".
      
      
      If the status is "SERVICE\_UNAVAILABLE", then the unavailableReason is guaranteed to be non-null.


    **Returns:**
    - Status code.

    **See Also:**
    - [OK](dw.svc.Result.md#ok)
    - [ERROR](dw.svc.Result.md#error)
    - [SERVICE_UNAVAILABLE](dw.svc.Result.md#service_unavailable)


---

### getUnavailableReason()
- getUnavailableReason(): [String](TopLevel.String.md)
  - : Returns the reason the status is SERVICE\_UNAVAILABLE.

    **Returns:**
    - Unavailable reason code, or null if the status is not SERVICE\_UNAVAILABLE.

    **See Also:**
    - [UNAVAILABLE_TIMEOUT](dw.svc.Result.md#unavailable_timeout)
    - [UNAVAILABLE_CIRCUIT_BROKEN](dw.svc.Result.md#unavailable_circuit_broken)
    - [UNAVAILABLE_RATE_LIMITED](dw.svc.Result.md#unavailable_rate_limited)
    - [UNAVAILABLE_DISABLED](dw.svc.Result.md#unavailable_disabled)
    - [UNAVAILABLE_CONFIG_PROBLEM](dw.svc.Result.md#unavailable_config_problem)


---

### isMockResult()
- isMockResult(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the response is the result of a "mock" service call.

    **Returns:**
    - true if this was a mock service call, false otherwise.


---

### isOk()
- isOk(): [Boolean](TopLevel.Boolean.md)
  - : Returns the status of whether the service call was successful.

    **Returns:**
    - true on success, false otherwise.


---

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns a string representation of the result.

    **Returns:**
    - a string representation of the result.


---

<!-- prettier-ignore-end -->
