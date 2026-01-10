<!-- prettier-ignore-start -->
# Class RequestHooks

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.RequestHooks](dw.system.RequestHooks.md)

This class represents all script hooks that can be registered to receive notifications about storefront requests.
It contains the extension points (hook names), and the functions that are called by each extension point.
A function must be defined inside a JavaScript source and must be exported.
The script with the exported hook function must be located inside a site cartridge.
Inside the site cartridge a 'package.json' file with a 'hooks' entry must exist.



```
"hooks": "./hooks.json"
```



The hooks entry links to a json file, relative to the 'package.json' file.
This file lists all registered hooks inside the hooks property:



```
"hooks": [
     {"name": "dw.system.request.onSession", "script": "./script.js"},
     {"name": "dw.system.request.onRequest", "script": "./script.js"},
]
```



A hook entry has a 'name' and a 'script' property.

- The 'name' contains the extension point, the hook name.
- The 'script' contains the script relative to the hooks file, with the exported hook function.



## Constant Summary

| Constant | Description |
| --- | --- |
| [extensionPointOnRequest](#extensionpointonrequest): [String](TopLevel.String.md) = "dw.system.request.onRequest" | The extension point name dw.system.request.onRequest. |
| [extensionPointOnSession](#extensionpointonsession): [String](TopLevel.String.md) = "dw.system.request.onSession" | The extension point name dw.system.request.onSession. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [onRequest](dw.system.RequestHooks.md#onrequest)() | The function is called by extension point [extensionPointOnRequest](dw.system.RequestHooks.md#extensionpointonrequest). |
| [onSession](dw.system.RequestHooks.md#onsession)() | The function is called by extension point [extensionPointOnSession](dw.system.RequestHooks.md#extensionpointonsession). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### extensionPointOnRequest

- extensionPointOnRequest: [String](TopLevel.String.md) = "dw.system.request.onRequest"
  - : The extension point name dw.system.request.onRequest.


---

### extensionPointOnSession

- extensionPointOnSession: [String](TopLevel.String.md) = "dw.system.request.onSession"
  - : The extension point name dw.system.request.onSession.


---

## Method Details

### onRequest()
- onRequest(): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointOnRequest](dw.system.RequestHooks.md#extensionpointonrequest).
      It is called when a storefront request was received from the client.


    **Returns:**
    - 
      - Status.OK for success.
      - Status.ERROR for error.



---

### onSession()
- onSession(): [Status](dw.system.Status.md)
  - : The function is called by extension point [extensionPointOnSession](dw.system.RequestHooks.md#extensionpointonsession).
      It is called when a new storefront session was started.


    **Returns:**
    - 
      - Status.OK for success.
      - Status.ERROR for error.



---

<!-- prettier-ignore-end -->
