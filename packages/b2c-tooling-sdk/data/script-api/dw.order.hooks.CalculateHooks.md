<!-- prettier-ignore-start -->
# Class CalculateHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.CalculateHooks](dw.order.hooks.CalculateHooks.md)

This interface represents all script hooks that can be registered to customize the order and basket calculation
functionality. It contains the extension points (hook names), and the functions that are called by each extension
point. A function must be defined inside a JavaScript source and must be exported. The script with the exported hook
function must be located inside a site cartridge. Inside the site cartridge a 'package.json' file with a 'hooks'
entry must exist.


```
"hooks": "./hooks.json"
```


The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:


```
"hooks": [
     {"name": "dw.order.calculate", "script": "./calculate.js"}
]
```


A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointCalculate](#extensionpointcalculate): [String](TopLevel.String.md) = "dw.order.calculate" | The extension point name dw.order.calculate. |
| [extensionPointCalculateShipping](#extensionpointcalculateshipping): [String](TopLevel.String.md) = "dw.order.calculateShipping" | The extension point name dw.order.calculateShipping. |
| [extensionPointCalculateTax](#extensionpointcalculatetax): [String](TopLevel.String.md) = "dw.order.calculateTax" | The extension point name dw.order.calculateTax. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [calculate](dw.order.hooks.CalculateHooks.md#calculatelineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | The function is called by extension point [extensionPointCalculate](dw.order.hooks.CalculateHooks.md#extensionpointcalculate). |
| [calculateShipping](dw.order.hooks.CalculateHooks.md#calculateshippinglineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | The function is called by extension point [extensionPointCalculateShipping](dw.order.hooks.CalculateHooks.md#extensionpointcalculateshipping). |
| [calculateTax](dw.order.hooks.CalculateHooks.md#calculatetaxlineitemctnr)([LineItemCtnr](dw.order.LineItemCtnr.md)) | The function is called by extension point [extensionPointCalculateTax](dw.order.hooks.CalculateHooks.md#extensionpointcalculatetax). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointCalculate

- extensionPointCalculate: [String](TopLevel.String.md) = "dw.order.calculate"
  - : The extension point name dw.order.calculate.


---

### extensionPointCalculateShipping

- extensionPointCalculateShipping: [String](TopLevel.String.md) = "dw.order.calculateShipping"
  - : The extension point name dw.order.calculateShipping.


---

### extensionPointCalculateTax

- extensionPointCalculateTax: [String](TopLevel.String.md) = "dw.order.calculateTax"
  - : The extension point name dw.order.calculateTax.


---

## Method Details

### calculate(LineItemCtnr)
- calculate(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointCalculate](dw.order.hooks.CalculateHooks.md#extensionpointcalculate). It provides a single place for
      the line item container calculation.
      
      
      To provide a fallback for existing implementations, the default implementation calls the hook
      dw.ocapi.shop.basket.calculate. However, this hook is deprecated, and calling it will create entries in the
      deprecated API usage logs. You should override this function to use dw.order.calculate instead.
      
      
      
      
      If you provide your own implementation, you should provide and use the following hooks. Best practice is
      to use the hook manager to retrieve them in the calculate hook, and avoid calling them directly.
      
      
      
      - [extensionPointCalculateTax](dw.order.hooks.CalculateHooks.md#extensionpointcalculatetax)for tax calculation
      - [extensionPointCalculateShipping](dw.order.hooks.CalculateHooks.md#extensionpointcalculateshipping)for shipping calculation


    **Parameters:**
    - lineItemCtnr - the line item container to be (re)calculated.


---

### calculateShipping(LineItemCtnr)
- calculateShipping(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointCalculateShipping](dw.order.hooks.CalculateHooks.md#extensionpointcalculateshipping). It provides a single
      place for shipping calculation during the line item container calculation.


    **Parameters:**
    - lineItemCtnr - the line item container to be (re)calculated.


---

### calculateTax(LineItemCtnr)
- calculateTax(lineItemCtnr: [LineItemCtnr](dw.order.LineItemCtnr.md)): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointCalculateTax](dw.order.hooks.CalculateHooks.md#extensionpointcalculatetax). It provides a single place
      for tax calculation during the line item container calculation.


    **Parameters:**
    - lineItemCtnr - the line item container to be (re)calculated.


---

<!-- prettier-ignore-end -->
