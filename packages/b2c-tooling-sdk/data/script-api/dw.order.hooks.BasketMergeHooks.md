<!-- prettier-ignore-start -->
# Class BasketMergeHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.order.hooks.BasketMergeHooks](dw.order.hooks.BasketMergeHooks.md)

This interface represents all script hooks that can be registered to merge baskets. It contains the extension points
(hook names), and the functions that are called by each extension point. A function must be defined inside a
JavaScript source and must be exported. The script with the exported hook function must be located inside a site
cartridge. Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.


```
"hooks": "./hooks.json"
```


The hooks entry links to a json file, relative to the 'package.json' file. This file lists all registered hooks
inside the hooks property:


```
"hooks": [
     {"name": "dw.order.mergeBasket", "script": "./mergeBasket.js"}
]
```


A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointMerge](#extensionpointmerge): [String](TopLevel.String.md) = "dw.order.mergeBasket" | The extension point name dw.order.mergeBasket. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [mergeBasket](dw.order.hooks.BasketMergeHooks.md#mergebasketbasket-basket)([Basket](dw.order.Basket.md), [Basket](dw.order.Basket.md)) | Merges content from a source basket (typically a former registered shopper's basket) into the current basket  (usually a former guest shopper's basket that was transferred to the registered shopper). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointMerge

- extensionPointMerge: [String](TopLevel.String.md) = "dw.order.mergeBasket"
  - : The extension point name dw.order.mergeBasket.


---

## Method Details

### mergeBasket(Basket, Basket)
- mergeBasket(source: [Basket](dw.order.Basket.md), currentBasket: [Basket](dw.order.Basket.md)): [Status](dw.system.Status.md)
  - : Merges content from a source basket (typically a former registered shopper's basket) into the current basket
      (usually a former guest shopper's basket that was transferred to the registered shopper).
      
      
      If no override script is registered, the system defaults to the platform's standard basket merging logic.
      
      
      This method is automatically invoked after a successful execution of the /transfer REST API with the query
      parameter merge=true, if either the guest or the registered users had baskets assigned. The registered shopper's
      basket will be the source for the merge, and the transferred guest shopper's basket will be the current basket.


    **Parameters:**
    - source - the basket from which data will be merged into the current basket. Will be `null` if the             former guest shopper did not have an assigned basket.
    - currentBasket - the current basket to merge data into


---

<!-- prettier-ignore-end -->
