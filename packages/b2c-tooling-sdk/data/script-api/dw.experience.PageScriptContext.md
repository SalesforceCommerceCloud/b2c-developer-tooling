<!-- prettier-ignore-start -->
# Class PageScriptContext

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.PageScriptContext](dw.experience.PageScriptContext.md)

This is the context that is handed over to the `render` and `serialize` function of the respective page type
script.


```
    String : render( [PageScriptContext](dw.experience.PageScriptContext.md) context)
    Object : serialize( [PageScriptContext](dw.experience.PageScriptContext.md) context)
```



## Property Summary

| Property | Description |
| --- | --- |
| [content](#content): [Map](dw.util.Map.md) `(read-only)` | Returns the processed version of the underlying unprocessed raw values (also see [Page.getAttribute(String)](dw.experience.Page.md#getattributestring))  of this page's attributes which you can use in your respective page type `render` and `serialize` function  implementing your business and rendering/serialization functionality. |
| [page](#page): [Page](dw.experience.Page.md) `(read-only)` | Returns the page for which the corresponding page type script is currently executed. |
| ~~[renderParameters](#renderparameters): [String](TopLevel.String.md)~~ `(read-only)` | Returns the `parameters` argument as passed when kicking off page rendering via  <ul>   <li>[PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)</li>   <li>[PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)</li>  </ul>  and serialization  <ul>   <li>[PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)</li>   <li>[PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)</li>  </ul> |
| [runtimeParameters](#runtimeparameters): [String](TopLevel.String.md) `(read-only)` | Returns the `parameters` argument as passed when kicking off page rendering via  <ul>   <li>[PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)</li>   <li>[PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)</li>  </ul>  and page serialization via  <ul>   <li>[PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)</li>   <li>[PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)</li>  </ul> |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getContent](dw.experience.PageScriptContext.md#getcontent)() | Returns the processed version of the underlying unprocessed raw values (also see [Page.getAttribute(String)](dw.experience.Page.md#getattributestring))  of this page's attributes which you can use in your respective page type `render` and `serialize` function  implementing your business and rendering/serialization functionality. |
| [getPage](dw.experience.PageScriptContext.md#getpage)() | Returns the page for which the corresponding page type script is currently executed. |
| ~~[getRenderParameters](dw.experience.PageScriptContext.md#getrenderparameters)()~~ | Returns the `parameters` argument as passed when kicking off page rendering via  <ul>   <li>[PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)</li>   <li>[PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)</li>  </ul>  and serialization  <ul>   <li>[PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)</li>   <li>[PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)</li>  </ul> |
| [getRuntimeParameters](dw.experience.PageScriptContext.md#getruntimeparameters)() | Returns the `parameters` argument as passed when kicking off page rendering via  <ul>   <li>[PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)</li>   <li>[PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)</li>  </ul>  and page serialization via  <ul>   <li>[PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)</li>   <li>[PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)</li>  </ul> |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### content
- content: [Map](dw.util.Map.md) `(read-only)`
  - : Returns the processed version of the underlying unprocessed raw values (also see [Page.getAttribute(String)](dw.experience.Page.md#getattributestring))
      of this page's attributes which you can use in your respective page type `render` and `serialize` function
      implementing your business and rendering/serialization functionality. Processing the raw value is comprised of **expansion**
      and **conversion**, in this order.
      
      1. **expansion**- dynamic placeholders are transformed into actual values, for example url/link placeholders in       markup text are resolved to real URLs
      2. **conversion**- the raw value (see [Page.getAttribute(String)](dw.experience.Page.md#getattributestring)) is resolved into an actual       DWScript object depending on the type of the attribute as specified in its respective attribute definition        
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

### page
- page: [Page](dw.experience.Page.md) `(read-only)`
  - : Returns the page for which the corresponding page type script is currently executed.


---

### renderParameters
- ~~renderParameters: [String](TopLevel.String.md)~~ `(read-only)`
  - : Returns the `parameters` argument as passed when kicking off page rendering via
      
      - [PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)
      - [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)
      
      and serialization
      
      - [PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)
      - [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


    **Deprecated:**
:::warning
Please use [getRuntimeParameters()](dw.experience.PageScriptContext.md#getruntimeparameters) instead.
:::

---

### runtimeParameters
- runtimeParameters: [String](TopLevel.String.md) `(read-only)`
  - : Returns the `parameters` argument as passed when kicking off page rendering via
      
      - [PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)
      - [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)
      
      and page serialization via
      
      - [PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)
      - [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)



---

## Method Details

### getContent()
- getContent(): [Map](dw.util.Map.md)
  - : Returns the processed version of the underlying unprocessed raw values (also see [Page.getAttribute(String)](dw.experience.Page.md#getattributestring))
      of this page's attributes which you can use in your respective page type `render` and `serialize` function
      implementing your business and rendering/serialization functionality. Processing the raw value is comprised of **expansion**
      and **conversion**, in this order.
      
      1. **expansion**- dynamic placeholders are transformed into actual values, for example url/link placeholders in       markup text are resolved to real URLs
      2. **conversion**- the raw value (see [Page.getAttribute(String)](dw.experience.Page.md#getattributestring)) is resolved into an actual       DWScript object depending on the type of the attribute as specified in its respective attribute definition        
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
    - processed content attributes of the page


---

### getPage()
- getPage(): [Page](dw.experience.Page.md)
  - : Returns the page for which the corresponding page type script is currently executed.

    **Returns:**
    - the currently rendered page


---

### getRenderParameters()
- ~~getRenderParameters(): [String](TopLevel.String.md)~~
  - : Returns the `parameters` argument as passed when kicking off page rendering via
      
      - [PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)
      - [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)
      
      and serialization
      
      - [PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)
      - [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


    **Returns:**
    - the parameters passed to page rendering and serialization

    **Deprecated:**
:::warning
Please use [getRuntimeParameters()](dw.experience.PageScriptContext.md#getruntimeparameters) instead.
:::

---

### getRuntimeParameters()
- getRuntimeParameters(): [String](TopLevel.String.md)
  - : Returns the `parameters` argument as passed when kicking off page rendering via
      
      - [PageMgr.renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)
      - [PageMgr.renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)
      
      and page serialization via
      
      - [PageMgr.serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)
      - [PageMgr.serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


    **Returns:**
    - the parameters passed to page rendering and serialization


---

<!-- prettier-ignore-end -->
