<!-- prettier-ignore-start -->
# Class EventQueueFullException

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.event.EventQueueFullException](dw.event.EventQueueFullException.md)

Thrown when an event cannot be accepted for asynchronous delivery because the event queue is at capacity.
The event was not queued and will not be delivered. The caller may retry later.



## Property Summary

| Property | Description |
| --- | --- |
| [eventID](#eventid): [String](TopLevel.String.md) `(read-only)` | Returns the event ID associated with the rejected send. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getEventID](dw.event.EventQueueFullException.md#geteventid)() | Returns the event ID associated with the rejected send. |

### Methods inherited from class Error

[captureStackTrace](TopLevel.Error.md#capturestacktraceerror-function), [toString](TopLevel.Error.md#tostring)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### eventID
- eventID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the event ID associated with the rejected send.


---

## Method Details

### getEventID()
- getEventID(): [String](TopLevel.String.md)
  - : Returns the event ID associated with the rejected send.

    **Returns:**
    - the event ID.


---

<!-- prettier-ignore-end -->
