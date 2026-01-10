<!-- prettier-ignore-start -->
# Class RegionRenderSettings

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.RegionRenderSettings](dw.experience.RegionRenderSettings.md)

A config that drives how the region is rendered. One can basically decide which kind of tag is used as wrapper
element (e.g. `<div>...</div>`) and which attributes are to be placed into this wrapper
element (e.g. `class="foo bar"`).


If no attributes are provided for the region render settings then the system default ones will apply. Also if no tag
name is provided then the system default one will apply.

- tag\_name : div
- attributes : {"class":"experience-region experience-\[REGION\_ID\]"}

Furthermore the render settings for components in this region can be specified - in case nothing is set per component
then the default component render setting will be applied during rendering. If also no default component render
setting is provided then the system default one will apply (see [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)).


**See Also:**
- [PageMgr.renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion)
- [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings)


## Property Summary

| Property | Description |
| --- | --- |
| [attributes](#attributes): [Object](TopLevel.Object.md) | Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.RegionRenderSettings.md#setattributesobject). |
| [defaultComponentRenderSettings](#defaultcomponentrendersettings): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md) | Returns the default component render settings. |
| [tagName](#tagname): [String](TopLevel.String.md) | Returns the tag name of the region wrapper element. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [RegionRenderSettings](#regionrendersettings)() | Creates region render settings which can then be configured further. |

## Method Summary

| Method | Description |
| --- | --- |
| [getAttributes](dw.experience.RegionRenderSettings.md#getattributes)() | Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.RegionRenderSettings.md#setattributesobject). |
| [getComponentRenderSettings](dw.experience.RegionRenderSettings.md#getcomponentrendersettingscomponent)([Component](dw.experience.Component.md)) | Returns the component render settings for the given component. |
| [getDefaultComponentRenderSettings](dw.experience.RegionRenderSettings.md#getdefaultcomponentrendersettings)() | Returns the default component render settings. |
| [getTagName](dw.experience.RegionRenderSettings.md#gettagname)() | Returns the tag name of the region wrapper element. |
| [setAttributes](dw.experience.RegionRenderSettings.md#setattributesobject)([Object](TopLevel.Object.md)) | Sets the to be configured <String,String> attributes of the wrapper element. |
| [setComponentRenderSettings](dw.experience.RegionRenderSettings.md#setcomponentrendersettingscomponent-componentrendersettings)([Component](dw.experience.Component.md), [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)) | Sets the component render settings for the given component. |
| [setDefaultComponentRenderSettings](dw.experience.RegionRenderSettings.md#setdefaultcomponentrendersettingscomponentrendersettings)([ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)) | Sets the default component render settings. |
| [setTagName](dw.experience.RegionRenderSettings.md#settagnamestring)([String](TopLevel.String.md)) | Sets the tag name of the region wrapper element. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### attributes
- attributes: [Object](TopLevel.Object.md)
  - : Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.RegionRenderSettings.md#setattributesobject).


---

### defaultComponentRenderSettings
- defaultComponentRenderSettings: [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)
  - : Returns the default component render settings. These will be used during rendering of the components contained in
      the region in case no dedicated component render settings were provided per component. If also no default is
      supplied then the system default will be used during rendering.



---

### tagName
- tagName: [String](TopLevel.String.md)
  - : Returns the tag name of the region wrapper element. Defaults to 'div'.


---

## Constructor Details

### RegionRenderSettings()
- RegionRenderSettings()
  - : Creates region render settings which can then be configured further. They are to be used for
      [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) calls.


    **See Also:**
    - [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)


---

## Method Details

### getAttributes()
- getAttributes(): [Object](TopLevel.Object.md)
  - : Returns the configured attributes of the wrapper element as set by [setAttributes(Object)](dw.experience.RegionRenderSettings.md#setattributesobject).

    **Returns:**
    - the configured attributes of the wrapper element


---

### getComponentRenderSettings(Component)
- getComponentRenderSettings(component: [Component](dw.experience.Component.md)): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)
  - : Returns the component render settings for the given component. In case no explicitly specified settings are found
      for this component then the default one will be provided.


    **Parameters:**
    - component - the component to retrieve the render settings for

    **Returns:**
    - the component render settings or default component render settings if none were found for the given
              component



---

### getDefaultComponentRenderSettings()
- getDefaultComponentRenderSettings(): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)
  - : Returns the default component render settings. These will be used during rendering of the components contained in
      the region in case no dedicated component render settings were provided per component. If also no default is
      supplied then the system default will be used during rendering.


    **Returns:**
    - the default component render settings


---

### getTagName()
- getTagName(): [String](TopLevel.String.md)
  - : Returns the tag name of the region wrapper element. Defaults to 'div'.

    **Returns:**
    - the tag name of the region wrapper element


---

### setAttributes(Object)
- setAttributes(attributes: [Object](TopLevel.Object.md)): [RegionRenderSettings](dw.experience.RegionRenderSettings.md)
  - : Sets the to be configured <String,String> attributes of the wrapper element. Set to `null` in case you
      want to system defaults to be applied.


    **Parameters:**
    - attributes - the to be configured attributes of the wrapper element

    **Returns:**
    - this


---

### setComponentRenderSettings(Component, ComponentRenderSettings)
- setComponentRenderSettings(component: [Component](dw.experience.Component.md), componentRenderSettings: [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)): [RegionRenderSettings](dw.experience.RegionRenderSettings.md)
  - : Sets the component render settings for the given component.

    **Parameters:**
    - component - the component to set the render settings for
    - componentRenderSettings - the desired render settings

    **Returns:**
    - this


---

### setDefaultComponentRenderSettings(ComponentRenderSettings)
- setDefaultComponentRenderSettings(defaultComponentRenderSettings: [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)): [RegionRenderSettings](dw.experience.RegionRenderSettings.md)
  - : Sets the default component render settings. These will be used during rendering of the components contained in
      the region in case no dedicated component render settings were provided per component.


    **Parameters:**
    - defaultComponentRenderSettings - the default component render settings

    **Returns:**
    - this


---

### setTagName(String)
- setTagName(tagName: [String](TopLevel.String.md)): [RegionRenderSettings](dw.experience.RegionRenderSettings.md)
  - : Sets the tag name of the region wrapper element. Must not be empty.

    **Parameters:**
    - tagName - the tag name of the region wrapper element

    **Returns:**
    - this


---

<!-- prettier-ignore-end -->
