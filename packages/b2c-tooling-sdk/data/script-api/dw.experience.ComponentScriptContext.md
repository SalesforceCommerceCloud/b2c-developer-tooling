<!-- prettier-ignore-start -->
# Class ComponentScriptContext

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.ComponentScriptContext](dw.experience.ComponentScriptContext.md)

This is the context that is handed over to the `render` and `serialize` function of the respective component type
script.

```
    String : render( [ComponentScriptContext](dw.experience.ComponentScriptContext.md) context)
    Object : serialize( [ComponentScriptContext](dw.experience.ComponentScriptContext.md) context)
```



## Property Summary

| Property | Description |
| --- | --- |
| [component](#component): [Component](dw.experience.Component.md) `(read-only)` | Returns the component for which the corresponding component type script is currently executed. |
| [componentRenderSettings](#componentrendersettings): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md) `(read-only)` | As components are implicitly rendered as part of their hosting region via  [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) there is the possibility  to define render settings for the region itself but also for its contained components. |
| [content](#content): [Map](dw.util.Map.md) `(read-only)` | Returns the processed version of the underlying unprocessed raw values (also see [Component.getAttribute(String)](dw.experience.Component.md#getattributestring))  of this component's attributes which you can use in your respective component type `render` and `serialize` function  implementing your business and rendering/serialization functionality. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getComponent](dw.experience.ComponentScriptContext.md#getcomponent)() | Returns the component for which the corresponding component type script is currently executed. |
| [getComponentRenderSettings](dw.experience.ComponentScriptContext.md#getcomponentrendersettings)() | As components are implicitly rendered as part of their hosting region via  [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) there is the possibility  to define render settings for the region itself but also for its contained components. |
| [getContent](dw.experience.ComponentScriptContext.md#getcontent)() | Returns the processed version of the underlying unprocessed raw values (also see [Component.getAttribute(String)](dw.experience.Component.md#getattributestring))  of this component's attributes which you can use in your respective component type `render` and `serialize` function  implementing your business and rendering/serialization functionality. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### component
- component: [Component](dw.experience.Component.md) `(read-only)`
  - : Returns the component for which the corresponding component type script is currently executed.


---

### componentRenderSettings
- componentRenderSettings: [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md) `(read-only)`
  - : As components are implicitly rendered as part of their hosting region via
      [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) there is the possibility
      to define render settings for the region itself but also for its contained components.
      The latter will be provided here so you further set or refine them for your component
      as part of the `render` function, i.e. to drive the shape of the
      component wrapper element.



---

### content
- content: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the processed version of the underlying unprocessed raw values (also see [Component.getAttribute(String)](dw.experience.Component.md#getattributestring))
      of this component's attributes which you can use in your respective component type `render` and `serialize` function
      implementing your business and rendering/serialization functionality. Processing the raw value is comprised of **expansion**
      and **conversion**, in this order.
      
      1. **expansion**- dynamic placeholders are transformed into actual values, for example url/link placeholders in       markup text are resolved to real URLs
      2. **conversion**- the raw value (see [Component.getAttribute(String)](dw.experience.Component.md#getattributestring)) is resolved into an actual       DWScript object depending on the type of the attribute as specified in its respective attribute definition        
         - `boolean`-> boolean
         - `category`-> [Category](dw.catalog.Category.md)
         - `custom`-> [Map](dw.util.Map.md)
         - `cms_record`-> [CMSRecord](dw.experience.cms.CMSRecord.md)
         - `enum`-> either string or integer 
         - `file`-> [MediaFile](dw.content.MediaFile.md)
         - `image`-> [Image](dw.experience.image.Image.md)
         - `integer`-> integer
         - `markup`-> string
         - `page`-> string
         - `product`-> [Product](dw.catalog.Product.md)
         - `string`-> string
         - `text`-> string
         - `url`-> string



---

## Method Details

### getComponent()
- getComponent(): [Component](dw.experience.Component.md)
  - : Returns the component for which the corresponding component type script is currently executed.

    **Returns:**
    - the currently rendered component


---

### getComponentRenderSettings()
- getComponentRenderSettings(): [ComponentRenderSettings](dw.experience.ComponentRenderSettings.md)
  - : As components are implicitly rendered as part of their hosting region via
      [PageMgr.renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings) there is the possibility
      to define render settings for the region itself but also for its contained components.
      The latter will be provided here so you further set or refine them for your component
      as part of the `render` function, i.e. to drive the shape of the
      component wrapper element.


    **Returns:**
    - the component render settings


---

### getContent()
- getContent(): [Map](dw.util.Map.md)
  - : Returns the processed version of the underlying unprocessed raw values (also see [Component.getAttribute(String)](dw.experience.Component.md#getattributestring))
      of this component's attributes which you can use in your respective component type `render` and `serialize` function
      implementing your business and rendering/serialization functionality. Processing the raw value is comprised of **expansion**
      and **conversion**, in this order.
      
      1. **expansion**- dynamic placeholders are transformed into actual values, for example url/link placeholders in       markup text are resolved to real URLs
      2. **conversion**- the raw value (see [Component.getAttribute(String)](dw.experience.Component.md#getattributestring)) is resolved into an actual       DWScript object depending on the type of the attribute as specified in its respective attribute definition        
         - `boolean`-> boolean
         - `category`-> [Category](dw.catalog.Category.md)
         - `custom`-> [Map](dw.util.Map.md)
         - `cms_record`-> [CMSRecord](dw.experience.cms.CMSRecord.md)
         - `enum`-> either string or integer 
         - `file`-> [MediaFile](dw.content.MediaFile.md)
         - `image`-> [Image](dw.experience.image.Image.md)
         - `integer`-> integer
         - `markup`-> string
         - `page`-> string
         - `product`-> [Product](dw.catalog.Product.md)
         - `string`-> string
         - `text`-> string
         - `url`-> string


    **Returns:**
    - processed content attributes of the component


---

<!-- prettier-ignore-end -->
