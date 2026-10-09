<!-- prettier-ignore-start -->
# Class FraudAppHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.apps.checkout.hooks.FraudAppHooks](dw.apps.checkout.hooks.FraudAppHooks.md)

This interface defines Commerce App hook extension points for the fraud domain.


These hooks provide integration points for external fraud detection services installed via the Commerce App
framework. They enable ISV fraud providers to perform risk assessments at key points in the payment lifecycle.




**IMPORTANT:** These hooks should **only** be implemented and registered by Commerce Apps
(applications installed via the Commerce App framework with a CAP file). They are not intended for custom merchant
cartridges or storefront implementations.


Hook Registration


A function must be defined inside a JavaScript source and must be exported. The script with the exported hook
function must be located inside a site cartridge. Inside the site cartridge a `package.json` file with a
'hooks' entry must exist:




```
"hooks": "./hooks.json"
```



The hooks entry links to a JSON file, relative to the `package.json` file. This file lists all registered hooks
inside the hooks property:




```
"hooks": [
     {"name": "sfcc.app.fraud.beforePayment", "script": "./beforePayment.js"},
     {"name": "sfcc.app.fraud.afterPayment", "script": "./afterPayment.js"}
]
```



A hook entry has a `name` and a `script` property:



- The `name`contains the extension point name (the hook name).
- The `script`contains the script path relative to the hooks file, with the exported hook function.



**Function Naming Convention:** The exported JavaScript function name must match the last segment of the
extension point name: `beforePayment`.


Lifecycle Context


The `beforePayment` hook fires as a pre-authorization fraud check. It is invoked during basket-to-order
conversion when fraud assessment conditions are met. The hook fires once per basket after all Basket Payment
Instruments have been created and payment details are available, but before order creation and before payment
authorization/capture is attempted.




The `afterPayment` hook fires as a post-authorization fraud check. It is invoked by the platform when ALL
payment instruments on the Order have reached `AUTHORIZED` or `CAPTURED` status. The hook fires after
payment authorization/capture succeeds but before the order is placed.


Decision Values and Storefront Behavior
beforePayment Decisions (Pre-Authorization)
| Decision | Meaning | Storefront Behavior |
| --- |--- |--- |
| `APPROVED` | Transaction is deemed safe | Proceed with basket-to-order conversion |
| `DECLINED` | Transaction is deemed unsafe | Block checkout - do NOT create order |
| `CHALLENGE` | Transaction requires further verification | Proceed with additional authentication challenges during authorization |

afterPayment Decisions (Post-Authorization)
| Decision | Meaning | Storefront Behavior |
| --- |--- |--- |
| `GUARANTEED` | Order is guaranteed against chargebacks by the fraud ISV | Proceed with order placement |
| `NOT\_GUARANTEED` | Order is not guaranteed; ISV recommends rejection | Block checkout - fail order and trigger payment reversal |
| `PENDING` | ISV decision is pending; will arrive asynchronously via webhook | Hold order in `CREATED` status |

Hook Precedence

- When `sfcc.app.fraud.beforePayment`is registered by a Commerce App, the platform invokes it during the  basket-to-order conversion.
- When `sfcc.app.fraud.afterPayment`is registered by a Commerce App, the platform invokes it after all  payment instruments are authorized/captured.
- If the Commerce App hook is not registered (no fraud app installed), the platform skips the fraud check and  records the pre-auth and post-auth fraud results as `NOT\_REVIEWED`by default.

Error Handling
beforePayment

