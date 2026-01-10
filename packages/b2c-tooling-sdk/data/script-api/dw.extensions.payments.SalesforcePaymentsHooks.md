<!-- prettier-ignore-start -->
# Class SalesforcePaymentsHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.payments.SalesforcePaymentsHooks](dw.extensions.payments.SalesforcePaymentsHooks.md)



This interface represents all script hooks that can be registered to customize the Salesforce Payments functionality.
See Salesforce Payments documentation for how to gain access and configure it for use on your sites.




It contains the extension points (hook names), and the functions that are called by each extension point. A function
must be defined inside a JavaScript source and must be exported. The script with the exported hook function must be
located inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.




```
"hooks": "./hooks.json"
```



The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:




```
"hooks": [
     {"name": "dw.extensions.payments.asyncPaymentSucceeded", "script": "./payments.js"},
     {"name": "dw.extensions.payments.adyenNotification", "script": "./payments.js"},
     {"name": "dw.extensions.payments.sendOrderConfirmationEmail", "script": "./emails.js"}
]
```



A hook entry has a 'name' and a 'script' property.



- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAdyenNotification](#extensionpointadyennotification): [String](TopLevel.String.md) = "dw.extensions.payments.adyenNotification" | The extension point name dw.extensions.payments.adyenNotification. |
| [extensionPointAsyncPaymentSucceeded](#extensionpointasyncpaymentsucceeded): [String](TopLevel.String.md) = "dw.extensions.payments.asyncPaymentSucceeded" | The extension point name dw.extensions.payments.asyncPaymentSucceeded. |
| [extensionPointSendOrderConfirmationEmail](#extensionpointsendorderconfirmationemail): [String](TopLevel.String.md) = "dw.extensions.payments.sendOrderConfirmationEmail" | The extension point name dw.extensions.payments.sendOrderConfirmationEmail. |
| [extensionPointStripePaymentEvent](#extensionpointstripepaymentevent): [String](TopLevel.String.md) = "dw.extensions.payments.stripePaymentEvent" | The extension point name dw.extensions.payments.stripePaymentEvent. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [adyenNotification](dw.extensions.payments.SalesforcePaymentsHooks.md#adyennotificationorder)([Order](dw.order.Order.md)) | Called when an Adyen webhook notification is received for the given order. |
| [asyncPaymentSucceeded](dw.extensions.payments.SalesforcePaymentsHooks.md#asyncpaymentsucceededorder)([Order](dw.order.Order.md)) | Called when asynchronous payment succeeded for the given order. |
| [sendOrderConfirmationEmail](dw.extensions.payments.SalesforcePaymentsHooks.md#sendorderconfirmationemailorder)([Order](dw.order.Order.md)) | Called to send order confirmation email after successful payment processing. |
| [stripePaymentEvent](dw.extensions.payments.SalesforcePaymentsHooks.md#stripepaymenteventstring-order)([String](TopLevel.String.md), [Order](dw.order.Order.md)) | Called when a Stripe payment event is received for the given order. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAdyenNotification

- extensionPointAdyenNotification: [String](TopLevel.String.md) = "dw.extensions.payments.adyenNotification"
  - : The extension point name dw.extensions.payments.adyenNotification.


---

### extensionPointAsyncPaymentSucceeded

- extensionPointAsyncPaymentSucceeded: [String](TopLevel.String.md) = "dw.extensions.payments.asyncPaymentSucceeded"
  - : The extension point name dw.extensions.payments.asyncPaymentSucceeded.


---

### extensionPointSendOrderConfirmationEmail

- extensionPointSendOrderConfirmationEmail: [String](TopLevel.String.md) = "dw.extensions.payments.sendOrderConfirmationEmail"
  - : The extension point name dw.extensions.payments.sendOrderConfirmationEmail.


---

### extensionPointStripePaymentEvent

- extensionPointStripePaymentEvent: [String](TopLevel.String.md) = "dw.extensions.payments.stripePaymentEvent"
  - : The extension point name dw.extensions.payments.stripePaymentEvent.


---

## Method Details

### adyenNotification(Order)
- adyenNotification(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : Called when an Adyen webhook notification is received for the given order.

    **Parameters:**
    - order - the order for which the notification was received

    **Returns:**
    - a non-null result ends the hook execution, and is ignored


---

### asyncPaymentSucceeded(Order)
- asyncPaymentSucceeded(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : Called when asynchronous payment succeeded for the given order.

    **Parameters:**
    - order - the order whose asynchronous payment succeeded

    **Returns:**
    - a non-null result ends the hook execution, and is ignored


---

### sendOrderConfirmationEmail(Order)
- sendOrderConfirmationEmail(order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : Called to send order confirmation email after successful payment processing.

    **Parameters:**
    - order - the order for which to send confirmation email

    **Returns:**
    - a non-null result ends the hook execution


---

### stripePaymentEvent(String, Order)
- stripePaymentEvent(eventName: [String](TopLevel.String.md), order: [Order](dw.order.Order.md)): [Status](dw.system.Status.md)
  - : Called when a Stripe payment event is received for the given order.

    **Parameters:**
    - eventName - the Stripe event name, such as `"payment_intent.succeeded"`
    - order - the order for which the event was received

    **Returns:**
    - a non-null result ends the hook execution, and is ignored


---

<!-- prettier-ignore-end -->
