<!-- prettier-ignore-start -->
# Class EventManager

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.event.EventManager](dw.event.EventManager.md)

Sends custom events to the endpoints configured for them in the Business Manager Event Routing screen.


Custom events must be declared in a cartridge's package.json `"events"` array. For example:


```
{
    "events": [
        "com.example.checkout.abandoned",
        "com.example.checkout.payment_failed",
        "com.example.checkout.order_placed"
    ]
}
```



After events are declared, they may be configured in Business Manager and called from any cartridge.


Dispatch is fire-and-forget: events are normally delivered asynchronously, and transport failures may result in a
retry later. Attempting to send an event without a configured route is a no-op and silently ignored, while attempting
to use an undeclared event ID will result in an exception.




```
var EventManager = require('dw/event/EventManager');
var mgr = new EventManager();
mgr.sendEvent('com.example.checkout.abandoned', JSON.stringify({ basket: basketID }));
```



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [EventManager](#eventmanager)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| [isEnabled](dw.event.EventManager.md#isenabledstring)([String](TopLevel.String.md)) | Reports whether firing the given event is enabled, so a caller can skip building a payload that would be  discarded. |
| [sendEvent](dw.event.EventManager.md#sendeventstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sends the specified event asynchronously. |
| [sendEventOnCommit](dw.event.EventManager.md#sendeventoncommitstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sends the specified event when the current transaction commits. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### EventManager()
- EventManager()
  - : 


---

## Method Details

### isEnabled(String)
- isEnabled(eventID: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Reports whether firing the given event is enabled, so a caller can skip building a payload that would be
      discarded. Returns `true` only when the given event exists and has a configured endpoint. It returns
      `false` in all other cases.
      
      
      This is a point-in-time hint, not a delivery guarantee. Routing can change before a subsequent send, and this
      method does not validate a payload, check transaction state, or reserve queue or rate-limit capacity.


    **Parameters:**
    - eventID - the custom event ID to test.

    **Returns:**
    - `true` if this event maps to a route, false otherwise.


---

### sendEvent(String, String)
- sendEvent(eventID: [String](TopLevel.String.md), message: [String](TopLevel.String.md)): void
  - : Sends the specified event asynchronously.
      
      
      If no routing is defined for the event, this does nothing.


    **Parameters:**
    - eventID - the declared custom event ID, must not be null.
    - message - the event payload, typically JSON; must not be null.

    **Throws:**
    - NullArgumentException - if `eventID` or `message` is `null`.
    - IllegalArgumentException - if the event is not a declared custom event, or the UTF-8 encoded payload exceeds          131,072 bytes (128 KiB).
    - EventRateLimitExceededException - if the send rate limit has been exceeded.
    - EventQueueFullException - if the event router queue is at capacity and the event was rejected.


---

### sendEventOnCommit(String, String)
- sendEventOnCommit(eventID: [String](TopLevel.String.md), message: [String](TopLevel.String.md)): void
  - : Sends the specified event when the current transaction commits. An active transaction is required. If the
      transaction rolls back, the event is discarded.
      
      
      If no routing is defined for the event, the event is not sent.
      
      
      Rate-limit capacity is consumed when this method is called and is not restored if the transaction rolls back.


    **Parameters:**
    - eventID - the declared custom event ID, must not be null.
    - message - the event payload, typically JSON; must not be null.

    **Throws:**
    - IllegalStateException - if no transaction is active.
    - NullArgumentException - if `eventID` or `message` is `null`.
    - IllegalArgumentException - if the event is not a declared custom event, or the UTF-8 encoded payload exceeds          131,072 bytes (128 KiB).
    - EventRateLimitExceededException - if the send rate limit has been exceeded.
    - EventQueueFullException - if the event router queue is at capacity and the event was rejected.


---

<!-- prettier-ignore-end -->
