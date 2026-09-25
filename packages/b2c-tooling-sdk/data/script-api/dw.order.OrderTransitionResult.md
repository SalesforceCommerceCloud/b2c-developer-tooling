<!-- prettier-ignore-start -->
# Class OrderTransitionResult

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.OrderTransitionResult](dw.order.OrderTransitionResult.md)

Read-only result of [OrderMgr.attemptOrderTransition(Order)](dw.order.OrderMgr.md#attemptordertransitionorder).


[getCompleted()](dw.order.OrderTransitionResult.md#getcompleted) and [getRemaining()](dw.order.OrderTransitionResult.md#getremaining) preserve lifecycle order and partition the applicable steps.
[getExecuted()](dw.order.OrderTransitionResult.md#getexecuted) contains only applicable steps invoked by the current request. Progress reflects the steps
currently applicable for the installed Commerce Apps and the order's current state. A final result requires no
further processing in this invocation. Final results include successful placement, a domain failure that transitions
the order to `FAILED`, and no attempt when the order is not in `CREATED` status. For a `FAILED`
order, [getBasket()](dw.order.OrderTransitionResult.md#getbasket) returns the reopened basket, or `null` when the underlying operation did not
reopen a basket.



## Constant Summary

| Constant | Description |
| --- | --- |
| [REASON_ORDER_NOT_CREATED](#reason_order_not_created): [String](TopLevel.String.md) = "order_not_created" | Stable reason indicating that no transition was attempted because the order is not in CREATED status. |
| [STEP_FRAUD](#step_fraud): [String](TopLevel.String.md) = "fraud" | Post-payment fraud lifecycle step identifier. |
| [STEP_GIFT_CARD](#step_gift_card): [String](TopLevel.String.md) = "giftcard" | Gift-card capture lifecycle step identifier. |
| [STEP_PAYMENT](#step_payment): [String](TopLevel.String.md) = "payment" | Payment-app processing lifecycle step identifier. |

## Property Summary

| Property | Description |
| --- | --- |
| [basket](#basket): [Basket](dw.order.Basket.md) `(read-only)` | The reopened basket for a `FAILED` order, or `null` when the underlying operation did not reopen a  basket (for example the basket was already removed or the open-basket limit was reached) or no domain failure  occurred. |
| [completed](#completed): [String\[\]](TopLevel.String.md) `(read-only)` |  |
| [error](#error): [Boolean](TopLevel.Boolean.md) `(read-only)` | Whether this terminal result represents a domain failure that transitioned the order to `FAILED`. |
| [executed](#executed): [String\[\]](TopLevel.String.md) `(read-only)` |  |
| [final](#final): [Boolean](TopLevel.Boolean.md) `(read-only)` |  |
| [reason](#reason): [String](TopLevel.String.md) `(read-only)` |  |
| [remaining](#remaining): [String\[\]](TopLevel.String.md) `(read-only)` |  |
| [step](#step): [String](TopLevel.String.md) `(read-only)` |  |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getBasket](dw.order.OrderTransitionResult.md#getbasket)() | The reopened basket for a `FAILED` order, or `null` when the underlying operation did not reopen a  basket (for example the basket was already removed or the open-basket limit was reached) or no domain failure  occurred. |
| [getCompleted](dw.order.OrderTransitionResult.md#getcompleted)() |  |
| [getExecuted](dw.order.OrderTransitionResult.md#getexecuted)() |  |
| [getReason](dw.order.OrderTransitionResult.md#getreason)() |  |
| [getRemaining](dw.order.OrderTransitionResult.md#getremaining)() |  |
| [getStep](dw.order.OrderTransitionResult.md#getstep)() |  |
| [isError](dw.order.OrderTransitionResult.md#iserror)() | Whether this terminal result represents a domain failure that transitioned the order to `FAILED`. |
| [isFinal](dw.order.OrderTransitionResult.md#isfinal)() |  |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### REASON_ORDER_NOT_CREATED

- REASON_ORDER_NOT_CREATED: [String](TopLevel.String.md) = "order_not_created"
  - : Stable reason indicating that no transition was attempted because the order is not in CREATED status.


---

### STEP_FRAUD

- STEP_FRAUD: [String](TopLevel.String.md) = "fraud"
  - : Post-payment fraud lifecycle step identifier.


---

### STEP_GIFT_CARD

- STEP_GIFT_CARD: [String](TopLevel.String.md) = "giftcard"
  - : Gift-card capture lifecycle step identifier.


---

### STEP_PAYMENT

- STEP_PAYMENT: [String](TopLevel.String.md) = "payment"
  - : Payment-app processing lifecycle step identifier.


---

## Property Details

### basket
- basket: [Basket](dw.order.Basket.md) `(read-only)`
  - : The reopened basket for a `FAILED` order, or `null` when the underlying operation did not reopen a
      basket (for example the basket was already removed or the open-basket limit was reached) or no domain failure
      occurred. [BasketMgr.getCurrentBasket()](dw.order.BasketMgr.md#getcurrentbasket) returns this basket only when it remains the session's current
      basket; otherwise callers should use this return value.



---

### completed
- completed: [String\[\]](TopLevel.String.md) `(read-only)`
  - : 


---

### error
- error: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Whether this terminal result represents a domain failure that transitioned the order to `FAILED`.
      Unexpected provider or infrastructure exceptions are not represented as soft results; they propagate. When
      `true`, [getStep()](dw.order.OrderTransitionResult.md#getstep) identifies the failed lifecycle step, or is `null` for placement failure.



---

### executed
- executed: [String\[\]](TopLevel.String.md) `(read-only)`
  - : 


---

### final
- final: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : 


---

### reason
- reason: [String](TopLevel.String.md) `(read-only)`
  - : 


---

### remaining
- remaining: [String\[\]](TopLevel.String.md) `(read-only)`
  - : 


---

### step
- step: [String](TopLevel.String.md) `(read-only)`
  - : 


---

## Method Details

### getBasket()
- getBasket(): [Basket](dw.order.Basket.md)
  - : The reopened basket for a `FAILED` order, or `null` when the underlying operation did not reopen a
      basket (for example the basket was already removed or the open-basket limit was reached) or no domain failure
      occurred. [BasketMgr.getCurrentBasket()](dw.order.BasketMgr.md#getcurrentbasket) returns this basket only when it remains the session's current
      basket; otherwise callers should use this return value.


    **Returns:**
    - the reopened basket, or `null` if none


---

### getCompleted()
- getCompleted(): [String\[\]](TopLevel.String.md)
  - : 

    **Returns:**
    - applicable steps already completed, in lifecycle order


---

### getExecuted()
- getExecuted(): [String\[\]](TopLevel.String.md)
  - : 

    **Returns:**
    - applicable steps invoked during this request, in lifecycle order


---

### getReason()
- getReason(): [String](TopLevel.String.md)
  - : 

    **Returns:**
    - a stable non-error terminal reason, or `null` when not applicable


---

### getRemaining()
- getRemaining(): [String\[\]](TopLevel.String.md)
  - : 

    **Returns:**
    - applicable steps not completed, including the stopped step, in lifecycle order


---

### getStep()
- getStep(): [String](TopLevel.String.md)
  - : 

    **Returns:**
    - the pending or failed step, or `null` for terminal success, placement `FAILED`, or no
              applicable pending step



---

### isError()
- isError(): [Boolean](TopLevel.Boolean.md)
  - : Whether this terminal result represents a domain failure that transitioned the order to `FAILED`.
      Unexpected provider or infrastructure exceptions are not represented as soft results; they propagate. When
      `true`, [getStep()](dw.order.OrderTransitionResult.md#getstep) identifies the failed lifecycle step, or is `null` for placement failure.


    **Returns:**
    - `true` if this terminal result is a domain failure that transitioned the order to `FAILED`


---

### isFinal()
- isFinal(): [Boolean](TopLevel.Boolean.md)
  - : 

    **Returns:**
    - whether no further processing is required in this invocation


---

<!-- prettier-ignore-end -->
