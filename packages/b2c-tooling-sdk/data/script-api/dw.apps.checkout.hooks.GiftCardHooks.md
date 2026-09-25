<!-- prettier-ignore-start -->
# Class GiftCardHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.apps.checkout.hooks.GiftCardHooks](dw.apps.checkout.hooks.GiftCardHooks.md)

This interface represents gift card extension points for Commerce App gift card providers.


These hooks provide integration points for external gift card services installed via the Commerce App framework.
They are distinct from platform gift certificates and are not intended for custom merchant cartridges or storefront
implementations.




**IMPORTANT:** These hooks should **only** be implemented and registered by Commerce Apps
(applications installed via the Commerce App framework with a CAP file).


Hook Registration


A function must be defined inside a JavaScript source and exported. The script with the exported hook function must
be located inside a site cartridge. Inside the site cartridge a `package.json` file with a
`hooks` entry must exist:




```
{
    "hooks": "./hooks.json"
}
```



The hooks entry links to a JSON file, relative to `package.json`, that lists registered hooks:




```
{
    "hooks": [
        {"name": "sfcc.app.giftcard.getBalance", "script": "./balance.js"},
        {"name": "sfcc.app.giftcard.capture", "script": "./capture.js"},
        {"name": "sfcc.app.giftcard.refund", "script": "./refund.js"}
    ]
}
```



The exported JavaScript function name must match the final segment of the extension-point name: for example,
`getBalance`, `capture`, or `refund`.


Checkout Lifecycle Context

- **getBalance:**Reads an external gift card balance without applying or settling a payment.
- **capture:**Captures the gift card payment during complete checkout, after the order is created and  before the remaining payment instruments are authorized or captured.
- **refund:**Returns a settled gift card payment when a later checkout payment fails.

SCAPI Behavior


The platform invokes settlement hooks while creating or failing an order. They are not directly exposed as SCAPI
endpoints. A capture failure blocks checkout; a later payment failure invokes the refund hook for every successfully
captured gift card before the order is failed and the basket is reopened.


Hook Arguments and Return Types

- **getBalance:**Receives the `PaymentInstrumentBalanceRequestWO`from the SCAPI request  and returns a `dw.value.Money`.
- **capture**and **refund:**Receive a  `dw.order.Order`and `dw.order.OrderPaymentInstrument`, and return a  `dw.system.Status`.

Error Handling
For getBalance hook:

- Return the available balance when the external provider lookup succeeds.
- Throw an exception when the provider cannot determine the balance. The calling checkout operation fails rather  than using an unknown balance.

For capture hook:

- **Blocking error:**Returning `Status.ERROR`or throwing an exception prevents checkout  from continuing to the remaining payment instruments. The platform fails the order and reopens the basket.
- **Idempotency:**The implementation must safely handle repeated capture calls for the same order  payment instrument, including calls retried after a provider timeout.

For refund hook:

- **Compensation error:**Return `Status.ERROR`when refund fails so the platform can  record and reconcile the incomplete compensation. Do not report success when the provider outcome is unknown.
- **Idempotency:**The implementation must safely handle repeated refund calls for the same order  payment instrument.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointCapture](#extensionpointcapture): [String](TopLevel.String.md) = "sfcc.app.giftcard.capture" | The extension point name sfcc.app.giftcard.capture. |
| [extensionPointGetBalance](#extensionpointgetbalance): [String](TopLevel.String.md) = "sfcc.app.giftcard.getBalance" | The extension point name sfcc.app.giftcard.getBalance. |
| [extensionPointRefund](#extensionpointrefund): [String](TopLevel.String.md) = "sfcc.app.giftcard.refund" | The extension point name sfcc.app.giftcard.refund. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [capture](dw.apps.checkout.hooks.GiftCardHooks.md#captureorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | The function called by extension point [extensionPointCapture](dw.apps.checkout.hooks.GiftCardHooks.md#extensionpointcapture). |
| [getBalance](dw.apps.checkout.hooks.GiftCardHooks.md#getbalancepaymentinstrumentbalancerequestwo)(PaymentInstrumentBalanceRequestWO) | The function called by extension point [extensionPointGetBalance](dw.apps.checkout.hooks.GiftCardHooks.md#extensionpointgetbalance). |
| [refund](dw.apps.checkout.hooks.GiftCardHooks.md#refundorder-orderpaymentinstrument)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)) | The function called by extension point [extensionPointRefund](dw.apps.checkout.hooks.GiftCardHooks.md#extensionpointrefund). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointCapture

- extensionPointCapture: [String](TopLevel.String.md) = "sfcc.app.giftcard.capture"
  - : The extension point name sfcc.app.giftcard.capture.


---

### extensionPointGetBalance

- extensionPointGetBalance: [String](TopLevel.String.md) = "sfcc.app.giftcard.getBalance"
  - : The extension point name sfcc.app.giftcard.getBalance.


---

### extensionPointRefund

- extensionPointRefund: [String](TopLevel.String.md) = "sfcc.app.giftcard.refund"
  - : The extension point name sfcc.app.giftcard.refund.


---

## Method Details

### capture(Order, OrderPaymentInstrument)
- capture(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : The function called by extension point [extensionPointCapture](dw.apps.checkout.hooks.GiftCardHooks.md#extensionpointcapture). It captures the gift card payment
      represented by the payment instrument during complete checkout.
      
      
      Returning `Status.ERROR` or throwing an exception blocks checkout. The implementation must make
      repeated calls for the same order payment instrument safe.


    **Parameters:**
    - order - the order whose gift card payment to capture
    - paymentInstrument - the gift card payment instrument to capture

    **Returns:**
    - `Status.OK` on successful capture or `Status.ERROR` if capture fails


---

### getBalance(PaymentInstrumentBalanceRequestWO)
- getBalance(request: PaymentInstrumentBalanceRequestWO): [Money](dw.value.Money.md)
  - : The function called by extension point [extensionPointGetBalance](dw.apps.checkout.hooks.GiftCardHooks.md#extensionpointgetbalance). It reads a gift card balance without
      applying, authorizing, or settling a payment instrument.


    **Parameters:**
    - request - the SCAPI payment instrument balance request, including its provider-specific properties

    **Returns:**
    - the available gift card balance


---

### refund(Order, OrderPaymentInstrument)
- refund(order: [Order](dw.order.Order.md), paymentInstrument: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md)): [Status](dw.system.Status.md)
  - : The function called by extension point [extensionPointRefund](dw.apps.checkout.hooks.GiftCardHooks.md#extensionpointrefund). It refunds a settled gift card payment
      after a later payment instrument fails during complete checkout.
      
      
      The implementation must make repeated calls for the same order payment instrument safe.


    **Parameters:**
    - order - the order whose gift card payment to refund
    - paymentInstrument - the gift card payment instrument to refund

    **Returns:**
    - `Status.OK` on successful refund or `Status.ERROR` if refund fails


---

<!-- prettier-ignore-end -->
