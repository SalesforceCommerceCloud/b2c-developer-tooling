<!-- prettier-ignore-start -->
# Class CustomEditor

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.CustomEditor](dw.experience.CustomEditor.md)

This class represents a custom editor for component attributes of type `custom`. It is instantiated
by Page Designer and is subsequently used there for editing of such attributes by the merchant in a visual manner.
It therefore serves the Page Designer with all information required by such UI. What exactly
this information will be is up to the developer of the respective custom editor UI, i.e. depends on the respective
json and js files written for both the attribute definition as well as the custom editor type. Currently a configuration can be
served (basically values passed to Page Designer so that it can bootstrap the custom editor UI on the client side).
Furthermore resources can be served, which are URLs to scripts and styles required by the same UI (you will
likely require your own Javascript and CSS there).


You can access the aforementioned configuration as provided through the editor definition of the respective attribute
definition, which you can also adjust in the `init` function (see corresponding js file of your custom editor
type) that is called during initialization of the custom editor, i.e. right before it is passed to the Page Designer UI.
The same applies for the script and style resources which you specified as part of your custom editor type and which you
can refine with the `init` function as needed.



## Property Summary

| Property | Description |
| --- | --- |
| [configuration](#configuration): [Map](dw.util.Map.md) `(read-only)` | Returns the configuration of the custom editor. |
| [dependencies](#dependencies): [Map](dw.util.Map.md) `(read-only)` | <p>  Returns the dependencies to other custom editors, e.g. |
| [resources](#resources): [CustomEditorResources](dw.experience.CustomEditorResources.md) `(read-only)` | Returns the resources of the custom editor. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getConfiguration](dw.experience.CustomEditor.md#getconfiguration)() | Returns the configuration of the custom editor. |
| [getDependencies](dw.experience.CustomEditor.md#getdependencies)() | <p>  Returns the dependencies to other custom editors, e.g. |
| [getResources](dw.experience.CustomEditor.md#getresources)() | Returns the resources of the custom editor. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### configuration
- configuration: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the configuration of the custom editor. This is initialized with the values as provided
      through the editor definition of the respective attribute definition of type `custom`.
      Be aware that this configuration will have to be serializable to JSON itself as it will be passed
      to Page Designer for processing in the UI. So you must not add any values in this map that are not
      properly serializable. Do not use complex DWScript classes that do not support JSON serialization
      like for instance [Product](dw.catalog.Product.md).



---

### dependencies
- dependencies: [Map](dw.util.Map.md) `(read-only)`
  - : 
      
      Returns the dependencies to other custom editors, e.g. used as breakout elements. You can use
      this mapping to add more custom editor dependencies as needed. For this purpose you want to create
      a [CustomEditor](dw.experience.CustomEditor.md) instance via [PageMgr.getCustomEditor(String, Map)](dw.experience.PageMgr.md#getcustomeditorstring-map)) and then add it
      to the dependencies mapping with an ID of your choice. In the client side logic of Page Designer
      you will then be able to access these dependencies again by using the corresponding ID.
      
      
      
      
      This is especially helpful if your custom editor for an attribute requires to open a breakout panel,
      e.g. for a separate picker required by your custom editor. This picker could be another custom editor,
      i.e. the one you declare as dependency here.



---

### resources
- resources: [CustomEditorResources](dw.experience.CustomEditorResources.md) `(read-only)`
  - : Returns the resources of the custom editor. This is initialized with the values as specified
      by the custom editor type json (see the respective styles and scripts section).



---

## Method Details

### getConfiguration()
- getConfiguration(): [Map](dw.util.Map.md)
  - : Returns the configuration of the custom editor. This is initialized with the values as provided
      through the editor definition of the respective attribute definition of type `custom`.
      Be aware that this configuration will have to be serializable to JSON itself as it will be passed
      to Page Designer for processing in the UI. So you must not add any values in this map that are not
      properly serializable. Do not use complex DWScript classes that do not support JSON serialization
      like for instance [Product](dw.catalog.Product.md).


    **Returns:**
    - the configuration of the custom editor


---

### getDependencies()
- getDependencies(): [Map](dw.util.Map.md)
  - : 
      
      Returns the dependencies to other custom editors, e.g. used as breakout elements. You can use
      this mapping to add more custom editor dependencies as needed. For this purpose you want to create
      a [CustomEditor](dw.experience.CustomEditor.md) instance via [PageMgr.getCustomEditor(String, Map)](dw.experience.PageMgr.md#getcustomeditorstring-map)) and then add it
      to the dependencies mapping with an ID of your choice. In the client side logic of Page Designer
      you will then be able to access these dependencies again by using the corresponding ID.
      
      
      
      
      This is especially helpful if your custom editor for an attribute requires to open a breakout panel,
      e.g. for a separate picker required by your custom editor. This picker could be another custom editor,
      i.e. the one you declare as dependency here.


    **Returns:**
    - an ID to [CustomEditor](dw.experience.CustomEditor.md) mapping


---

### getResources()
- getResources(): [CustomEditorResources](dw.experience.CustomEditorResources.md)
  - : Returns the resources of the custom editor. This is initialized with the values as specified
      by the custom editor type json (see the respective styles and scripts section).


    **Returns:**
    - the custom editor resources, will never be `null`


---

<!-- prettier-ignore-end -->
