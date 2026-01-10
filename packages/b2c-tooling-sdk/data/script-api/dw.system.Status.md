<!-- prettier-ignore-start -->
# Class Status

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.Status](dw.system.Status.md)

A Status is used for communicating an API status code back to a client. A status
consists of multiple StatusItem. Most often a Status contains only one StatusItem.
For convenience, a message with parameters is formatted using standard
formatting patterns. If you want to display locale-specific messages in your
application, you should use the Status.getCode() as key for a resource bundle.



## Property Summary

| Property | Description |
| --- | --- |
| [ERROR](#error): [Number](TopLevel.Number.md) | status value to indicate an ERROR status |
| [OK](#ok): [Number](TopLevel.Number.md) | status value to indicate an OK status |
| [code](#code): [String](TopLevel.String.md) `(read-only)` | Returns the status code either of the first ERROR StatusItem or when there  is no ERROR StatusITEM, the first StatusItem in the overall list. |
| [details](#details): [Map](dw.util.Map.md) `(read-only)` | Returns the details either of the first ERROR StatusItem or when there  is no ERROR StatusItem, the first StatusItem in the overall list. |
| [error](#error): [Boolean](TopLevel.Boolean.md) `(read-only)` | Checks if the status is an ERROR. |
| [items](#items): [List](dw.util.List.md) `(read-only)` | Returns all status items. |
| [message](#message): [String](TopLevel.String.md) `(read-only)` | Returns the message either of the first ERROR StatusItem or when there  is no ERROR StatusItem, the first StatusItem in the overall list. |
| [parameters](#parameters): [List](dw.util.List.md) `(read-only)` | Returns the parameters either of the first ERROR StatusItem or when there  is no ERROR StatusItem, the first StatusItem in the overall list. |
| [status](#status): [Number](TopLevel.Number.md) `(read-only)` | Returns the overall status. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Status](#status)() | Creates a Status object with no StatusItems. |
| [Status](#statusnumber)([Number](TopLevel.Number.md)) | Creates a Status with a single StatusItem. |
| [Status](#statusnumber-string)([Number](TopLevel.Number.md), [String](TopLevel.String.md)) | Creates a Status with a single StatusItem. |
| [Status](#statusnumber-string-string-object)([Number](TopLevel.Number.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Creates a Status with a single StatusItem. |

## Method Summary

| Method | Description |
| --- | --- |
| [addDetail](dw.system.Status.md#adddetailstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Add detail information for the given key of the first ERROR StatusItem  or when there is no ERROR StatusItem, the first StatusItem in the overall list. |
| [addItem](dw.system.Status.md#additemstatusitem)([StatusItem](dw.system.StatusItem.md)) | Adds an additional status item to this status instance. |
| [getCode](dw.system.Status.md#getcode)() | Returns the status code either of the first ERROR StatusItem or when there  is no ERROR StatusITEM, the first StatusItem in the overall list. |
| [getDetail](dw.system.Status.md#getdetailstring)([String](TopLevel.String.md)) | Returns the detail value for the given key of the first ERROR StatusItem  or when there is no ERROR StatusItem, the first StatusItem in the  overall list. |
| [getDetails](dw.system.Status.md#getdetails)() | Returns the details either of the first ERROR StatusItem or when there  is no ERROR StatusItem, the first StatusItem in the overall list. |
| [getItems](dw.system.Status.md#getitems)() | Returns all status items. |
| [getMessage](dw.system.Status.md#getmessage)() | Returns the message either of the first ERROR StatusItem or when there  is no ERROR StatusItem, the first StatusItem in the overall list. |
| [getParameters](dw.system.Status.md#getparameters)() | Returns the parameters either of the first ERROR StatusItem or when there  is no ERROR StatusItem, the first StatusItem in the overall list. |
| [getStatus](dw.system.Status.md#getstatus)() | Returns the overall status. |
| [isError](dw.system.Status.md#iserror)() | Checks if the status is an ERROR. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ERROR
- ERROR: [Number](TopLevel.Number.md)
  - : status value to indicate an ERROR status


---

### OK
- OK: [Number](TopLevel.Number.md)
  - : status value to indicate an OK status


---

### code
- code: [String](TopLevel.String.md) `(read-only)`
  - : Returns the status code either of the first ERROR StatusItem or when there
      is no ERROR StatusITEM, the first StatusItem in the overall list.
      
      The status code is the unique identifier for the message and can be used by
      client programs to check for a specific status and to generate a localized
      message.



---

### details
- details: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the details either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.



---

### error
- error: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Checks if the status is an ERROR. The Status is an ERROR if one of the
      contained StatusItems is an ERROR.



---

### items
- items: [List](dw.util.List.md) `(read-only)`
  - : Returns all status items.


---

### message
- message: [String](TopLevel.String.md) `(read-only)`
  - : Returns the message either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.
      
      Note: Custom code and client programs must not use this message to identify
      a specific status. The getCode() must be used for that purpose. The actual
      message can change from release to release.



---

### parameters
- parameters: [List](dw.util.List.md) `(read-only)`
  - : Returns the parameters either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.



---

### status
- status: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the overall status. If all StatusItems are OK, the method returns
      OK. If one StatusItem is an ERROR it returns ERROR.



---

## Constructor Details

### Status()
- Status()
  - : Creates a Status object with no StatusItems.


---

### Status(Number)
- Status(status: [Number](TopLevel.Number.md))
  - : Creates a Status with a single StatusItem. The status is set to the given
      value.


    **Parameters:**
    - status - either OK or ERROR


---

### Status(Number, String)
- Status(status: [Number](TopLevel.Number.md), code: [String](TopLevel.String.md))
  - : Creates a Status with a single StatusItem. The StatusItem is initialized
      with the given values.


    **Parameters:**
    - status - either OK or ERROR
    - code - a string representing a more detailed status code, e.g. "IMPEX-120"


---

### Status(Number, String, String, Object...)
- Status(status: [Number](TopLevel.Number.md), code: [String](TopLevel.String.md), message: [String](TopLevel.String.md), parameters: [Object...](TopLevel.Object.md))
  - : Creates a Status with a single StatusItem. The StatusItem is initialized
      with the given values.


    **Parameters:**
    - status - either OK or ERROR
    - code - a string representing a more detailed status code, e.g. "IMPEX-120".
    - message - a default human readable message
    - parameters - a list of parameters to construct a custom message


---

## Method Details

### addDetail(String, Object)
- addDetail(key: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): void
  - : Add detail information for the given key of the first ERROR StatusItem
      or when there is no ERROR StatusItem, the first StatusItem in the overall list.


    **Parameters:**
    - key - the key of the first ERROR StatusItem or the first StatusItem  in the list.
    - value - the detail value.


---

### addItem(StatusItem)
- addItem(item: [StatusItem](dw.system.StatusItem.md)): void
  - : Adds an additional status item to this status instance.

    **Parameters:**
    - item - the status item to add.


---

### getCode()
- getCode(): [String](TopLevel.String.md)
  - : Returns the status code either of the first ERROR StatusItem or when there
      is no ERROR StatusITEM, the first StatusItem in the overall list.
      
      The status code is the unique identifier for the message and can be used by
      client programs to check for a specific status and to generate a localized
      message.


    **Returns:**
    - the status code


---

### getDetail(String)
- getDetail(key: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)
  - : Returns the detail value for the given key of the first ERROR StatusItem
      or when there is no ERROR StatusItem, the first StatusItem in the
      overall list.


    **Parameters:**
    - key - the key for the detail to return.

    **Returns:**
    - the detail value for the given key of the first ERROR StatusItem
      or when there is no ERROR StatusItem, the first StatusItem in the
      overall list.



---

### getDetails()
- getDetails(): [Map](dw.util.Map.md)
  - : Returns the details either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.


    **Returns:**
    - the details either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.



---

### getItems()
- getItems(): [List](dw.util.List.md)
  - : Returns all status items.

    **Returns:**
    - all status items.


---

### getMessage()
- getMessage(): [String](TopLevel.String.md)
  - : Returns the message either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.
      
      Note: Custom code and client programs must not use this message to identify
      a specific status. The getCode() must be used for that purpose. The actual
      message can change from release to release.


    **Returns:**
    - the message either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.



---

### getParameters()
- getParameters(): [List](dw.util.List.md)
  - : Returns the parameters either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.


    **Returns:**
    - the parameters either of the first ERROR StatusItem or when there
      is no ERROR StatusItem, the first StatusItem in the overall list.



---

### getStatus()
- getStatus(): [Number](TopLevel.Number.md)
  - : Returns the overall status. If all StatusItems are OK, the method returns
      OK. If one StatusItem is an ERROR it returns ERROR.


    **Returns:**
    - either OK or ERROR


---

### isError()
- isError(): [Boolean](TopLevel.Boolean.md)
  - : Checks if the status is an ERROR. The Status is an ERROR if one of the
      contained StatusItems is an ERROR.


    **Returns:**
    - true if status is an ERROR, false otherwise.


---

<!-- prettier-ignore-end -->
