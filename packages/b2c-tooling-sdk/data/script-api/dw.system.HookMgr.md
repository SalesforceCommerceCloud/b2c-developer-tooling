<!-- prettier-ignore-start -->
# Class HookMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.system.HookMgr](dw.system.HookMgr.md)

This class provides functionality to call hooks. A hook is an extension point in the business logic,
where you can register scripts to customize functionality.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [callHook](dw.system.HookMgr.md#callhookstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Calls a hook on base of the specified extensionPoint and function. |
| static [hasHook](dw.system.HookMgr.md#hashookstring)([String](TopLevel.String.md)) | Checks whether a hook is registered or a system default implementation exists for this extension point. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### callHook(String, String, Object...)
- static callHook(extensionPoint: [String](TopLevel.String.md), function: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [Object](TopLevel.Object.md)
  - : Calls a hook on base of the specified extensionPoint and function. If a hook throws an exception, then
      this method will also throw an exception. If no hook and no system default implementation is provided,
      then this method will return undefined.
      
      
      Sample:
      
      ```
      dw.system.HookMgr.callHook( "dw.order.calculate", "calculate", basket );
      ```


    **Parameters:**
    - extensionPoint - the extension point to call
    - function - the script function to call
    - args - the Array of function parameters

    **Returns:**
    - the object returned by the hook or undefined


---

### hasHook(String)
- static hasHook(extensionPoint: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Checks whether a hook is registered or a system default implementation exists for this extension point.
      
      _extensionPoint_ refers to the same name used to register a script as implementation. With this method it's only
      possible to check for a whole script registered but it is not possible to check, whether an individual function
      is implemented.
      
      
      
      Sample:
      
      ```
      dw.system.HookMgr.hasHook( "dw.order.calculate" );
      ```


    **Parameters:**
    - extensionPoint - the extension point

    **Returns:**
    - true, if a hook is registered or a default implementation exists, otherwise false


---

<!-- prettier-ignore-end -->
