<!-- prettier-ignore-start -->
# Class PageMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.PageMgr](dw.experience.PageMgr.md)

Provides functionality for getting, rendering and serializing page designer managed pages.


The basic flow is to determine a page by either id, category or product

- [getPage(String)](dw.experience.PageMgr.md#getpagestring)
- [getPageByCategory(Category, Boolean, String)](dw.experience.PageMgr.md#getpagebycategorycategory-boolean-string)
- [getPageByProduct(Product, Boolean, String)](dw.experience.PageMgr.md#getpagebyproductproduct-boolean-string)

and then to initiate rendering of this page via

- [renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)
- [renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)

This will trigger page rendering from a top level perspective, i.e. the page serves as entry point and root container of components.



As a related page or component template will likely want to trigger rendering of nested components
within its regions it can do this by first fetching the desired region by ID via
[Page.getRegion(String)](dw.experience.Page.md#getregionstring) or [Component.getRegion(String)](dw.experience.Component.md#getregionstring) and then call to [renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings)
with the recently retrieved region (and optionally provide [RegionRenderSettings](dw.experience.RegionRenderSettings.md) for customized
rendering of region and component wrapper elements).




Similar to the rendering you can also serialize such page to json via

- [serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)
- [serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)

This will trigger page serialization from a top level perspective, i.e. the page serves as entry point and root container of components,
which will automatically traverse all visible components and attach their serialization result to the emitted json.




Various attributes required for rendering and serialization in the corresponding template can be accessed with the
accordant methods of [Page](dw.experience.Page.md) and [Component](dw.experience.Component.md).


**See Also:**
- [Page](dw.experience.Page.md)
- [Region](dw.experience.Region.md)
- [Component](dw.experience.Component.md)


## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [getCustomEditor](dw.experience.PageMgr.md#getcustomeditorstring-map)([String](TopLevel.String.md), [Map](dw.util.Map.md)) | <p>  Initialize the custom editor of given type id using the passed configuration. |
| ~~static [getPage](dw.experience.PageMgr.md#getpagecategory-boolean-string)([Category](dw.catalog.Category.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md))~~ | Get the dynamic page for the given category (including bottom up traversal of the category tree) and aspect type. |
| static [getPage](dw.experience.PageMgr.md#getpagestring)([String](TopLevel.String.md)) | Returns the page identified by the specified id. |
| static [getPageByCategory](dw.experience.PageMgr.md#getpagebycategorycategory-boolean-string)([Category](dw.catalog.Category.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Get the dynamic page for the given category (including bottom up traversal of the category tree) and aspect type. |
| static [getPageByProduct](dw.experience.PageMgr.md#getpagebyproductproduct-boolean-string)([Product](dw.catalog.Product.md), [Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md)) | Get the dynamic page for the given product and aspect type. |
| static [renderPage](dw.experience.PageMgr.md#renderpagestring-map-string)([String](TopLevel.String.md), [Map](dw.util.Map.md), [String](TopLevel.String.md)) | Render a page. |
| static [renderPage](dw.experience.PageMgr.md#renderpagestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Render a page. |
| static [renderRegion](dw.experience.PageMgr.md#renderregionregion)([Region](dw.experience.Region.md)) | <p>Renders a region by triggering rendering of all visible components within  this region. |
| static [renderRegion](dw.experience.PageMgr.md#renderregionregion-regionrendersettings)([Region](dw.experience.Region.md), [RegionRenderSettings](dw.experience.RegionRenderSettings.md)) | <p>Renders a region by triggering rendering of all visible components within  this region. |
| static [serializePage](dw.experience.PageMgr.md#serializepagestring-map-string)([String](TopLevel.String.md), [Map](dw.util.Map.md), [String](TopLevel.String.md)) | Serialize a page as json string. |
| static [serializePage](dw.experience.PageMgr.md#serializepagestring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Serialize a page as json string with the following properties:  <ul>      <li>`String id` - the id of the page</li>      <li>`String type_id` - the id of the page type</li>      <li>`Map<String, Object> data` - the content attribute key value pairs</li>      <li>`Map<String, Object> custom` - the custom key value pairs as produced by the optional page type `serialize` function</li>      <li>`List<Region> regions` - the regions of this page. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### getCustomEditor(String, Map)
- static getCustomEditor(customEditorTypeID: [String](TopLevel.String.md), configuration: [Map](dw.util.Map.md)): [CustomEditor](dw.experience.CustomEditor.md)
  - : 
      
      Initialize the custom editor of given type id using the passed configuration. The initialization
      will trigger the `init` function of the respective custom editor type for which the passed
      custom editor object is being preinitialized with the given configuration (similar to what would
      happen through the `editor_definition` reference by any component type attribute definition).
      
      
      
      
      This method is useful to obtain any custom editor instance you want to reuse within the `init`
      method of another custom editor, e.g. as dependent breakout element.


    **Parameters:**
    - customEditorTypeID - the reference to a custom editor type, e.g. 'com.foo.bar'
    - configuration - the data structure used for preinitialization of the custom editor (also see [CustomEditor.getConfiguration()](dw.experience.CustomEditor.md#getconfiguration)).                            Be aware that this configuration will have to be serializable to JSON itself as it will be passed to Page Designer                            for processing in the UI. So you must not add any values in this map that are not properly serializable. Do not use                            complex DWScript classes that do not support JSON serialization like for instance [Product](dw.catalog.Product.md).

    **Returns:**
    - the initialized custom editor instance


---

### getPage(Category, Boolean, String)
- ~~static getPage(category: [Category](dw.catalog.Category.md), pageMustBeVisible: [Boolean](TopLevel.Boolean.md), aspectTypeID: [String](TopLevel.String.md)): [Page](dw.experience.Page.md)~~
  - : Get the dynamic page for the given category (including bottom up traversal of the category tree) and aspect type.

    **Parameters:**
    - category - category to find the page for, i.e. starting point (inclusive) for the bottom up traversal
    - pageMustBeVisible - while doing the bottom up traversal any attached page whose [Page.isVisible()](dw.experience.Page.md#isvisible) does not yield true will be bypassed in the search
    - aspectTypeID - id of the page-category-assignment aspect type

    **Returns:**
    - the page assigned to the given category. If none is found then the path upwards in the
              category tree is traversed until a category is found that has an implicit (but not explicit) page assignment.
              If category assignments are not supported by the given aspect type or none is found within the
              aforementioned path of categories then `null` is returned.


    **Deprecated:**
:::warning
Please use [getPageByCategory(Category, Boolean, String)](dw.experience.PageMgr.md#getpagebycategorycategory-boolean-string) instead.
:::

---

### getPage(String)
- static getPage(pageID: [String](TopLevel.String.md)): [Page](dw.experience.Page.md)
  - : Returns the page identified by the specified id.

    **Parameters:**
    - pageID - the id of the page

    **Returns:**
    - the page, or null if not found.


---

### getPageByCategory(Category, Boolean, String)
- static getPageByCategory(category: [Category](dw.catalog.Category.md), pageMustBeVisible: [Boolean](TopLevel.Boolean.md), aspectTypeID: [String](TopLevel.String.md)): [Page](dw.experience.Page.md)
  - : Get the dynamic page for the given category (including bottom up traversal of the category tree) and aspect type.

    **Parameters:**
    - category - category to find the page for, i.e. starting point (inclusive) for the bottom up traversal
    - pageMustBeVisible - while doing the bottom up traversal any attached page whose [Page.isVisible()](dw.experience.Page.md#isvisible) does not yield true will be bypassed in the search
    - aspectTypeID - id of the page-category-assignment aspect type

    **Returns:**
    - the page assigned to the given category. If none is found then the path upwards in the
              category tree is traversed until a category is found that has an implicit (but not explicit) page assignment.
              If category assignments are not supported by the given aspect type or none is found within the
              aforementioned path of categories then `null` is returned.



---

### getPageByProduct(Product, Boolean, String)
- static getPageByProduct(product: [Product](dw.catalog.Product.md), pageMustBeVisible: [Boolean](TopLevel.Boolean.md), aspectTypeID: [String](TopLevel.String.md)): [Page](dw.experience.Page.md)
  - : Get the dynamic page for the given product and aspect type.
      
      
      No bottom up traversal of the product's category tree is performed. If you require this then  a
      separate call to [getPageByCategory(Category, Boolean, String)](dw.experience.PageMgr.md#getpagebycategorycategory-boolean-string) (with the category of your choice, e.g. the default
      category of the product) needs to be made.


    **Parameters:**
    - product - product to find the page for
    - pageMustBeVisible - an attached page whose [Page.isVisible()](dw.experience.Page.md#isvisible) does not yield true will be bypassed in the search
    - aspectTypeID - id of the page-product-assignment aspect type

    **Returns:**
    - the page assigned to the given product. If product assignments are not supported by the given
               aspect type then `null` is returned.



---

### renderPage(String, Map, String)
- static renderPage(pageID: [String](TopLevel.String.md), aspectAttributes: [Map](dw.util.Map.md), parameters: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Render a page. This is an extension of [renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string) for the purpose of rendering a
      page that needs to determine pieces of its content at rendering time instead of design time only. Therefore it
      is possible to pass aspect attributes in case the given page is subject to an aspect type. The latter specifies the
      eligible aspect attribute definitions which the passed in aspect attributes will be validated against.
      If the validation fails for any of the following reasons an [AspectAttributeValidationException](dw.experience.AspectAttributeValidationException.md)
      will be thrown:
      
      - any aspect attribute value violates the value domain of the corresponding attribute definition
      - any required aspect attribute value is `null`
      
      Aspect attributes without corresponding attribute definition will be omitted. Once they made it into the rendering
      they will apply if no persistent attribute value exists (taking precedence over default attribute values
      as coming from the attribute definition json) and the attribute has the `dynamic_lookup`
      property defined which contains the aspect attribute alias. The aspect attribute value lookup then happens by taking
      this aspect attribute alias and using it as attribute identifier within the given map of aspect attributes.
      
      
      Due to the nature of using remote includes, also see [renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string), this comes with the url length
      restriction as you already know it from remote includes you implement by hand within your templates. Thus the size of both the
      `aspectAttributes` (keys and values) as well as the `parameters` parameter of this method
      are subject to a length limitation accordingly because they just translate into url parameters of the aforementioned remote includes.
      As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).


    **Parameters:**
    - pageID - the aspect driven page that will be rendered
    - aspectAttributes - the values for the aspect attributes, with the key being the id of the respective attribute definition and                          the value adhering to the type of this attribute definition
    - parameters - the optional parameters passed to page rendering

    **Returns:**
    - the remote include that will yield the markup as produced by page rendering

    **Throws:**
    - dw.experience.AspectAttributeValidationException - if any given aspect attribute value does fulfill its respective attribute definition

    **See Also:**
    - [renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string)


---

### renderPage(String, String)
- static renderPage(pageID: [String](TopLevel.String.md), parameters: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Render a page. All of this is going to happen in two layers of remote includes, therefore pagecaching of page rendering
      is separated from the pagecache lifecycle of the caller. The first one is going to be returned by this method.
      
      - layer 1 - determines visibility fingerprint for the page and all its nested components driven by its visibility rules. This remote include will only be pagecached for a fixed duration if neither the page nor any of its                       nested components carries a visibility rule (configurable in Business Manager via the site's page caching settings). It will then delegate to layer 2.
      - layer 2 - does the actual rendering of the page by invoking its render function. This remote include will factor the previously determined visibility fingerprint in to the pagecache key, in case you decide to use pagecaching.
      
      
      
      The layer 1 remote include is what is returned when calling this method.
      
      
      
      
      The provided `parameters` argument is passed through till the layer 2 remote include which does the actual rendering so that it will be available
      for the `render` function of the invoked page as part of [PageScriptContext.getRuntimeParameters()](dw.experience.PageScriptContext.md#getruntimeparameters). You probably want to
      provide caller parameters from the outside in shape of a json String to the inside of the page rendering, e.g. to loop through query parameters.
      
      
      
      
      The layer 2 remote include performs the rendering of the page and all its nested components within one request. Thus data sharing between
      the page and its nested components can happen in scope of this request.
      
      
      
      
      The rendering of a page invokes the `render` function of the respective page type.
      
      ```
          String : render( PageScriptContext context)
      ```
      
      The return value of the `render` function finally represents the markup produced by this page type.
      
      
      
      
      
      Nested page rendering, i.e. rendering a page within a page (or respectively its components), is not a supported use case.
      
      
      
      
      Due to the nature of the remote includes mentioned above this comes with the url length restriction as you already know it from
      remote includes you implement by hand within your templates. Thus the size of the `parameters` parameter of this
      method has a length limitation accordingly because it just translates into a url parameter of the aforementioned remote includes.
      As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).


    **Parameters:**
    - pageID - the ID of the page that will be rendered
    - parameters - the optional parameters passed to page rendering

    **Returns:**
    - the remote include that will yield the markup as produced by page rendering

    **See Also:**
    - [renderPage(String, Map, String)](dw.experience.PageMgr.md#renderpagestring-map-string)


---

### renderRegion(Region)
- static renderRegion(region: [Region](dw.experience.Region.md)): [String](TopLevel.String.md)
  - : 
      Renders a region by triggering rendering of all visible components within
      this region. For each of these components the render function  of the respective component
      type is invoked.
      
      ```
          String : render( ComponentScriptContext params)
      ```
      
      The return value of the `render` function will be wrapped by an HTML element - this
      finally represents the markup produced by this component type. The markup of the region
      accordingly represents the concatenation of all the components markup within an
      own wrapper element.
      
      The following sample shows how this would look like for a 'pictures' region
      that contains two components of type 'assets.image'. 
      
      
      ```
      <div class="experience-region experience-pictures">
          <div class="experience-component experience-assets-image">
              ...
          </div>
          <div class="experience-component experience-assets-image">
              ..
          </div>
      </div>
      ```
      
      
      
      The system default for region render settings are:
      
      - tag\_name : div
      - attributes : {"class":"experience-region experience-\[REGION\_ID\]"}
      
      
      
      
      
      The system default for component render settings are:
      
      - tag name : div
      - attributes : {"class":"experience-component experience-\[COMPONENT\_TYPE\_ID\]"}
      
      As the \[COMPONENT\_TYPE\_ID\] can contain dots due to its package like naming scheme (e.g. assets.image)
      any occurrences of these dots will be replaced by dashes (e.g. assets-image) so that CSS selectors
      do not have to be escaped.
      
      
      
      
      In order to provide your own settings for the wrapper elements see
      [renderRegion(Region, RegionRenderSettings)](dw.experience.PageMgr.md#renderregionregion-regionrendersettings).
      
      
      
      You must NOT call this method outside of the processing induced by [renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string).


    **Parameters:**
    - region - the region that will be rendered

    **Returns:**
    - the markup as produced by region rendering


---

### renderRegion(Region, RegionRenderSettings)
- static renderRegion(region: [Region](dw.experience.Region.md), regionRenderSettings: [RegionRenderSettings](dw.experience.RegionRenderSettings.md)): [String](TopLevel.String.md)
  - : 
      Renders a region by triggering rendering of all visible components within
      this region. For each of these components the render function of the respective component
      type is invoked.
      
      ```
          String : render( ComponentScriptContext context)
      ```
      
      The return value of the `render` function will be wrapped by an HTML element - this
      finally represents the markup produced by this component type. The markup of the region
      accordingly represents the concatenation of all the components markup within an
      own wrapper element.
      
      In order to provide styling for these wrapper
      elements of the components and the region some render settings can optionally be provided,
      which basically allows to configure which kind of tag is used for the wrapper element and
      which attributes the wrapper element contains. A sample output could look like this if
      [RegionRenderSettings](dw.experience.RegionRenderSettings.md) are applied with customized tag names and attributes
      for the region and component wrapper elements.
      
      
      ```
      <p class="myRegionCssClass">
          <span class="myComponentCssClass myComponentCssClass1" data-foo="bar">
              ...
          </span>
          <span class="myComponentCssClass myComponentCssClass2">
              ...
          </span>
      </p>
      ```
      
      
      
      In order to go with the default settings for the wrapper elements see
      [renderRegion(Region)](dw.experience.PageMgr.md#renderregionregion).
      
      
      
      
      You must NOT call this method outside of the processing induced by [renderPage(String, String)](dw.experience.PageMgr.md#renderpagestring-string).


    **Parameters:**
    - region - the region that will be rendered
    - regionRenderSettings - the render settings that drive how the region and its components is rendered

    **Returns:**
    - the markup as produced by region rendering

    **See Also:**
    - [RegionRenderSettings](dw.experience.RegionRenderSettings.md)


---

### serializePage(String, Map, String)
- static serializePage(pageID: [String](TopLevel.String.md), aspectAttributes: [Map](dw.util.Map.md), parameters: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Serialize a page as json string. This is an extension of [serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string) for the purpose of serializing a
      page that needs to determine pieces of its content at serialization time instead of design time only. Therefore it
      is possible to pass aspect attributes in case the given page is subject to an aspect type. The latter specifies the
      eligible aspect attribute definitions which the passed in aspect attributes will be validated against.
      If the validation fails for any of the following reasons an [AspectAttributeValidationException](dw.experience.AspectAttributeValidationException.md)
      will be thrown:
      
      - any aspect attribute value violates the value domain of the corresponding attribute definition
      - any required aspect attribute value is `null`
      
      Aspect attributes without corresponding attribute definition will be omitted. Once they made it into the serialization
      they will apply if no persistent attribute value exists (taking precedence over default attribute values
      as coming from the attribute definition json) and the attribute has the `dynamic_lookup`
      property defined which contains the aspect attribute alias. The aspect attribute value lookup then happens by taking
      this aspect attribute alias and using it as attribute identifier within the given map of aspect attributes.
      
      
      Due to the nature of using remote includes, also see [serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string), this comes with the url length
      restriction as you already know it from remote includes you implement by hand within your templates. Thus the size of both the
      `aspectAttributes` (keys and values) as well as the `parameters` parameter of this method
      are subject to a length limitation accordingly because they just translate into url parameters of the aforementioned remote includes.
      As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).


    **Parameters:**
    - pageID - the aspect driven page that will be serialized
    - aspectAttributes - the values for the aspect attributes, with the key being the id of the respective attribute definition and                          the value adhering to the type of this attribute definition
    - parameters - the optional parameters passed to page serialization

    **Returns:**
    - the remote include that will yield the json string as produced by page serialization

    **Throws:**
    - dw.experience.AspectAttributeValidationException - if any given aspect attribute value doesn't fulfill its respective attribute definition

    **See Also:**
    - [serializePage(String, String)](dw.experience.PageMgr.md#serializepagestring-string)


---

### serializePage(String, String)
- static serializePage(pageID: [String](TopLevel.String.md), parameters: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Serialize a page as json string with the following properties:
      
      - `String id`- the id of the page
      - `String type_id`- the id of the page type
      - `Map<String, Object>data`- the content attribute key value pairs
      - `Map<String, Object>custom`- the custom key value pairs as produced by the optional page type `serialize`function
      - `List<Region>regions`- the regions of this page. A region consists of the following properties           
        - `String id`- the id of the region
        - `List<Component>components`- the components of this region. A component consists of the following properties                  
          - `String id`- the id of the component
          - `String type_id`- the id of the component type
          - `Map<String, Object>data`- the content attribute key value pairs
          - `Map<String, Object>custom`- the custom key value pairs as produced by the optional component type `serialize`function
          - `List<Region>regions`- the regions of this component
      
      
      
      
      
      All of this is going to happen in two layers of remote includes, therefore pagecaching of page serialization
      is separated from the pagecache lifecycle of the caller. The first one is going to be returned by this method.
      
      - layer 1 - determines visibility fingerprint for the page and all its nested components driven by its visibility rules. This remote include will only be pagecached for a fixed duration if neither the page nor any of its                       nested components carries a visibility rule (configurable in Business Manager via the site's page caching settings). It will then delegate to layer 2.
      - layer 2 - does the actual rendering of the page by invoking its render function. This remote include will factor the previously determined visibility fingerprint in to the pagecache key, in case you decide to use pagecaching.
      
      
      
      
      
      The layer 1 remote include is what is returned when calling this method.
      
      
      
      
      The provided `parameters` argument is passed through till the layer 2 remote include which does the actual serialization so that it will be available
      for the `serialize` function of the invoked page as part of [PageScriptContext.getRuntimeParameters()](dw.experience.PageScriptContext.md#getruntimeparameters). You probably want to
      provide caller parameters from the outside in shape of a json String to the inside of the page serialization, e.g. to loop through query parameters.
      
      
      
      
      The layer 2 remote include performs the serialization of the page and all its nested components within one request. Thus data sharing between
      the page and its nested components can happen in scope of this request.
      
      
      
      
      The serialization of a page also invokes the `serialize` function of the respective page type.
      
      ```
          Object : serialize( PageScriptContext context)
      ```
      
      The return value of the `serialize` function will be injected as property `custom`
      into the json string produced as serialization result for this page type.
      
      
      
      
      
      Nested page serialization, i.e. serializing a page within a page (or respectively its components), is not a supported use case.
      
      
      
      
      Due to the nature of the remote includes mentioned above this comes with the url length restriction as you already know it from
      remote includes you implement by hand within your templates. Thus the size of the `parameters` parameter of this
      method has a length limitation accordingly because it just translates into a url parameter of the aforementioned remote includes.
      As a best practice refrain from passing complex objects (e.g. full blown product models) but keep it rather slim (e.g. only product IDs).


    **Parameters:**
    - pageID - the ID of the page that will be serialized
    - parameters - the optional parameters passed to page serialization

    **Returns:**
    - the remote include that will yield the json string as produced by page serialization

    **See Also:**
    - [serializePage(String, Map, String)](dw.experience.PageMgr.md#serializepagestring-map-string)


---

<!-- prettier-ignore-end -->