- **Approve:**Set [PaymentTransaction.PRE_AUTH_FRAUD_DECISION_APPROVED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_approved)on the  approved payment transaction(s) and return `Status.OK`with code `PRE\_AUTH\_FRAUD\_DECISION\_APPROVED`. The  platform continues the basket-to-order transition.
- **Challenge:**Set [PaymentTransaction.PRE_AUTH_FRAUD_DECISION_CHALLENGE](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_challenge)on the  payment transaction(s) to challenge, and return `Status.OK`with code  `PRE\_AUTH\_FRAUD\_DECISION\_CHALLENGE`. The platform continues the basket-to-order transition. The payment ISV  will perform additional authentication challenges during authorization
- **Decline (blocking):**Set [PaymentTransaction.PRE_AUTH_FRAUD_DECISION_DECLINED](dw.order.PaymentTransaction.md#pre_auth_fraud_decision_declined)on  the declined payment transaction(s) and return `Status.ERROR`with code  `PRE\_AUTH\_FRAUD\_DECISION\_DECLINED`. The platform rolls back the basket-to-order transition and returns an error  to the caller.
- **Exception:**If the hook throws an exception (including timeout), the platform treats the  transaction as for **Decline**above

afterPayment

- **Guaranteed:**Set [PaymentTransaction.POST_AUTH_FRAUD_DECISION_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_guaranteed)on the  guaranteed payment transaction(s) and return `Status.OK`with code `POST\_AUTH\_FRAUD\_DECISION\_GUARANTEED`.  The platform proceeds with order placement.
- **Not Guaranteed (blocking):**Set  [PaymentTransaction.POST_AUTH_FRAUD_DECISION_NOT_GUARANTEED](dw.order.PaymentTransaction.md#post_auth_fraud_decision_not_guaranteed)on the payment transaction(s) and return  `Status.ERROR`with code `POST\_AUTH\_FRAUD\_DECISION\_NOT\_GUARANTEED`. The platform triggers fail order and  payment reversal.
- **Pending (asynchronous):**Set [PaymentTransaction.POST_AUTH_FRAUD_DECISION_PENDING](dw.order.PaymentTransaction.md#post_auth_fraud_decision_pending)on the payment transaction(s) and return `Status.OK`with code `POST\_AUTH\_FRAUD\_DECISION\_PENDING`. The  platform holds the order in `CREATED`status. Implement the fraud app webhook to set the  **Guaranteed**or **Not Guaranteed**result later. When guaranteed call  [OrderMgr.attemptOrderTransition(Order)](dw.order.OrderMgr.md#attemptordertransitionorder), and when not guaranteed call  [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean).



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAfterPayment](#extensionpointafterpayment): [String](TopLevel.String.md) = "sfcc.app.fraud.afterPayment" | The extension point name sfcc.app.fraud.afterPayment. |
| [extensionPointBeforePayment](#extensionpointbeforepayment): [String](TopLevel.String.md) = "sfcc.app.fraud.beforePayment" | The extension point name sfcc.app.fraud.beforePayment. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [afterPayment](dw.apps.checkout.hooks.FraudAppHooks.md#afterpaymentorder)([Order](dw.order.Order.md)) | The function is called by extension point [extensionPointAfterPayment](dw.apps.checkout.hooks.FraudAppHooks.md#extensionpointafterpayment). |
| [beforePayment](dw.apps.checkout.hooks.FraudAppHooks.md#beforepaymentbasket)([Basket](dw.order.Basket.md)) | The function is called by extension point [extensionPointBeforePayment](dw.apps.checkout.hooks.FraudAppHooks.md#extensionpointbeforepayment). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAfterPayment

- extensionPointAfterPayment: [String](TopLevel.String.md) = "sfcc.app.fraud.afterPayment"
  - : The extension point name sfcc.app.fraud.afterPayment.


---

### extensionPointBeforePayment

- extensionPointBeforePayment: [String](TopLevel.String.md) = "sfcc.app.fraud.beforePayment"
  - : The extension point name sfcc.app.fraud.beforePayment.


---

## Method Details

### afterPayment(Order)
- afterPayment(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointAfterPayment](dw.apps.checkout.hooks.FraudAppHooks.md#extensionpointafterpayment). It performs a post-authorization
      fraud assessment after all payment instruments on the Order have been authorized or captured.
      
      
      This hook supports two integration patterns:
      
      
      Synchronous Pattern
      
      
      Call the fraud service during hook execution and return a decision immediately. If the order is guaranteed, set
      `POST\_AUTH\_FRAUD\_DECISION\_GUARANTEED` and return `Status.OK` with code
      `POST\_AUTH\_FRAUD\_DECISION\_GUARANTEED` to proceed with order placement. If the order is not guaranteed, set
      `POST\_AUTH\_FRAUD\_DECISION\_NOT\_GUARANTEED` and return `Status.ERROR` with code
      `POST\_AUTH\_FRAUD\_DECISION\_NOT\_GUARANTEED` to fail the order. If there is an error calling the fraud
      service, return `Status.ERROR`.
      
      
      Asynchronous Pattern
      
      
      Submit the order to the fraud service but do not wait for a decision. Set the post auth fraud decision in the
      payment transaction details to `POST\_AUTH\_FRAUD\_DECISION\_PENDING` and return `Status.OK`. If there is
      an error submitting the order, return `Status.ERROR`.
      
      
      
      
      Later when the fraud service webhook arrives with a decision for the order, set the post auth fraud decision to
      the corresponding value. Call [OrderMgr.attemptOrderTransition(Order)](dw.order.OrderMgr.md#attemptordertransitionorder) to proceed with order
      placement, or call [OrderMgr.failOrder(Order, Boolean)](dw.order.OrderMgr.md#failorderorder-boolean) to fail the order.
      
      
      
      
      Do not call [OrderMgr](dw.order.OrderMgr.md) methods directly in a hook implementation. The platform will use the
      decision to determine the next course of action. Only call those methods in an asynchronous webhook handler.
      
      
      
      
      **Note:** to omit a fraud check, set code `PRE\_AUTH\_FRAUD\_DECISION\_NOT\_REVIEWED` or
      `POST\_AUTH\_FRAUD\_DECISION\_NOT\_REVIEWED` as appropriate and return `Status.OK`.
      
      
      
      
      **Error Handling:**
      
      
      
      - If the hook implementation returns `null`or throws an error, the platform will behave as for  `Status.ERROR`


    **Parameters:**
    - order - the order for which to perform a post-authorization fraud assessment

    **Returns:**
    - `Status.OK` or `Status.ERROR`


---

### beforePayment(Basket)
- beforePayment(basket: [Basket](dw.order.Basket.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointBeforePayment](dw.apps.checkout.hooks.FraudAppHooks.md#extensionpointbeforepayment). It performs a pre-authorization
      fraud assessment after a Basket Payment Instrument has been created and payment details are available, but before
      order creation and before payment authorization/capture is attempted.
      
      
      **Error Handling:**
      
      
      
      - `Status.OK`with code `PRE\_AUTH\_FRAUD\_DECISION\_APPROVED`— Proceed with payment  authorization.
      - `Status.OK`with code `PRE\_AUTH\_FRAUD\_DECISION\_CHALLENGE`— Proceed with additional  authentication challenges.
      - `Status.ERROR`with code `PRE\_AUTH\_FRAUD\_DECISION\_DECLINED`— Block order creation.
      - Exception (including timeout) — Platform treats as `Status.ERROR`.
      
      
      
      The ISV can persist shopper-specific pre-auth fraud signals as custom attributes on the Basket. ISV-specific
      outputs such as a risk score or a reason code also can be persisted as custom attributes on the Basket within
      hook execution, if needed.
      
      
      
      
      **Timeout:** ISVs must configure HTTP timeouts via `LocalServiceRegistry`.


    **Parameters:**
    - basket - the fully calculated basket being checked out

    **Returns:**
    - `Status.OK` to proceed or `Status.ERROR` to block.


---

<!-- prettier-ignore-end -->
