<!-- prettier-ignore-start -->
# Class PaymentApiHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.paymentapi.PaymentApiHooks](dw.extensions.paymentapi.PaymentApiHooks.md)

PaymentApiHooks interface containing extension points for customizing Payment API requests for authorization,
and their responses.


These hooks are executed in a transaction.


The extension points (hook names), and the functions that are called by each extension point. A function must be
defined inside a JavaScript source and must be exported. The script with the exported hook function must be located
inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.




```
"hooks": "./hooks.json"
```


The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:




```
"hooks": [
     {"name": "dw.extensions.paymentapi.beforeAuthorization", "script": "./payment.ds"}
     {"name": "dw.extensions.paymentapi.afterAuthorization", "script": "./payment.ds"}
]
```



A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointAfterAuthorization](#extensionpointafterauthorization): [String](TopLevel.String.md) = "dw.extensions.paymentapi.afterAuthorization" | The extension point name dw.extensions.paymentapi.afterAuthorization. |
| [extensionPointBeforeAuthorization](#extensionpointbeforeauthorization): [String](TopLevel.String.md) = "dw.extensions.paymentapi.beforeAuthorization" | The extension point name dw.extensions.paymentapi.beforeAuthorization. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [afterAuthorization](dw.extensions.paymentapi.PaymentApiHooks.md#afterauthorizationorder-orderpaymentinstrument-object-status)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Object](TopLevel.Object.md), [Status](dw.system.Status.md)) | <p>  Called after the response has been handled for a request to authorize payment for the given order. |
| [beforeAuthorization](dw.extensions.paymentapi.PaymentApiHooks.md#beforeauthorizationorder-orderpaymentinstrument-object)([Order](dw.order.Order.md), [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), [Object](TopLevel.Object.md)) | <p>  Called when a request is to be made to authorize payment for the given order. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointAfterAuthorization

- extensionPointAfterAuthorization: [String](TopLevel.String.md) = "dw.extensions.paymentapi.afterAuthorization"
  - : The extension point name dw.extensions.paymentapi.afterAuthorization.


---

### extensionPointBeforeAuthorization

- extensionPointBeforeAuthorization: [String](TopLevel.String.md) = "dw.extensions.paymentapi.beforeAuthorization"
  - : The extension point name dw.extensions.paymentapi.beforeAuthorization.


---

## Method Details

### afterAuthorization(Order, OrderPaymentInstrument, Object, Status)
- afterAuthorization(order: [Order](dw.order.Order.md), payment: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), custom: [Object](TopLevel.Object.md), status: [Status](dw.system.Status.md)): [Status](dw.system.Status.md)
  - : 
      
      Called after the response has been handled for a request to authorize payment for the given order.
      
      
      
      
      The given status is the result of handling the response without customization. That status will be
      used unless an implementation of this hook returns an alternative status.


    **Parameters:**
    - order - the order whose payment to authorize
    - payment - the payment instrument to authorize
    - custom - container of custom properties included in the PSP response
    - status - the result of handling the response without customization

    **Returns:**
    - a non-null result ends the hook execution


---

### beforeAuthorization(Order, OrderPaymentInstrument, Object)
- beforeAuthorization(order: [Order](dw.order.Order.md), payment: [OrderPaymentInstrument](dw.order.OrderPaymentInstrument.md), custom: [Object](TopLevel.Object.md)): [Status](dw.system.Status.md)
  - : 
      
      Called when a request is to be made to authorize payment for the given order.
      
      
      
      
      Return an error status to indicate a problem. The request will not be made to the payment provider.


    **Parameters:**
    - order - the order whose payment to authorize
    - payment - the payment instrument to authorize
    - custom - container for custom properties to include in request

    **Returns:**
    - a non-null result ends the hook execution


---

<!-- prettier-ignore-end -->
