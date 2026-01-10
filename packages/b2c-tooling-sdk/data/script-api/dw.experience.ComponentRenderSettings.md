<!-- prettier-ignore-start -->
# Class ComponentRenderSettings

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)

A config that drives how the component is rendered. One can basically decide which kind of tag is used as wrapper
element (e.g. `<div>...</div>`) and which attributes are to be placed into this wrapper
element (e.g. `class="foo bar"`). In case no attributes are provided then the system default settings will
apply. In case no tag name is provided then the system default one will apply.

- tag\_name : div
- attributes : {"class":"experience-component experience-\[COMPONENT\_TYPE\_ID\]"}

As the \[COMPONENT\_TYPE\_ID\] can contain dots due to its package like naming scheme (e.g. assets.image)
any occurrences of these dots will be replaced by dashes (e.g. assets-image) so that CSS selectors
do not have to be escaped.


**See Also:**
- [RegionRenderSettings](dw.experience.RegionRenderSettings.md)


## Property Summary

| Property | Description |
| --- | --- |
| [attributes](#attributes): [Object](TopLevel.Object.md) | Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.ComponentRenderSettings.md#setattributesobject). |
| [tagName](#tagname): [String](TopLevel.String.md) | Returns the tag name of the component wrapper element. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [ComponentRenderSettings](#componentrendersettings)() | Creates region render settings which can then be configured further. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAttributes](dw.experience.ComponentRenderSettings.md#getattributes)() | Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.ComponentRenderSettings.md#setattributesobject). |
| [getTagName](dw.experience.ComponentRenderSettings.md#gettagname)() | Returns the tag name of the component wrapper element. |
| [setAttributes](dw.experience.ComponentRenderSettings.md#setattributesobject)([Object](TopLevel.Object.md)) | Sets the to be configured <String,String> attributes of the wrapper element. |
| [setTagName](dw.experience.ComponentRenderSettings.md#settagnamestring)([String](TopLevel.String.md)) | Sets the tag name of the component wrapper element. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### attributes
- attributes: [Object](TopLevel.Object.md)
  - : Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.ComponentRenderSettings.md#setattributesobject).


---

### tagName
- tagName: [String](TopLevel.String.md)
  - : Returns the tag name of the component wrapper element. Defaults to 'div'.


---

## Constructor Details

### ComponentRenderSettings()
- ComponentRenderSettings()
  - : Creates region render settings which can then be configured further. They are to be used for detailed
      configuration of a [RegionRenderSettings](dw.experience.RegionRenderSettings.md) which is subsequently used for
      [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) calls.


    **See Also:**
    - [RegionRenderSettings](dw.experience.RegionRenderSettings.md)


---

## Method Details

### getAttributes()
- getAttributes(): [Object](TopLevel.Object.md)
  - : Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.ComponentRenderSettings.md#setattributesobject).

    **Returns:**
    - the configured attributes of the wrapper element


---

### getTagName()
- getTagName(): [String](TopLevel.String.md)
  - : Returns the tag name of the component wrapper element. Defaults to 'div'.

    **Returns:**
    - the tag name of the component wrapper element


---

### setAttributes(Object)
- setAttributes(attributes: [Object](TopLevel.Object.md)): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)
  - : Sets the to be configured <String,String> attributes of the wrapper element. Set it to `null` in case
      you want to system defaults to be applied.


    **Parameters:**
    - attributes - the to be configured attributes of the wrapper element

    **Returns:**
    - this


---

### setTagName(String)
- setTagName(tagName: [String](TopLevel.String.md)): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)
  - : Sets the tag name of the component wrapper element. Must not be empty.

    **Parameters:**
    - tagName - the tag name of the component wrapper element

    **Returns:**
    - this


---

<!-- prettier-ignore-end -->
