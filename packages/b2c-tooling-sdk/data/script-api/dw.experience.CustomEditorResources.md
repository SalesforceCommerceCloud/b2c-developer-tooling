<!-- prettier-ignore-start -->
# Class CustomEditorResources

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.CustomEditorResources](dw.experience.CustomEditorResources.md)

This class represents the resources of a custom editor, i.e. URLs to scripts and styles which are required for
client side functionality in Page Designer in context of the corresponding custom attribute UI. These resources
are initially specified as part of your custom editor type (i.e. the respective json file). If needed you can
revise and refine them as part of the `init` function that is called during initialization of the
[CustomEditor](dw.experience.CustomEditor.md), i.e. is subject to your implementation of the respective custom editor type js file.


**See Also:**
- [CustomEditor](dw.experience.CustomEditor.md)


## Property Summary

| Property | Description |
| --- | --- |
| [scripts](#scripts): [List](dw.util.List.md) `(read-only)` | Returns the specified script resource URLs. |
| [styles](#styles): [List](dw.util.List.md) `(read-only)` | Returns the specified style URLs. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getScripts](dw.experience.CustomEditorResources.md#getscripts)() | Returns the specified script resource URLs. |
| [getStyles](dw.experience.CustomEditorResources.md#getstyles)() | Returns the specified style URLs. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### scripts
- scripts: [List](dw.util.List.md) `(read-only)`
  - : Returns the specified script resource URLs. You can further modify this list
      at runtime of your `init` function to add more required scripts.
      Absolute URLs will be retained, relative paths will be resolved to absolute
      ones based on the cartridge path for static resources (e.g. similar to
      what [URLUtils.httpStatic(String)](dw.web.URLUtils.md#httpstaticstring) or
      [URLUtils.httpsStatic(String)](dw.web.URLUtils.md#httpsstaticstring)) does.



---

### styles
- styles: [List](dw.util.List.md) `(read-only)`
  - : Returns the specified style URLs. You can further modify this list
      at runtime of your `init` function to add more required styles.
      Absolute URLs will be retained, relative paths will be resolved to absolute
      ones based on the cartridge path for static resources (e.g. similar to
      what [URLUtils.httpStatic(String)](dw.web.URLUtils.md#httpstaticstring) or
      [URLUtils.httpsStatic(String)](dw.web.URLUtils.md#httpsstaticstring)) does.



---

## Method Details

### getScripts()
- getScripts(): [List](dw.util.List.md)
  - : Returns the specified script resource URLs. You can further modify this list
      at runtime of your `init` function to add more required scripts.
      Absolute URLs will be retained, relative paths will be resolved to absolute
      ones based on the cartridge path for static resources (e.g. similar to
      what [URLUtils.httpStatic(String)](dw.web.URLUtils.md#httpstaticstring) or
      [URLUtils.httpsStatic(String)](dw.web.URLUtils.md#httpsstaticstring)) does.


    **Returns:**
    - the script resources, will never be `null`


---

### getStyles()
- getStyles(): [List](dw.util.List.md)
  - : Returns the specified style URLs. You can further modify this list
      at runtime of your `init` function to add more required styles.
      Absolute URLs will be retained, relative paths will be resolved to absolute
      ones based on the cartridge path for static resources (e.g. similar to
      what [URLUtils.httpStatic(String)](dw.web.URLUtils.md#httpstaticstring) or
      [URLUtils.httpsStatic(String)](dw.web.URLUtils.md#httpsstaticstring)) does.


    **Returns:**
    - the style resources, will never be `null`


---

<!-- prettier-ignore-end -->
