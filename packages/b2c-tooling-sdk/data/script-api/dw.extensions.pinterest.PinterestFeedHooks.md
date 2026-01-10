<!-- prettier-ignore-start -->
# Class PinterestFeedHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.extensions.pinterest.PinterestFeedHooks](dw.extensions.pinterest.PinterestFeedHooks.md)

PinterestFeedHooks interface containing extension points for customizing Pinterest export feeds.


These hooks are not executed in a transaction.


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
     {"name": "dw.extensions.pinterest.feed.transformProduct", "script": "./hooks.ds"}
]
```



A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointTransformAvailability](#extensionpointtransformavailability): [String](TopLevel.String.md) = "dw.extensions.pinterest.feed.transformAvailability" | The extension point name dw.extensions.pinterest.feed.transformAvailability. |
| [extensionPointTransformProduct](#extensionpointtransformproduct): [String](TopLevel.String.md) = "dw.extensions.pinterest.feed.transformProduct" | The extension point name dw.extensions.pinterest.feed.transformProduct. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [transformAvailability](dw.extensions.pinterest.PinterestFeedHooks.md#transformavailabilityproduct-pinterestavailability)([Product](dw.catalog.Product.md), [PinterestAvailability](dw.extensions.pinterest.PinterestAvailability.md)) | Called after default transformation of given Demandware product to Pinterest availability as part of the  availability feed export. |
| [transformProduct](dw.extensions.pinterest.PinterestFeedHooks.md#transformproductproduct-pinterestproduct)([Product](dw.catalog.Product.md), [PinterestProduct](dw.extensions.pinterest.PinterestProduct.md)) | Called after default transformation of given Demandware product to Pinterest product as part of the catalog feed  export. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointTransformAvailability

- extensionPointTransformAvailability: [String](TopLevel.String.md) = "dw.extensions.pinterest.feed.transformAvailability"
  - : The extension point name dw.extensions.pinterest.feed.transformAvailability.


---

### extensionPointTransformProduct

- extensionPointTransformProduct: [String](TopLevel.String.md) = "dw.extensions.pinterest.feed.transformProduct"
  - : The extension point name dw.extensions.pinterest.feed.transformProduct.


---

## Method Details

### transformAvailability(Product, PinterestAvailability)
- transformAvailability(product: [Product](dw.catalog.Product.md), pinterestAvailability: [PinterestAvailability](dw.extensions.pinterest.PinterestAvailability.md)): [Status](dw.system.Status.md)
  - : Called after default transformation of given Demandware product to Pinterest availability as part of the
      availability feed export.


    **Parameters:**
    - product - the Demandware product
    - pinterestAvailability - the Pinterest representation of the product availability

    **Returns:**
    - a non-null Status ends the hook execution


---

### transformProduct(Product, PinterestProduct)
- transformProduct(product: [Product](dw.catalog.Product.md), pinterestProduct: [PinterestProduct](dw.extensions.pinterest.PinterestProduct.md)): [Status](dw.system.Status.md)
  - : Called after default transformation of given Demandware product to Pinterest product as part of the catalog feed
      export.


    **Parameters:**
    - product - the Demandware product
    - pinterestProduct - the Pinterest representation of the product

    **Returns:**
    - a non-null Status ends the hook execution


---

<!-- prettier-ignore-end -->
