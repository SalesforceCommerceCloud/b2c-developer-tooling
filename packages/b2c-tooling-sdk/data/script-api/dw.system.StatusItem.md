<!-- prettier-ignore-start -->
# Class StatusItem

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.StatusItem](dw.system.StatusItem.md)

A StatusItem holds all the status information. Multi StatusItems are bundled
together into a Status.



## Property Summary

| Property | Description |
| --- | --- |
| [code](#code): [String](TopLevel.String.md) | The status code is the unique identifier for the message and can be used by  client programs to check for a specific status and to generate a localized  message. |
| [details](#details): [Map](dw.util.Map.md) `(read-only)` | Returns the optional details for this StatusItem. |
| [error](#error): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether this Status Item represents and error. |
| [message](#message): [String](TopLevel.String.md) | Returns the default human readable message for this Status. |
| [parameters](#parameters): [List](dw.util.List.md) | Returns the parameters to construct a custom message. |
| [status](#status): [Number](TopLevel.Number.md) | Returns the status. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [StatusItem](#statusitem)() | Constructs a new OK StatusItem. |
| [StatusItem](#statusitemnumber)([Number](TopLevel.Number.md)) | Constructs a new StatusItem with the given status. |
| [StatusItem](#statusitemnumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Constructs a new StatusItem with the given status and code. |
| [StatusItem](#statusitemnumber-string-string-object)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Constructs a new StatusItem with the given values. |

## Method Summary

| Method | Description |
| --- | --- |
| [addDetail](dw.system.StatusItem.md#adddetailstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Add an additional detail to this StatusItem. |
| [getCode](dw.system.StatusItem.md#getcode)() | The status code is the unique identifier for the message and can be used by  client programs to check for a specific status and to generate a localized  message. |
| [getDetails](dw.system.StatusItem.md#getdetails)() | Returns the optional details for this StatusItem. |
| [getMessage](dw.system.StatusItem.md#getmessage)() | Returns the default human readable message for this Status. |
| [getParameters](dw.system.StatusItem.md#getparameters)() | Returns the parameters to construct a custom message. |
| [getStatus](dw.system.StatusItem.md#getstatus)() | Returns the status. |
| [isError](dw.system.StatusItem.md#iserror)() | Returns whether this Status Item represents and error. |
| [setCode](dw.system.StatusItem.md#setcodestring)([String](TopLevel.String.md)) | Method to set the status code. |
| [setMessage](dw.system.StatusItem.md#setmessagestring)([String](TopLevel.String.md)) | Sets the default human readable message for this Status. |
| [setParameters](dw.system.StatusItem.md#setparametersobject)([Object\[\]](TopLevel.Object.md)) | Sets the parameters for a custom message. |
| [setStatus](dw.system.StatusItem.md#setstatusnumber)([Number](TopLevel.Number.md)) | Set the status. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### code
- code: [String](TopLevel.String.md)
  - : The status code is the unique identifier for the message and can be used by
      client programs to check for a specific status and to generate a localized
      message.



---

### details
- details: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the optional details for this StatusItem.


---

### error
- error: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether this Status Item represents and error.


---

### message
- message: [String](TopLevel.String.md)
  - : Returns the default human readable message for this Status.
      
      Note: Custom code and client programs must not use this message to identify
      a specific status. The getCode() must be used for that purpose. The actual
      message can change from release to release.



---

### parameters
- parameters: [List](dw.util.List.md)
  - : Returns the parameters to construct a custom message.


---

### status
- status: [Number](TopLevel.Number.md)
  - : Returns the status.


---

## Constructor Details

### StatusItem()
- StatusItem()
  - : Constructs a new OK StatusItem.


---

### StatusItem(Number)
- StatusItem(status: [Number](TopLevel.Number.md))
  - : Constructs a new StatusItem with the given status.

    **Parameters:**
    - status - either [Status.OK](dw.system.Status.md#ok) or  [Status.ERROR](dw.system.Status.md#error).


---

### StatusItem(Number, String)
- StatusItem(status: [Number](TopLevel.Number.md), code: [String](TopLevel.String.md))
  - : Constructs a new StatusItem with the given status and code.

    **Parameters:**
    - status - either [Status.OK](dw.system.Status.md#ok) or  [Status.ERROR](dw.system.Status.md#error).
    - code - a string representing a more detailed status code, e.g. "IMPEX-120".


---

### StatusItem(Number, String, String, Object...)
- StatusItem(status: [Number](TopLevel.Number.md), code: [String](TopLevel.String.md), message: [String](TopLevel.String.md), parameters: [Object...](TopLevel.Object.md))
  - : Constructs a new StatusItem with the given values.

    **Parameters:**
    - status - [Status.OK](dw.system.Status.md#ok) or  [Status.ERROR](dw.system.Status.md#error).
    - code - a string representing a more detailed status code, e.g. "IMPEX-120".
    - message - a default human readable message
    - parameters - a list of parameters to construct a custom message


---

## Method Details

### addDetail(String, Object)
- addDetail(key: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): void
  - : Add an additional detail to this StatusItem.

    **Parameters:**
    - key - the key for the detail.
    - value - the detail value.


---

### getCode()
- getCode(): [String](TopLevel.String.md)
  - : The status code is the unique identifier for the message and can be used by
      client programs to check for a specific status and to generate a localized
      message.


    **Returns:**
    - the status code.


---

### getDetails()
- getDetails(): [Map](dw.util.Map.md)
  - : Returns the optional details for this StatusItem.

    **Returns:**
    - the optional details for this StatusItem.


---

### getMessage()
- getMessage(): [String](TopLevel.String.md)
  - : Returns the default human readable message for this Status.
      
      Note: Custom code and client programs must not use this message to identify
      a specific status. The getCode() must be used for that purpose. The actual
      message can change from release to release.


    **Returns:**
    - the default human readable message for this Status.


---

### getParameters()
- getParameters(): [List](dw.util.List.md)
  - : Returns the parameters to construct a custom message.

    **Returns:**
    - the parameters to construct a custom message.


---

### getStatus()
- getStatus(): [Number](TopLevel.Number.md)
  - : Returns the status.

    **Returns:**
    - either [Status.OK](dw.system.Status.md#ok) or
      [Status.ERROR](dw.system.Status.md#error).



---

### isError()
- isError(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether this Status Item represents and error.

    **Returns:**
    - true is this item represents an error, false otherwise.


---

### setCode(String)
- setCode(code: [String](TopLevel.String.md)): void
  - : Method to set the status code.
      The status code is the unique identifier for the message and can be used by
      client programs to check for a specific status and to generate a localized
      message.


    **Parameters:**
    - code - the status code.


---

### setMessage(String)
- setMessage(message: [String](TopLevel.String.md)): void
  - : Sets the default human readable message for this Status.

    **Parameters:**
    - message - the default human readable message for this Status.


---

### setParameters(Object[])
- setParameters(parameters: [Object\[\]](TopLevel.Object.md)): void
  - : Sets the parameters for a custom message.

    **Parameters:**
    - parameters - the parameters for a custom message.


---

### setStatus(Number)
- setStatus(status: [Number](TopLevel.Number.md)): void
  - : Set the status.

    **Parameters:**
    - status - either  [Status.OK](dw.system.Status.md#ok) or  [Status.ERROR](dw.system.Status.md#error).


---

<!-- prettier-ignore-end -->
