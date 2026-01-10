<!-- prettier-ignore-start -->
# Class ServiceProfile

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.svc.ServiceProfile](dw.svc.ServiceProfile.md)

Configuration object for Service Profiles.


## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the unique Service ID. |
| [cbCalls](#cbcalls): [Number](TopLevel.Number.md) `(read-only)` | Returns the maximum number of errors in an interval allowed by the circuit breaker. |
| [cbMillis](#cbmillis): [Number](TopLevel.Number.md) `(read-only)` | Returns the interval of the circuit breaker in milliseconds. |
| [rateLimitCalls](#ratelimitcalls): [Number](TopLevel.Number.md) `(read-only)` | Returns the maximum number of calls in an interval allowed by the rate limiter. |
| [rateLimitMillis](#ratelimitmillis): [Number](TopLevel.Number.md) `(read-only)` | Returns the interval of the rate limiter in milliseconds. |
| [timeoutMillis](#timeoutmillis): [Number](TopLevel.Number.md) `(read-only)` | Returns the service call timeout in milliseconds. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCbCalls](dw.svc.ServiceProfile.md#getcbcalls)() | Returns the maximum number of errors in an interval allowed by the circuit breaker. |
| [getCbMillis](dw.svc.ServiceProfile.md#getcbmillis)() | Returns the interval of the circuit breaker in milliseconds. |
| [getID](dw.svc.ServiceProfile.md#getid)() | Returns the unique Service ID. |
| [getRateLimitCalls](dw.svc.ServiceProfile.md#getratelimitcalls)() | Returns the maximum number of calls in an interval allowed by the rate limiter. |
| [getRateLimitMillis](dw.svc.ServiceProfile.md#getratelimitmillis)() | Returns the interval of the rate limiter in milliseconds. |
| [getTimeoutMillis](dw.svc.ServiceProfile.md#gettimeoutmillis)() | Returns the service call timeout in milliseconds. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the unique Service ID.


---

### cbCalls
- cbCalls: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the maximum number of errors in an interval allowed by the circuit breaker.


---

### cbMillis
- cbMillis: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the interval of the circuit breaker in milliseconds.


---

### rateLimitCalls
- rateLimitCalls: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the maximum number of calls in an interval allowed by the rate limiter.


---

### rateLimitMillis
- rateLimitMillis: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the interval of the rate limiter in milliseconds.


---

### timeoutMillis
- timeoutMillis: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the service call timeout in milliseconds.


---

## Method Details

### getCbCalls()
- getCbCalls(): [Number](TopLevel.Number.md)
  - : Returns the maximum number of errors in an interval allowed by the circuit breaker.

    **Returns:**
    - Maximum number of errors in an interval allowed by the circuit breaker.


---

### getCbMillis()
- getCbMillis(): [Number](TopLevel.Number.md)
  - : Returns the interval of the circuit breaker in milliseconds.

    **Returns:**
    - Circuit breaker interval in milliseconds.


---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the unique Service ID.

    **Returns:**
    - unique Service ID


---

### getRateLimitCalls()
- getRateLimitCalls(): [Number](TopLevel.Number.md)
  - : Returns the maximum number of calls in an interval allowed by the rate limiter.

    **Returns:**
    - Maximum number of calls in an interval allowed by the rate limiter.


---

### getRateLimitMillis()
- getRateLimitMillis(): [Number](TopLevel.Number.md)
  - : Returns the interval of the rate limiter in milliseconds.

    **Returns:**
    - Interval of the rate limiter in milliseconds.


---

### getTimeoutMillis()
- getTimeoutMillis(): [Number](TopLevel.Number.md)
  - : Returns the service call timeout in milliseconds.

    **Returns:**
    - Service call timeout in milliseconds.


---

<!-- prettier-ignore-end -->
